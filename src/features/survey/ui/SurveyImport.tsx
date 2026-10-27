import { useId, useState, type FormEvent } from 'react';
import { Authorized } from '@/shared/auth';
import { useUnits } from '@/shared/units/useUnits';
import { parseSurveyFile } from '../lib/parseFile';
import type { Station } from '../lib/types';
import { useSurveyStore } from '../model/surveyStore';

type Msg = { kind: 'ok' | 'err'; text: string } | null;

export function SurveyImport({
  activeWell,
  onLoaded,
  onLoadSample,
}: {
  activeWell: string | null;
  onLoaded?: (kind: 'plan' | 'actual', wells: Map<string, Station[]>) => void;
  onLoadSample?: () => void | Promise<void>;
}) {
  const setPlan = useSurveyStore((s) => s.setPlan);
  const setActual = useSurveyStore((s) => s.setActual);
  const addLiveStation = useSurveyStore((s) => s.addLiveStation);
  const loadSample = useSurveyStore((s) => s.loadSample);
  const units = useUnits();
  const [msg, setMsg] = useState<Msg>(null);
  const formId = useId();

  async function onFile(kind: 'plan' | 'actual', file: File | undefined) {
    if (!file) return;
    try {
      const fallback = activeWell || 'L1';
      const { wells, issues } = await parseSurveyFile(file, fallback);
      (kind === 'plan' ? setPlan : setActual)(wells);
      onLoaded?.(kind, wells);
      const skipped = issues.length
        ? ` (${issues.length} row(s) skipped — first: row ${issues[0]!.row}, ${issues[0]!.message})`
        : '';
      const wellNames = [...wells.keys()].join(', ');
      const totalStations = [...wells.values()].reduce((sum, s) => sum + s.length, 0);
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
      setMsg({
        kind: 'ok',
        text: 'Sample plan and actual loaded; streaming from surface.',
      });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : String(e) });
    }
  }

  function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeWell) return setMsg({ kind: 'err', text: 'Select a wellbore first.' });
    const f = new FormData(e.currentTarget);
    const result = addLiveStation(activeWell, {
      md: units.parseDepth(Number(f.get('md'))),
      inc: Number(f.get('inc')),
      azi: Number(f.get('azi')),
    });
    if (!result.ok) return setMsg({ kind: 'err', text: result.error });
    setMsg({
      kind: result.point.dls > 3 ? 'err' : 'ok',
      text: `Queued ${activeWell} @ ${units.depth(result.point.md)} · DLS ${units.dls(result.point.dls)}`,
    });
    e.currentTarget.reset();
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
        <div className="row">
          <label className="btn">
            Upload plan
            <input
              type="file"
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
              accept=".csv,.tsv,.txt,.xls,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                void onFile('actual', f);
              }}
            />
          </label>
          <button type="button" className="btn" onClick={() => void handleLoadSample()}>
            Load sample data
          </button>
        </div>
        <form className="grid4" onSubmit={onAdd} aria-label="Add live survey">
          <label className="field">
            MD, {units.unit}
            <input name="md" type="number" step="0.1" inputMode="decimal" required />
          </label>
          <label className="field">
            Inc °
            <input name="inc" type="number" step="0.01" min="0" max="180" inputMode="decimal" required />
          </label>
          <label className="field">
            Azi °
            <input name="azi" type="number" step="0.01" inputMode="decimal" required />
          </label>
          <button className="btn primary" type="submit">
            Add live survey
          </button>
        </form>
      </Authorized>
      <p className={`msg ${msg?.kind ?? ''}`} role="status">
        {msg?.text}
      </p>
    </section>
  );
}
