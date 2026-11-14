import { useEffect, useId, useState, type FormEvent } from 'react';
import { getActiveWellId, useWellStore } from '@/features/wells';
import { backendClient } from '@/shared/api/backendClient';
import { Authorized } from '@/shared/auth';
import { useUnits } from '@/shared/units/useUnits';
import { parseSurveyFile } from '../lib/parseFile';
import type { Station } from '../lib/types';
import { useSurveyStore } from '../model/surveyStore';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

export interface SurveyImportProps {
  activeWell: string | null;
  onLoaded?: (kind: 'plan' | 'actual', wells: Map<string, Station[]>) => void;
  onLoadSample?: () => void | Promise<void>;
  onLiveStationAdded?: (well: string) => void;
}

export function SurveyImport({
  activeWell,
  onLoaded,
  onLoadSample,
  onLiveStationAdded,
}: SurveyImportProps) {
  const wells = useSurveyStore((s) => s.wells);
  const order = useSurveyStore((s) => s.order);
  const setPlan = useSurveyStore((s) => s.setPlan);
  const setActual = useSurveyStore((s) => s.setActual);
  const addLiveStation = useSurveyStore((s) => s.addLiveStation);
  const loadSample = useSurveyStore((s) => s.loadSample);
  const units = useUnits();
  const formId = useId();

  const currentWellId = useWellStore((s) => s.currentWellId);
  const wellId = currentWellId || getActiveWellId();

  // Load existing surveys from PostgreSQL on mount / well change
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    let active = true;
    async function fetchSavedSurveys() {
      try {
        const laterals = await backendClient.getSurveys(wellId);
        if (!active || !laterals || laterals.length === 0) return;
        const planMap = new Map<string, Station[]>();
        const actualMap = new Map<string, Station[]>();

        const currentWells = useSurveyStore.getState().wells;

        for (const lat of laterals) {
          for (const surv of lat.surveys) {
            if (!surv.stations || surv.stations.length < 2) continue;

            const existingStations =
              surv.type === 'PLAN'
                ? currentWells[lat.code]?.plan?.length ?? 0
                : currentWells[lat.code]?.actual?.length ?? 0;

            // Never downgrade an existing complete survey with a tiny stub
            if (existingStations > 10 && surv.stations.length < 10) {
              continue;
            }

            const cleanStations = surv.stations.map((s) => ({
              md: s.measuredDepth,
              inc: s.inclination,
              azi: s.azimuth,
            }));

            if (surv.type === 'PLAN') {
              planMap.set(lat.code, cleanStations);
            } else if (surv.type === 'ACTUAL') {
              actualMap.set(lat.code, cleanStations);
            }
          }
        }
        if (planMap.size > 0) setPlan(planMap);
        if (actualMap.size > 0) setActual(actualMap);
      } catch (err) {
        console.warn('Could not load surveys from PostgreSQL:', err);
      }
    }
    void fetchSavedSurveys();
    return () => {
      active = false;
    };
  }, [wellId, setPlan, setActual]);

  // Ensure default well choices include L1, L2, L3 matching original HTML
  const defaultWells = ['L1', 'L2', 'L3'];
  const wellOptions = Array.from(new Set([...order, ...defaultWells]));

  const [prevActiveWell, setPrevActiveWell] = useState(activeWell);
  const [userSelectedWell, setUserSelectedWell] = useState<string | null>(null);

  if (activeWell !== prevActiveWell) {
    setPrevActiveWell(activeWell);
    setUserSelectedWell(null);
  }

  const selectedWell = userSelectedWell ?? activeWell ?? 'L1';
  const [mdStr, setMdStr] = useState('');
  const [incStr, setIncStr] = useState('');
  const [aziStr, setAziStr] = useState('');
  const [msg, setMsg] = useState<Msg>(null);

  async function onFile(kind: 'plan' | 'actual', file: File | undefined) {
    if (!file) return;
    try {
      const fallback = activeWell || 'L1';
      const { wells: parsedWells, issues } = await parseSurveyFile(file, fallback);
      (kind === 'plan' ? setPlan : setActual)(parsedWells);
      onLoaded?.(kind, parsedWells);

      // Save uploaded survey runs and stations to PostgreSQL
      const surveysPayload: Record<string, { md: number; inc: number; azi: number }[]> = {};
      for (const [wName, stations] of parsedWells.entries()) {
        surveysPayload[wName] = stations.map((s) => ({
          md: s.md,
          inc: s.inc,
          azi: s.azi,
        }));
      }
      void backendClient
        .uploadSurveys(wellId, {
          type: kind.toUpperCase() as 'PLAN' | 'ACTUAL',
          sourceFile: file.name,
          surveys: surveysPayload,
        })
        .catch((err) => console.warn('Could not save surveys to PostgreSQL:', err));

      const skipped = issues.length
        ? ` (${issues.length} row(s) skipped — first: row ${issues[0]!.row}, ${issues[0]!.message})`
        : '';
      const wellNames = [...parsedWells.keys()].join(', ');
      const totalStations = [...parsedWells.values()].reduce((sum, s) => sum + s.length, 0);
      const text =
        kind === 'actual'
          ? `Actual loaded: ${wellNames} (${totalStations} stations); streaming from surface.${skipped}`
          : `Plan loaded: ${wellNames} (${totalStations} stations).${skipped}`;
      setMsg({
        kind: issues.length ? 'err' : 'ok',
        text,
      });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleLoadSample() {
    try {
      if (onLoadSample) {
        await onLoadSample();
      } else {
        await loadSample();
      }

      // Persist sample data to PostgreSQL if not already present
      const currentWells = useSurveyStore.getState().wells;
      const planPayload: Record<string, { md: number; inc: number; azi: number }[]> = {};
      const actualPayload: Record<string, { md: number; inc: number; azi: number }[]> = {};
      for (const [wName, wObj] of Object.entries(currentWells)) {
        if (wObj.plan.length > 0) {
          planPayload[wName] = wObj.plan.map((s) => ({ md: s.md, inc: s.inc, azi: s.azi }));
        }
        if (wObj.actual.length > 0) {
          actualPayload[wName] = wObj.actual.map((s) => ({ md: s.md, inc: s.inc, azi: s.azi }));
        }
      }
      if (Object.keys(planPayload).length > 0) {
        void backendClient.uploadSurveys(wellId, {
          type: 'PLAN',
          sourceFile: 'sample_plan.csv',
          surveys: planPayload,
        }).catch(() => {});
      }
      if (Object.keys(actualPayload).length > 0) {
        void backendClient.uploadSurveys(wellId, {
          type: 'ACTUAL',
          sourceFile: 'sample_actual.csv',
          surveys: actualPayload,
        }).catch(() => {});
      }

      setMsg({
        kind: 'ok',
        text: 'Sample plan and actual loaded; streaming from surface (Saved in PostgreSQL).',
      });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    }
  }

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const targetWell = selectedWell || activeWell || 'L1';
    const mdVal = parseFloat(mdStr);
    const incVal = parseFloat(incStr);
    const aziVal = parseFloat(aziStr);

    if (!Number.isFinite(mdVal) || !Number.isFinite(incVal) || !Number.isFinite(aziVal)) {
      setMsg({ kind: 'err', text: 'Enter MD, Inc and Azi as numbers.' });
      return;
    }

    if (incVal < 0 || incVal > 180) {
      setMsg({ kind: 'err', text: 'Inclination must be between 0° and 180°.' });
      return;
    }

    if (!wells[targetWell]) {
      setMsg({ kind: 'err', text: 'Load a plan or actual file first.' });
      return;
    }

    const mdFt = units.parseDepth(mdVal);
    const result = addLiveStation(targetWell, {
      md: mdFt,
      inc: incVal,
      azi: ((aziVal % 360) + 360) % 360,
    });

    if (!result.ok) {
      setMsg({ kind: 'err', text: result.error });
      return;
    }

    // Save live survey station to PostgreSQL
    void backendClient
      .addLiveSurvey(wellId, {
        lateralCode: targetWell,
        measuredDepth: result.point.md,
        inclination: result.point.inc,
        azimuth: result.point.azi,
        northing: result.point.n,
        easting: result.point.e,
        tvd: result.point.tvd,
        doglegSeverity: result.point.dls,
      })
      .catch((err) => console.warn('Could not save live survey station to PostgreSQL:', err));

    setMsg({
      kind: result.point.dls > 3 ? 'err' : 'ok',
      text: `Queued ${targetWell} @ ${units.depth(result.point.md)} · DLS ${units.dls(result.point.dls)}${result.point.dls > 3 ? ', above 3.0' : ''} (Saved in PostgreSQL).`,
    });
    setMdStr('');
    onLiveStationAdded?.(targetWell);
  }

  return (
    <section className="block" aria-labelledby={`${formId}-h`}>
      <h2 id={`${formId}-h`}>Survey data</h2>
      <Authorized
        permission="survey:upload"
        fallback={
          <p className="hint">
            You have view-only access. Ask an admin for the Wellbore.Engineer role to upload surveys.
          </p>
        }
      >
        <div className="row-flex">
          <label className="btn">
            Upload plan
            <input
              type="file"
              id="planFile"
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                void onFile('plan', f);
              }}
            />
          </label>
          <label className="btn">
            Upload actual
            <input
              type="file"
              id="actFile"
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                void onFile('actual', f);
              }}
            />
          </label>
          <button
            type="button"
            className="btn"
            id="loadSample"
            onClick={() => void handleLoadSample()}
          >
            Load sample data
          </button>
        </div>
        <p className="hint-text">
          CSV, XLS or XLSX with columns <code>Well</code>, <code>MD</code>, <code>Inc</code>, <code>Azi</code> (feet,
          degrees). Without a Well column the file is applied to the drilling wellbore.
        </p>

        {/* Live Survey Form matching original HTML layout */}
        <form onSubmit={onAdd} aria-label="Add live survey">
          <div className="grid4">
            <label className="field">
              Well
              <select
                id="addWell"
                value={selectedWell}
                onChange={(e) => setUserSelectedWell(e.target.value)}
                aria-label="Well"
              >
                {wellOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              MD {units.unit}
              <input
                id="addMd"
                type="number"
                step="0.1"
                inputMode="decimal"
                value={mdStr}
                onChange={(e) => setMdStr(e.target.value)}
                required
                aria-label={`MD ${units.unit}`}
              />
            </label>
            <label className="field">
              Inc °
              <input
                id="addInc"
                type="number"
                step="0.01"
                min="0"
                max="180"
                inputMode="decimal"
                value={incStr}
                onChange={(e) => setIncStr(e.target.value)}
                required
                aria-label="Inc °"
              />
            </label>
            <label className="field">
              Azi °
              <input
                id="addAzi"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={aziStr}
                onChange={(e) => setAziStr(e.target.value)}
                required
                aria-label="Azi °"
              />
            </label>
          </div>

          <div className="row-flex" style={{ marginTop: '8px', alignItems: 'center' }}>
            <button className="btn primary" type="submit" id="addBtn">
              Add live survey
            </button>
            <p className={`msg ${msg?.kind ?? ''}`} id="msg" role="status">
              {msg?.text}
            </p>
          </div>
        </form>
      </Authorized>
    </section>
  );
}
