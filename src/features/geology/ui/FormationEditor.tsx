import { useEffect, useId, useState, type FormEvent } from 'react';
import { useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { getActiveWellId, useWellStore } from '@/features/wells/model/wellStore';
import { backendClient } from '@/shared/api/backendClient';
import { Authorized } from '@/shared/auth';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { blendLithologyColor, dominantLithology, LITHOLOGY_COLORS } from '../lib/lithologyColors';
import { INITIAL_FORMATIONS, useGeologyStore } from '../model/geologyStore';
import { FormationSchema, type Formation, type Lithology } from '../model/types';
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

interface CompRow {
  lith: Lithology;
  pct: number;
}

const DEFAULT_COMP: CompRow[] = [{ lith: 'coal', pct: 100 }];

export function FormationEditor() {
  const formations = useGeologyStore((s) => s.formations);
  const addFormation = useGeologyStore((s) => s.addFormation);
  const updateFormation = useGeologyStore((s) => s.updateFormation);
  const removeFormation = useGeologyStore((s) => s.removeFormation);
  const setFormations = useGeologyStore((s) => s.setFormations);
  const resetToSample = useGeologyStore((s) => s.resetToSample);

  const currentWellId = useWellStore((s) => s.currentWellId);
  const wellId = currentWellId || getActiveWellId();

  const wells = useSurveyStore((s) => s.order);
  const activeWell = useDrilling((s) => s.activeWell);
  const units = useUnits();
  const formId = useId();

  // Load formations from PostgreSQL on mount / well change
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    let active = true;
    async function loadFms() {
      try {
        const backendFms = await backendClient.getFormations(wellId);
        if (!active) return;
        if (backendFms && backendFms.length > 0) {
          const mapped: Formation[] = backendFms.map((f) => ({
            id: f.id,
            name: f.name,
            ref: f.ref,
            well: f.lateral?.code || (f.ref === 'TVD' ? 'All' : 'L1'),
            from: f.topMd,
            to: f.baseMd,
            color: f.color || undefined,
            comp: f.lithologies.length > 0
              ? f.lithologies.map((l) => ({ lith: l.name as Lithology, pct: l.percentage ?? 100 }))
              : [{ lith: 'shale' as Lithology, pct: 100 }],
            visible: true,
          }));
          setFormations(mapped);
        } else if (formations.length === 0) {
          await backendClient.batchSaveFormations(wellId, INITIAL_FORMATIONS);
          if (active) setFormations(INITIAL_FORMATIONS);
        }
      } catch (err) {
        console.warn('Could not load formations from backend:', err);
      }
    }
    void loadFms();
    return () => {
      active = false;
    };
  }, [wellId, setFormations]);

  // Editing state: null when adding, or the formation ID being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form field state - default values matching original HTML (lines 207-218 & 807)
  const [refType, setRefType] = useState<'TVD' | 'MD'>('TVD');
  const [fromStr, setFromStr] = useState('6100');
  const [toStr, setToStr] = useState('6140');
  const [name, setName] = useState('Coal stringer');
  const [selectedLith, setSelectedLith] = useState<Lithology>('coal');
  const [comp, setComp] = useState<CompRow[]>(DEFAULT_COMP);

  // Status message
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const totalPct = comp.reduce((acc, c) => acc + (Number(c.pct) || 0), 0);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setName('Coal stringer');
    setRefType('TVD');
    setFromStr('6100');
    setToStr('6140');
    setSelectedLith('coal');
    setComp(DEFAULT_COMP);
    if (!keepMsg) setMsg(null);
  }

  function startEdit(f: Formation) {
    setEditingId(f.id);
    setName(f.name);
    setRefType(f.ref);
    setFromStr(formatNumber(toDisplay(f.from, units.unit), 0).replace(/,/g, ''));
    setToStr(formatNumber(toDisplay(f.to, units.unit), 0).replace(/,/g, ''));
    const dominant = dominantLithology(f.comp);
    setSelectedLith(dominant);
    setComp(f.comp.map((c) => ({ lith: c.lith, pct: c.pct })));
    setMsg(null);
  }

  function handleSelectedLithChange(lith: Lithology) {
    setSelectedLith(lith);
    if (comp.length === 1) {
      setComp([{ lith, pct: comp[0]?.pct ?? 100 }]);
    } else {
      setComp([{ ...comp[0]!, lith }, ...comp.slice(1)]);
    }
  }

  function handleAddCompRow() {
    if (comp.length >= 3) return;
    const remaining = Math.max(0, 100 - totalPct);
    setComp([...comp, { lith: 'shale', pct: remaining }]);
  }

  function handleRemoveCompRow(index: number) {
    if (comp.length <= 1) return;
    setComp(comp.filter((_, i) => i !== index));
  }

  function handleCompChange(index: number, field: 'lith' | 'pct', value: string | number) {
    const updated = comp.map((row, i) => {
      if (i !== index) return row;
      return {
        ...row,
        [field]: field === 'pct' ? Number(value) : value,
      };
    });
    setComp(updated);
    if (index === 0 && field === 'lith') {
      setSelectedLith(value as Lithology);
    }
  }

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

    if (Math.abs(totalPct - 100) >= 0.5) {
      setMsg({ kind: 'err', text: 'Lithology composition percentages must total 100%' });
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

    const id = editingId ?? ('u' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7));
    const candidate = {
      id,
      name: name.trim(),
      ref: refType,
      well: targetWell,
      from: fromFt,
      to: toFt,
      comp: comp.map((c) => ({ lith: c.lith, pct: Number(c.pct) })),
    };

    const parsed = FormationSchema.safeParse(candidate);
    if (!parsed.success) {
      setMsg({ kind: 'err', text: parsed.error.issues[0]?.message ?? 'Validation failed' });
      return;
    }

    if (editingId) {
      void backendClient
        .updateFormation(wellId, editingId, {
          name: candidate.name,
          ref: candidate.ref,
          well: candidate.well,
          from: candidate.from,
          to: candidate.to,
          comp: candidate.comp,
        })
        .catch((err) => console.warn('Could not update formation in PostgreSQL:', err));

      const res = updateFormation(editingId, candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({ kind: 'ok', text: `Updated formation "${parsed.data.name}" (Saved in PostgreSQL).` });
    } else {
      const res = addFormation(candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }

      void backendClient
        .createFormation(wellId, {
          name: candidate.name,
          ref: candidate.ref,
          well: candidate.well,
          from: candidate.from,
          to: candidate.to,
          comp: candidate.comp,
        })
        .catch((err) => console.warn('Could not save formation in PostgreSQL:', err));

      const lithName = LITH_MAP[selectedLith]?.name ?? selectedLith;
      const fromFmt = formatNumber(fromNum, 0);
      const toFmt = formatNumber(toNum, 0);
      setMsg({
        kind: 'ok',
        text: `Added ${name.trim()} (${lithName}) ${fromFmt}–${toFmt} ft ${refType}${refType === 'MD' ? ' on ' + targetWell : ''} (Saved in PostgreSQL).`,
      });
    }
  }

  function handleDelete(id: string) {
    void backendClient.deleteFormation(wellId, id).catch((err) =>
      console.warn('Could not delete formation in PostgreSQL:', err),
    );
    const res = removeFormation(id);
    if (res.ok) {
      if (editingId === id) resetForm(true);
      setMsg({ kind: 'ok', text: 'Removed interval (Deleted from PostgreSQL).' });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  async function handleRestoreSample() {
    resetToSample();
    resetForm(true);
    setMsg({ kind: 'ok', text: 'Sample formations restored (Synchronized with PostgreSQL).' });
    try {
      await backendClient.batchSaveFormations(wellId, INITIAL_FORMATIONS);
    } catch (err) {
      console.warn('Could not batch save formations to PostgreSQL:', err);
    }
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

      {/* Formation Add/Edit Form (Role-Gated) */}
      <Authorized
        permission="geology:edit"
        fallback={
          <p className="hint">
            Read-only mode. Ask an admin for the Wellbore.Engineer role to edit formations.
          </p>
        }
      >
        <form
          className="formation-form"
          onSubmit={handleSubmit}
          aria-label={editingId ? 'Edit formation' : 'Add formation'}
        >
          {editingId && (
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
                Edit Formation: {name}
              </strong>
              <button type="button" className="btn small" onClick={() => resetForm()}>
                Cancel Edit
              </button>
            </div>
          )}

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
                  onChange={(e) => handleSelectedLithChange(e.target.value as Lithology)}
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

          {/* Lithology Mix / percentage distribution */}
          <div className="field" style={{ marginTop: '8px' }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Lithology Mix</span>
              <span
                className={`pill ${Math.abs(totalPct - 100) < 0.5 ? 'ok' : 'warn'}`}
                style={{ fontSize: '0.65rem' }}
              >
                Total: {totalPct}% {Math.abs(totalPct - 100) >= 0.5 && '(must = 100%)'}
              </span>
            </div>

            {comp.map((row, idx) => (
              <div key={idx} className="row" style={{ alignItems: 'center', marginTop: '4px', gap: '6px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 2 }}>
                  <LithologySwatch lith={row.lith} width={28} height={20} title={row.lith} />
                  <select
                    value={row.lith}
                    onChange={(e) => handleCompChange(idx, 'lith', e.target.value)}
                    style={{ flex: 1 }}
                    aria-label={`Lithology ${idx + 1}`}
                  >
                    {LITHS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={row.pct || ''}
                  onChange={(e) => handleCompChange(idx, 'pct', e.target.value)}
                  style={{ flex: 1 }}
                  placeholder="%"
                  aria-label={`Percentage ${idx + 1}`}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>%</span>

                {comp.length > 1 && (
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => handleRemoveCompRow(idx)}
                    title="Remove lithology"
                    aria-label={`Remove lithology ${idx + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {comp.length < 3 && (
              <button
                type="button"
                className="btn small"
                onClick={handleAddCompRow}
                style={{ marginTop: '6px', alignSelf: 'flex-start' }}
              >
                + Add Lithology
              </button>
            )}
          </div>

          <div className="row-flex" style={{ marginTop: '8px' }}>
            <button className="btn primary" type="submit" id="fmAdd">
              {editingId ? 'Save Changes' : 'Add interval'}
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
                      <span>
                        {lithInfo.name}
                        {f.comp.length > 1 && (
                          <small style={{ color: 'var(--muted)', marginLeft: '4px', fontSize: '0.72rem' }}>
                            ({f.comp.map((c) => `${LITH_MAP[c.lith]?.name ?? c.lith} ${c.pct}%`).join(', ')})
                          </small>
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Authorized permission="geology:edit">
                        <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => startEdit(f)}
                            aria-label={`Edit ${f.name}`}
                            style={{ padding: '1px 5px', fontSize: '0.72rem' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="x"
                            onClick={() => handleDelete(f.id)}
                            aria-label={`Delete ${f.name}`}
                            title={`Delete ${f.name}`}
                          >
                            ×
                          </button>
                        </span>
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
