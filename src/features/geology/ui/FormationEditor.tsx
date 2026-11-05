import { useId, useState, type FormEvent } from 'react';
import { useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { Authorized } from '@/shared/auth';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { blendLithologyColor, dominantLithology, LITHOLOGY_COLORS } from '../lib/lithologyColors';
import { useGeologyStore } from '../model/geologyStore';
import { FormationSchema, type Lithology } from '../model/types';
import { LithologySwatch } from './LithologySwatch';

const LITHS: { id: Lithology; name: string; base: string }[] = [
  { id: 'sandstone', name: 'Sandstone', base: '#f1d36e' },
  { id: 'shale', name: 'Shale', base: '#97a596' },
  { id: 'siltstone', name: 'Siltstone', base: '#d8bc8f' },
  { id: 'limestone', name: 'Limestone', base: '#86b6dc' },
  { id: 'dolomite', name: 'Dolomite', base: '#b9a3dc' },
  { id: 'marl', name: 'Marl', base: '#c5d39b' },
  { id: 'coal', name: 'Coal', base: '#2f2f2f' },
  { id: 'anhydrite', name: 'Anhydrite', base: '#e9b9d2' },
  { id: 'salt', name: 'Salt', base: '#dfe8f4' },
  { id: 'conglomerate', name: 'Conglomerate', base: '#eaa65e' },
  { id: 'chert', name: 'Chert', base: '#e7e1c6' },
  { id: 'basement', name: 'Granite / basement', base: '#e1907f' },
];

const LITH_MAP = Object.fromEntries(LITHS.map((l) => [l.id, l]));

export function FormationEditor() {
  const formations = useGeologyStore((s) => s.formations);
  const addFormation = useGeologyStore((s) => s.addFormation);
  const removeFormation = useGeologyStore((s) => s.removeFormation);
  const resetToSample = useGeologyStore((s) => s.resetToSample);

  const wells = useSurveyStore((s) => s.order);
  const activeWell = useDrilling((s) => s.activeWell);
  const units = useUnits();
  const formId = useId();

  // Form field state - default values matching original HTML (lines 207-218 & 807)
  const [refType, setRefType] = useState<'TVD' | 'MD'>('TVD');
  const [fromStr, setFromStr] = useState('6100');
  const [toStr, setToStr] = useState('6140');
  const [name, setName] = useState('Coal stringer');
  const [selectedLith, setSelectedLith] = useState<Lithology>('coal');

  // Status message
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const fromNum = Number(fromStr);
    const toNum = Number(toStr);

    if (fromStr.trim() === '' || toStr.trim() === '' || isNaN(fromNum) || isNaN(toNum)) {
      setMsg({ kind: 'err', text: 'Enter From and To depths in feet.' });
      return;
    }

    if (toNum <= fromNum) {
      setMsg({ kind: 'err', text: 'To must be deeper than From.' });
      return;
    }

    if (!name.trim()) {
      setMsg({ kind: 'err', text: 'Give the formation a name.' });
      return;
    }

    // Convert display unit to internal feet
    const fromFt = units.parseDepth(fromNum);
    const toFt = units.parseDepth(toNum);

    // When MD, target the currently active wellbore, matching HTML line 817
    const targetWell =
      refType === 'TVD'
        ? 'All'
        : activeWell && wells.includes(activeWell)
          ? activeWell
          : wells[0] ?? 'L1';

    if (refType === 'MD' && !targetWell) {
      setMsg({ kind: 'err', text: 'Load a wellbore before adding MD intervals.' });
      return;
    }

    const id = 'u' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    const candidate = {
      id,
      name: name.trim(),
      ref: refType,
      well: targetWell,
      from: fromFt,
      to: toFt,
      comp: [{ lith: selectedLith, pct: 100 }],
    };

    const parsed = FormationSchema.safeParse(candidate);
    if (!parsed.success) {
      setMsg({ kind: 'err', text: parsed.error.issues[0]?.message ?? 'Validation failed' });
      return;
    }

    const res = addFormation(candidate);
    if (!res.ok) {
      setMsg({ kind: 'err', text: res.error });
      return;
    }

    const lithName = LITH_MAP[selectedLith]?.name ?? selectedLith;
    const fromFmt = formatNumber(fromNum, 0);
    const toFmt = formatNumber(toNum, 0);
    setMsg({
      kind: 'ok',
      text: `Added ${name.trim()} (${lithName}) ${fromFmt}–${toFmt} ft ${refType}${refType === 'MD' ? ' on ' + targetWell : ''}.`,
    });
  }

  function handleDelete(id: string) {
    const res = removeFormation(id);
    if (res.ok) {
      setMsg({ kind: 'ok', text: 'Removed interval.' });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  function handleRestoreSample() {
    resetToSample();
    setMsg({ kind: 'ok', text: 'Sample formations restored.' });
  }

  // Sorted formations matching HTML line 794: TVD first, then MD by from-depth
  const sortedFormations = formations
    .slice()
    .sort((a, b) => (a.ref === b.ref ? a.from - b.from : a.ref === 'TVD' ? -1 : 1));

  return (
    <section className="block" aria-labelledby={`${formId}-title`}>
      <h2>
        Formations &amp; lithology{' '}
        <button type="button" className="btn small" id="fmSample" onClick={handleRestoreSample}>
          Restore sample
        </button>
      </h2>

      {/* Formation Add Form (Role-Gated) */}
      <Authorized
        permission="geology:edit"
        fallback={
          <p className="hint">
            Read-only mode. Ask an admin for the Wellbore.Engineer role to edit formations.
          </p>
        }
      >
        <form className="formation-form" onSubmit={handleSubmit} aria-label="Add formation">
          <div className="grid-fm">
            <label className="field">
              Depth reference
              <select
                id="fmRef"
                value={refType}
                onChange={(e) => setRefType(e.target.value as 'TVD' | 'MD')}
              >
                <option value="TVD">TVD — layer across field</option>
                <option value="MD">MD — along drilling wellbore</option>
              </select>
            </label>
            <label className="field">
              From {units.unit}
              <input
                type="number"
                id="fmFrom"
                step="1"
                inputMode="decimal"
                value={fromStr}
                onChange={(e) => setFromStr(e.target.value)}
                required
              />
            </label>
            <label className="field">
              To {units.unit}
              <input
                type="number"
                id="fmTo"
                step="1"
                inputMode="decimal"
                value={toStr}
                onChange={(e) => setToStr(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="grid-fm2">
            <label className="field">
              Formation name
              <input
                type="text"
                id="fmName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
              />
            </label>
            <label className="field">
              Lithology symbol
              <span className="lith-pick">
                <select
                  id="fmLith"
                  value={selectedLith}
                  onChange={(e) => setSelectedLith(e.target.value as Lithology)}
                >
                  {LITHS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <LithologySwatch
                  id="fmSw"
                  lith={selectedLith}
                  baseColor={LITHOLOGY_COLORS[selectedLith]?.hex}
                  width={60}
                  height={44}
                  className="sw"
                />
              </span>
            </label>
          </div>

          <div className="row-flex">
            <button className="btn primary" type="submit" id="fmAdd">
              Add interval
            </button>
            <p className={`msg ${msg?.kind ?? ''}`} id="fmMsg" role="status">
              {msg?.text}
            </p>
          </div>
        </form>
      </Authorized>

      {/* Formations Table matching HTML layout */}
      <div
        className="table-wrap fm-table"
        style={{ maxHeight: '240px' }}
        role="region"
        aria-label="Formation layers"
      >
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Ref</th>
              <th className="l">Formation</th>
              <th className="l">Lithology</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="fmBody">
            {sortedFormations.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'left' }}>
                  No intervals yet. Add one above.
                </td>
              </tr>
            ) : (
              sortedFormations.map((f) => {
                const dominant = dominantLithology(f.comp);
                const lithInfo = LITH_MAP[dominant] ?? { name: dominant };
                return (
                  <tr key={f.id}>
                    <td>{formatNumber(toDisplay(f.from, units.unit), 0)}</td>
                    <td>{formatNumber(toDisplay(f.to, units.unit), 0)}</td>
                    <td>
                      {f.ref}
                      {f.ref === 'MD' ? ' · ' + f.well : ''}
                    </td>
                    <td className="l">{f.name}</td>
                    <td className="l">
                      <LithologySwatch
                        lith={dominant}
                        baseColor={blendLithologyColor(f.comp).hex}
                        width={24}
                        height={16}
                        className="sw"
                        title={`${f.name} (${dominant})`}
                      />
                      <span>{lithInfo.name}</span>
                    </td>
                    <td style={{ textAlign: 'center', width: '28px' }}>
                      <Authorized permission="geology:edit">
                        <button
                          type="button"
                          className="x"
                          onClick={() => handleDelete(f.id)}
                          aria-label={`Delete ${f.name}`}
                          title={`Delete ${f.name}`}
                        >
                          ×
                        </button>
                      </Authorized>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* USGS Lithology Pattern Legend (12 Types) - Always visible matching HTML lines 223-224 */}
      <div
        className="keygrid"
        id="lithKey"
        role="region"
        aria-label="USGS Lithology Patterns Legend"
      >
        {LITHS.map((l) => (
          <div key={l.id}>
            <LithologySwatch
              lith={l.id}
              width={48}
              height={32}
              className="sw"
              style={{ width: '48px', height: '32px' }}
            />
            <span>{l.name}</span>
          </div>
        ))}
      </div>

      <p className="hint-text">
        TVD intervals are layers across the whole field and appear on the back walls of the 3D block. MD intervals
        apply only to the drilling wellbore and override the layer at that depth, for example a fault block or a
        stringer seen in cuttings.
      </p>
    </section>
  );
}
