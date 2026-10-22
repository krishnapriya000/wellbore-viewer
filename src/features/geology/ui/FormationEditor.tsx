import { useId, useState, type FormEvent } from 'react';
import { useSurveyStore } from '@/features/survey';
import { Authorized } from '@/shared/auth';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { useGeologyStore } from '../model/geologyStore';
import {
  FormationSchema,
  LITHOLOGIES,
  type Formation,
  type Lithology,
} from '../model/types';

interface CompRow {
  lith: Lithology;
  pct: number;
}

const DEFAULT_COMP: CompRow[] = [{ lith: 'sandstone', pct: 100 }];

export function FormationEditor() {
  const formations = useGeologyStore((s) => s.formations);
  const addFormation = useGeologyStore((s) => s.addFormation);
  const updateFormation = useGeologyStore((s) => s.updateFormation);
  const removeFormation = useGeologyStore((s) => s.removeFormation);
  const resetToSample = useGeologyStore((s) => s.resetToSample);

  const wells = useSurveyStore((s) => s.order);
  const units = useUnits();
  const formId = useId();

  // Editing state: null when adding a new formation, or the Formation object being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form field state
  const [name, setName] = useState('');
  const [refType, setRefType] = useState<'TVD' | 'MD'>('TVD');
  const [well, setWell] = useState('All');
  const [fromStr, setFromStr] = useState('');
  const [toStr, setToStr] = useState('');
  const [comp, setComp] = useState<CompRow[]>(DEFAULT_COMP);

  // Inline delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status message
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const totalPct = comp.reduce((acc, c) => acc + (Number(c.pct) || 0), 0);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setName('');
    setRefType('TVD');
    setWell('All');
    setFromStr('');
    setToStr('');
    setComp(DEFAULT_COMP);
    if (!keepMsg) setMsg(null);
  }

  function startEdit(f: Formation) {
    setEditingId(f.id);
    setName(f.name);
    setRefType(f.ref);
    setWell(f.well);
    // Display in active depth unit
    setFromStr(formatNumber(toDisplay(f.from, units.unit), 1).replace(/,/g, ''));
    setToStr(formatNumber(toDisplay(f.to, units.unit), 1).replace(/,/g, ''));
    setComp(f.comp.map((c) => ({ lith: c.lith, pct: c.pct })));
    setMsg(null);
  }

  function handleRefChange(newRef: 'TVD' | 'MD') {
    setRefType(newRef);
    if (newRef === 'TVD') {
      setWell('All');
    } else if (well === 'All' && wells.length > 0) {
      setWell(wells[0] ?? 'L1');
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
    setComp(
      comp.map((row, i) => {
        if (i !== index) return row;
        return {
          ...row,
          [field]: field === 'pct' ? Number(value) : value,
        };
      }),
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const fromNum = Number(fromStr);
    const toNum = Number(toStr);

    if (isNaN(fromNum) || isNaN(toNum)) {
      setMsg({ kind: 'err', text: 'From and To depths must be valid numbers.' });
      return;
    }

    // Convert display unit to internal feet
    const fromFt = units.parseDepth(fromNum);
    const toFt = units.parseDepth(toNum);

    const candidate = {
      id: editingId ?? 'temp-id',
      name: name.trim(),
      ref: refType,
      well: refType === 'TVD' ? 'All' : well.trim(),
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
      const res = updateFormation(editingId, candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({ kind: 'ok', text: `Updated formation "${parsed.data.name}".` });
    } else {
      const res = addFormation(candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({ kind: 'ok', text: `Added formation "${parsed.data.name}".` });
    }
  }

  function handleDelete(id: string, fName: string) {
    const res = removeFormation(id);
    setConfirmDeleteId(null);
    if (res.ok) {
      if (editingId === id) resetForm(true);
      setMsg({ kind: 'ok', text: `Deleted formation "${fName}".` });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  return (
    <section className="block" aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`}>
        Formations & Lithology <span className="pill idle">{formations.length}</span>
      </h2>

      {/* 1. Existing formations list */}
      <div className="formation-list" role="region" aria-label="Formation layers">
        {formations.length === 0 ? (
          <p className="hint">No formations defined.</p>
        ) : (
          formations.map((f) => (
            <div key={f.id} className="formation-item">
              <div className="formation-header">
                <strong>{f.name}</strong>
                <span className={`pill ${f.ref === 'TVD' ? 'ok' : 'warn'}`}>
                  {f.ref} · {f.well}
                </span>
              </div>
              <div className="formation-meta">
                <span>
                  {units.depth(f.from)} – {units.depth(f.to)}
                </span>
                <span className="formation-comp">
                  {f.comp.map((c) => `${c.lith} ${c.pct}%`).join(', ')}
                </span>
              </div>
              <Authorized permission="geology:edit">
                <div className="formation-actions">
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => startEdit(f)}
                    aria-label={`Edit ${f.name}`}
                  >
                    Edit
                  </button>
                  {confirmDeleteId === f.id ? (
                    <span className="row" style={{ gap: '4px' }}>
                      <button
                        type="button"
                        className="btn small"
                        style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }}
                        onClick={() => handleDelete(f.id, f.name)}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => setConfirmDeleteId(f.id)}
                      aria-label={`Delete ${f.name}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </Authorized>
            </div>
          ))
        )}
      </div>

      {/* 2. Formation Add/Edit Form (Role-Gated) */}
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
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingId ? `Edit Formation: ${name}` : 'Add New Formation'}
            </strong>
            {editingId && (
              <button type="button" className="btn small" onClick={() => resetForm()}>
                Cancel Edit
              </button>
            )}
          </div>

          <label className="field">
            Formation Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Target Sand"
              required
              maxLength={80}
            />
          </label>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label className="field">
              Reference
              <select
                value={refType}
                onChange={(e) => handleRefChange(e.target.value as 'TVD' | 'MD')}
              >
                <option value="TVD">TVD (Layer across field)</option>
                <option value="MD">MD (Wellbore override)</option>
              </select>
            </label>

            <label className="field">
              Wellbore
              {refType === 'TVD' ? (
                <input type="text" value="All" disabled />
              ) : (
                <select value={well} onChange={(e) => setWell(e.target.value)}>
                  {wells.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                  {!wells.includes(well) && well !== 'All' && <option value={well}>{well}</option>}
                </select>
              )}
            </label>
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label className="field">
              From ({units.unit})
              <input
                type="number"
                step="0.1"
                min="0"
                value={fromStr}
                onChange={(e) => setFromStr(e.target.value)}
                placeholder="Top depth"
                required
              />
            </label>

            <label className="field">
              To ({units.unit})
              <input
                type="number"
                step="0.1"
                min="0"
                value={toStr}
                onChange={(e) => setToStr(e.target.value)}
                placeholder="Base depth"
                required
              />
            </label>
          </div>

          <div className="field">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Lithology Mix</span>
              <span
                className={`pill ${Math.abs(totalPct - 100) < 0.5 ? 'ok' : 'warn'}`}
                style={{ fontSize: '0.65rem' }}
              >
                Total: {totalPct}% {Math.abs(totalPct - 100) >= 0.5 && '(must = 100%)'}
              </span>
            </div>

            {comp.map((row, idx) => (
              <div
                key={idx}
                className="row"
                style={{ alignItems: 'center', marginTop: '4px', gap: '6px' }}
              >
                <select
                  value={row.lith}
                  onChange={(e) => handleCompChange(idx, 'lith', e.target.value)}
                  style={{ flex: 2 }}
                  aria-label={`Lithology ${idx + 1}`}
                >
                  {LITHOLOGIES.map((lith) => (
                    <option key={lith} value={lith}>
                      {lith}
                    </option>
                  ))}
                </select>

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

          <div className="row" style={{ marginTop: '6px' }}>
            <button className="btn primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Formation'}
            </button>
            <button type="button" className="btn" onClick={() => void resetToSample()}>
              Reset Sample Formations
            </button>
          </div>
        </form>
      </Authorized>

      <p className={`msg ${msg?.kind ?? ''}`} role="status">
        {msg?.text}
      </p>
    </section>
  );
}
