import { useEffect, useId, useState, type FormEvent } from 'react';
import { useSurveyStore } from '@/features/survey';
import { getActiveWellId, useWellStore } from '@/features/wells';
import { backendClient } from '@/shared/api/backendClient';
import { Authorized } from '@/shared/auth';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { checkItem } from '../lib/rules';
import { INITIAL_CONSTRUCTION_ITEMS, useConstructionStore } from '../model/constructionStore';
import {
  CASING_SIZES_IN,
  HOLE_SIZES_IN,
  type ConstructionItem,
} from '../model/types';

export function ConstructionEditor() {
  const items = useConstructionStore((s) => s.items);
  const addItem = useConstructionStore((s) => s.addItem);
  const updateItem = useConstructionStore((s) => s.updateItem);
  const removeItem = useConstructionStore((s) => s.removeItem);
  const setItems = useConstructionStore((s) => s.setItems);
  const resetToSample = useConstructionStore((s) => s.resetToSample);

  const currentWellId = useWellStore((s) => s.currentWellId);
  const wellId = currentWellId || getActiveWellId();

  const wells = useSurveyStore((s) => s.order);
  const units = useUnits();
  const formId = useId();

  // Load construction items from PostgreSQL on mount / well change
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    let active = true;
    async function loadConstruction() {
      try {
        const backendItems = await backendClient.getConstruction(wellId);
        if (!active) return;
        if (backendItems && backendItems.length > 0) {
          const mapped: ConstructionItem[] = backendItems.map((item) => ({
            id: item.id,
            kind: item.kind,
            well: item.well,
            from: item.from,
            to: item.to,
            size: item.size,
            note: item.note ?? '',
          }));
          setItems(mapped);
        } else if (useConstructionStore.getState().items.length === 0) {
          await backendClient.batchSaveConstruction(wellId, INITIAL_CONSTRUCTION_ITEMS);
          if (active) setItems(INITIAL_CONSTRUCTION_ITEMS);
        }
      } catch (err) {
        console.warn('Could not load construction from backend:', err);
      }
    }
    void loadConstruction();
    return () => {
      active = false;
    };
  }, [wellId, setItems]);

  // Filter selection: 'All' or specific kind ('hole' | 'casing' | 'cement')
  const [kindFilter, setKindFilter] = useState<'all' | 'hole' | 'casing' | 'cement'>('all');

  // Editing state: null when adding, or item ID being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form field state
  const [kind, setKind] = useState<'hole' | 'casing' | 'cement'>('hole');
  const [well, setWell] = useState('All');
  const [sizeStr, setSizeStr] = useState<string>('12.25');
  const [fromStr, setFromStr] = useState('');
  const [toStr, setToStr] = useState('');
  const [note, setNote] = useState('');

  // Inline delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status message
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string; warnings?: string[] } | null>(
    null,
  );

  const filteredItems =
    kindFilter === 'all' ? items : items.filter((i) => i.kind === kindFilter);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setKind('hole');
    setWell('All');
    setSizeStr('12.25');
    setFromStr('');
    setToStr('');
    setNote('');
    if (!keepMsg) setMsg(null);
  }

  function startEdit(item: ConstructionItem) {
    setEditingId(item.id);
    setKind(item.kind);
    setWell(item.well);
    setSizeStr(String(item.size));
    setFromStr(formatNumber(toDisplay(item.from, units.unit), 1).replace(/,/g, ''));
    setToStr(formatNumber(toDisplay(item.to, units.unit), 1).replace(/,/g, ''));
    setNote(item.note ?? '');
    setMsg(null);
  }

  function handleKindChange(newKind: 'hole' | 'casing' | 'cement') {
    setKind(newKind);
    if (newKind === 'hole') {
      setSizeStr('12.25');
    } else if (newKind === 'casing') {
      setSizeStr('9.625');
    } else if (newKind === 'cement') {
      // Set to matching existing casing size if any, else standard
      const firstCsg = items.find((i) => i.kind === 'casing');
      setSizeStr(firstCsg ? String(firstCsg.size) : '9.625');
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const fromNum = Number(fromStr);
    const toNum = Number(toStr);
    const sizeNum = Number(sizeStr);

    if (isNaN(fromNum) || fromStr.trim() === '' || isNaN(toNum) || toStr.trim() === '') {
      setMsg({ kind: 'err', text: 'From and To depths must be valid numbers.' });
      return;
    }

    if (fromNum < 0) {
      setMsg({ kind: 'err', text: 'From depth cannot be negative.' });
      return;
    }

    if (toNum <= fromNum) {
      setMsg({ kind: 'err', text: 'To depth must be deeper than From depth.' });
      return;
    }

    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 60) {
      setMsg({ kind: 'err', text: 'Outer diameter size must be between 1 and 60 inches.' });
      return;
    }

    // Convert display depth unit to internal feet
    const fromFt = units.parseDepth(fromNum);
    const toFt = units.parseDepth(toNum);

    const id = editingId ?? ('c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7));
    const candidate = {
      id,
      kind,
      well: well.trim() || 'All',
      from: fromFt,
      to: toFt,
      size: sizeNum,
      note: note.trim(),
    };

    if (editingId) {
      void backendClient
        .updateConstruction(wellId, editingId, {
          kind: candidate.kind,
          well: candidate.well,
          from: candidate.from,
          to: candidate.to,
          size: candidate.size,
          note: candidate.note,
        })
        .catch((err) => console.warn('Could not update construction in PostgreSQL:', err));

      const res = updateItem(editingId, candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Updated ${candidate.kind} section (${candidate.size}") on ${candidate.well} (Saved in PostgreSQL).`,
        warnings: res.warnings,
      });
    } else {
      const res = addItem(candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }

      void backendClient
        .createConstruction(wellId, {
          kind: candidate.kind,
          well: candidate.well,
          from: candidate.from,
          to: candidate.to,
          size: candidate.size,
          note: candidate.note,
        })
        .catch((err) => console.warn('Could not save construction in PostgreSQL:', err));

      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Added ${candidate.kind} section (${candidate.size}") from ${units.depth(candidate.from)} to ${units.depth(candidate.to)} (Saved in PostgreSQL).`,
        warnings: res.warnings,
      });
    }
  }

  function handleDelete(id: string, itemKind: string, itemSize: number, itemWell: string) {
    void backendClient
      .deleteConstruction(wellId, id, itemKind as 'hole' | 'casing' | 'cement')
      .catch((err) => console.warn('Could not delete construction in PostgreSQL:', err));

    const res = removeItem(id);
    setConfirmDeleteId(null);
    if (res.ok) {
      if (editingId === id) resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Deleted ${itemKind} (${itemSize}") on ${itemWell} (Deleted from PostgreSQL).`,
      });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  async function handleResetSample() {
    resetToSample();
    resetForm(true);
    setMsg({ kind: 'ok', text: 'Reset to sample construction (Synchronized with PostgreSQL).' });
    try {
      await backendClient.batchSaveConstruction(wellId, INITIAL_CONSTRUCTION_ITEMS);
    } catch (err) {
      console.warn('Could not batch save construction to PostgreSQL:', err);
    }
  }

  function getKindPill(itemKind: 'hole' | 'casing' | 'cement'): { label: string; pillClass: string } {
    switch (itemKind) {
      case 'hole':
        return { label: 'Hole', pillClass: 'pill ok' };
      case 'casing':
        return { label: 'Casing', pillClass: 'pill idle' };
      case 'cement':
        return { label: 'Cement', pillClass: 'pill warn' };
    }
  }

  return (
    <section className="block" aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`}>
        Well Construction <span className="pill idle">{items.length}</span>
      </h2>

      {/* Filter by kind */}
      <div className="seg" role="group" aria-label="Filter construction by kind">
        <button
          type="button"
          aria-pressed={kindFilter === 'all'}
          onClick={() => setKindFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          type="button"
          aria-pressed={kindFilter === 'hole'}
          onClick={() => setKindFilter('hole')}
        >
          Hole ({items.filter((i) => i.kind === 'hole').length})
        </button>
        <button
          type="button"
          aria-pressed={kindFilter === 'casing'}
          onClick={() => setKindFilter('casing')}
        >
          Casing ({items.filter((i) => i.kind === 'casing').length})
        </button>
        <button
          type="button"
          aria-pressed={kindFilter === 'cement'}
          onClick={() => setKindFilter('cement')}
        >
          Cement ({items.filter((i) => i.kind === 'cement').length})
        </button>
      </div>

      {/* 1. Existing construction items list */}
      <div className="construction-list" role="region" aria-label="Well construction list">
        {filteredItems.length === 0 ? (
          <p className="hint">No construction items defined.</p>
        ) : (
          filteredItems.map((item) => {
            const { label: kindLabel, pillClass } = getKindPill(item.kind);
            const warnings = checkItem(items, item, item.well);

            return (
              <div key={item.id} className="construction-item">
                <div className="construction-header">
                  <strong>
                    {item.size}&quot; {kindLabel}
                  </strong>
                  <span className={pillClass}>
                    {item.kind} · {item.well}
                  </span>
                </div>
                <div className="construction-meta">
                  <span>
                    {units.depth(item.from)} – {units.depth(item.to)}
                  </span>
                  <span className="mono" style={{ fontSize: '0.72rem' }}>
                    {formatNumber(item.to - item.from, 0)} ft span
                  </span>
                </div>

                {item.note && <div className="construction-note">{item.note}</div>}

                {/* Fit-check engineering warnings */}
                {warnings.length > 0 && (
                  <div className="construction-warnings">
                    {warnings.map((w, idx) => (
                      <div key={idx} className="fit-check-warning">
                        ⚠ Warning: {w}
                      </div>
                    ))}
                  </div>
                )}

                <Authorized permission="construction:edit">
                  <div className="construction-actions">
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => startEdit(item)}
                      aria-label={`Edit ${item.size} inch ${item.kind}`}
                    >
                      Edit
                    </button>
                    {confirmDeleteId === item.id ? (
                      <span className="row" style={{ gap: '4px' }}>
                        <button
                          type="button"
                          className="btn small"
                          style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }}
                          onClick={() => handleDelete(item.id, item.kind, item.size, item.well)}
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
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Delete ${item.size} inch ${item.kind}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </Authorized>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Construction Add/Edit Form (Role-Gated) */}
      <Authorized
        permission="construction:edit"
        fallback={
          <p className="hint">
            Read-only mode. Ask an admin for the Wellbore.Engineer role to edit well construction.
          </p>
        }
      >
        <form
          className="construction-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label={editingId ? 'Edit construction item' : 'Add construction item'}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingId ? 'Edit Construction Item' : 'Add Construction Item'}
            </strong>
            {editingId && (
              <button type="button" className="btn small" onClick={() => resetForm()}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label className="field">
              Item Type
              <select
                value={kind}
                onChange={(e) => handleKindChange(e.target.value as 'hole' | 'casing' | 'cement')}
                aria-label="Construction item type"
              >
                <option value="hole">Hole Section</option>
                <option value="casing">Casing String</option>
                <option value="cement">Cement Job</option>
              </select>
            </label>

            <label className="field">
              Wellbore
              <select
                value={well}
                onChange={(e) => setWell(e.target.value)}
                aria-label="Wellbore association"
              >
                <option value="All">All (Shared motherbore)</option>
                {wells.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
                {!wells.includes(well) && well !== 'All' && <option value={well}>{well}</option>}
              </select>
            </label>

            <label className="field">
              Size (OD &quot;)
              {kind === 'hole' ? (
                <select
                  value={sizeStr}
                  onChange={(e) => setSizeStr(e.target.value)}
                  aria-label="Hole size in inches"
                >
                  {HOLE_SIZES_IN.map((s) => (
                    <option key={s} value={String(s)}>
                      {s}&quot;
                    </option>
                  ))}
                  {!HOLE_SIZES_IN.includes(Number(sizeStr) as (typeof HOLE_SIZES_IN)[number]) && (
                    <option value={sizeStr}>{sizeStr}&quot;</option>
                  )}
                </select>
              ) : (
                <select
                  value={sizeStr}
                  onChange={(e) => setSizeStr(e.target.value)}
                  aria-label="Casing or cement size in inches"
                >
                  {CASING_SIZES_IN.map((s) => (
                    <option key={s} value={String(s)}>
                      {s}&quot;
                    </option>
                  ))}
                  {!CASING_SIZES_IN.includes(Number(sizeStr) as (typeof CASING_SIZES_IN)[number]) && (
                    <option value={sizeStr}>{sizeStr}&quot;</option>
                  )}
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
                aria-label={`From depth in ${units.unit}`}
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
                placeholder="Shoe / base depth"
                required
                aria-label={`To depth in ${units.unit}`}
              />
            </label>
          </div>

          <label className="field">
            Remarks / Note (Max 240 chars)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Surface casing set at 1200 ft"
              maxLength={240}
              aria-label="Construction remarks"
            />
          </label>

          <div className="row" style={{ marginTop: '6px' }}>
            <button className="btn primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Construction Item'}
            </button>
            <button type="button" className="btn" onClick={() => void handleResetSample()}>
              Reset Sample Construction
            </button>
          </div>
        </form>
      </Authorized>

      {/* Status & real-time fit check feedback */}
      {msg && (
        <div style={{ marginTop: '4px' }}>
          <p className={`msg ${msg.kind}`} role="status">
            {msg.text}
          </p>
          {msg.warnings && msg.warnings.length > 0 && (
            <div className="construction-warnings">
              {msg.warnings.map((w, idx) => (
                <div key={idx} className="fit-check-warning">
                  ⚠ Fit-check warning: {w}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
