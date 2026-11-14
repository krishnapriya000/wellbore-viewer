import { useEffect, useId, useState, type FormEvent } from 'react';
import { useWellStore } from '@/features/wells';
import { Authorized } from '@/shared/auth';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { useWellPlanningStore } from '../model/wellPlanningStore';
import type { WellPlanRecord } from '../model/types';

export function WellPlanningEditor() {
  const formId = useId();
  const units = useUnits();

  const wells = useWellStore((s) => s.wells);
  const currentWellId = useWellStore((s) => s.currentWellId);

  const plans = useWellPlanningStore((s) => s.plans);
  const isLoading = useWellPlanningStore((s) => s.isLoading);
  const storeError = useWellPlanningStore((s) => s.error);
  const fetchPlans = useWellPlanningStore((s) => s.fetchPlans);
  const addPlan = useWellPlanningStore((s) => s.addPlan);
  const updatePlan = useWellPlanningStore((s) => s.updatePlan);
  const deletePlan = useWellPlanningStore((s) => s.deletePlan);

  // Active well determination
  const activeWell = wells.find((w) => w.id === currentWellId) || wells[0];
  const defaultWellId = activeWell?.id || (wells[0]?.id ?? '');

  // Form states
  const [selectedWellId, setSelectedWellId] = useState<string>(defaultWellId);
  const [targetMdStr, setTargetMdStr] = useState('');
  const [targetTvdStr, setTargetTvdStr] = useState('');
  const [targetIncStr, setTargetIncStr] = useState('90.0');
  const [targetAziStr, setTargetAziStr] = useState('45.0');
  const [kickoffDepthStr, setKickoffDepthStr] = useState('4000.0');
  const [targetObjective, setTargetObjective] = useState('');
  const [remarks, setRemarks] = useState('');

  // Editing & confirmation states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterWellId, setFilterWellId] = useState<string>('all');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Keep selectedWellId valid if wells list changes
  const effectiveWellId = selectedWellId || defaultWellId;
  const effectiveWell = wells.find((w) => w.id === effectiveWellId) || activeWell;

  // Load from PostgreSQL on mount and well selection changes
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    let active = true;
    async function load() {
      try {
        const queryWell = filterWellId !== 'all' ? filterWellId : (currentWellId || undefined);
        await fetchPlans(queryWell);
      } catch (err) {
        if (active) console.warn('Could not load well plans:', err);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [fetchPlans, currentWellId, filterWellId]);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setTargetMdStr('');
    setTargetTvdStr('');
    setTargetIncStr('90.0');
    setTargetAziStr('45.0');
    setKickoffDepthStr('4000.0');
    setTargetObjective('');
    setRemarks('');
    if (!keepMsg) setMsg(null);
  }

  function startEdit(plan: WellPlanRecord) {
    setEditingId(plan.id);
    setSelectedWellId(plan.wellId);
    setTargetMdStr(formatNumber(toDisplay(plan.targetDepthMd, units.unit), 1).replace(/,/g, ''));
    setTargetTvdStr(formatNumber(toDisplay(plan.targetDepthTvd, units.unit), 1).replace(/,/g, ''));
    setTargetIncStr(String(plan.targetInclination));
    setTargetAziStr(String(plan.targetAzimuth));
    setKickoffDepthStr(formatNumber(toDisplay(plan.plannedKickoffDepth, units.unit), 1).replace(/,/g, ''));
    setTargetObjective(plan.targetObjective);
    setRemarks(plan.remarks || '');
    setMsg(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const mdNum = Number(targetMdStr);
    const tvdNum = Number(targetTvdStr);
    const incNum = Number(targetIncStr);
    const aziNum = Number(targetAziStr);
    const kopNum = Number(kickoffDepthStr);

    if (isNaN(mdNum) || !targetMdStr.trim()) {
      setMsg({ kind: 'err', text: `Target Depth MD must be a valid number in ${units.unit}.` });
      return;
    }
    if (isNaN(tvdNum) || !targetTvdStr.trim()) {
      setMsg({ kind: 'err', text: `Target Depth TVD must be a valid number in ${units.unit}.` });
      return;
    }
    if (tvdNum > mdNum) {
      setMsg({ kind: 'err', text: 'Target Depth TVD cannot exceed Target Depth MD.' });
      return;
    }
    if (isNaN(kopNum) || !kickoffDepthStr.trim() || kopNum < 0) {
      setMsg({ kind: 'err', text: 'Planned Kickoff Depth must be 0 or greater.' });
      return;
    }
    if (kopNum > mdNum) {
      setMsg({ kind: 'err', text: 'Planned Kickoff Depth cannot exceed Target Depth MD.' });
      return;
    }
    if (isNaN(incNum) || incNum < 0 || incNum > 180) {
      setMsg({ kind: 'err', text: 'Target Inclination must be between 0° and 180°.' });
      return;
    }
    if (isNaN(aziNum) || aziNum < 0 || aziNum > 360) {
      setMsg({ kind: 'err', text: 'Target Azimuth must be between 0° and 360°.' });
      return;
    }
    if (!targetObjective.trim()) {
      setMsg({ kind: 'err', text: 'Target objective description is required.' });
      return;
    }

    const targetWellObj = wells.find((w) => w.id === effectiveWellId);
    const wellName = targetWellObj ? targetWellObj.name : 'Unknown Well';

    // Convert display depth unit to internal feet
    const targetMdFt = units.parseDepth(mdNum);
    const targetTvdFt = units.parseDepth(tvdNum);
    const kickoffDepthFt = units.parseDepth(kopNum);

    const planPayload = {
      wellId: effectiveWellId,
      wellName,
      targetDepthMd: targetMdFt,
      targetDepthTvd: targetTvdFt,
      targetInclination: incNum,
      targetAzimuth: aziNum,
      plannedKickoffDepth: kickoffDepthFt,
      targetObjective: targetObjective.trim(),
      remarks: remarks.trim() || undefined,
    };

    if (editingId) {
      const res = await updatePlan(editingId, planPayload);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Updated well plan for "${wellName}" (Saved in PostgreSQL).`,
      });
    } else {
      const res = await addPlan(planPayload);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Added well plan for "${wellName}" (Saved in PostgreSQL).`,
      });
    }
  }

  async function handleDelete(id: string, wellName?: string) {
    const res = await deletePlan(id);
    setConfirmDeleteId(null);
    if (res.ok) {
      if (editingId === id) resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Deleted well planning record${wellName ? ` for ${wellName}` : ''} (Deleted from PostgreSQL).`,
      });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  const filteredPlans =
    filterWellId === 'all' ? plans : plans.filter((p) => p.wellId === filterWellId);

  return (
    <section className="block" aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`}>
        Well Planning <span className="pill ok">PostgreSQL</span> <span className="pill idle">{plans.length}</span>
      </h2>

      {/* Well filter controls */}
      {wells.length > 1 && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hint">Filter by Well:</span>
          <select
            value={filterWellId}
            onChange={(e) => setFilterWellId(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
            aria-label="Filter well plans by well"
          >
            <option value="all">All Wells ({plans.length})</option>
            {wells.map((w) => {
              const count = plans.filter((p) => p.wellId === w.id).length;
              return (
                <option key={w.id} value={w.id}>
                  {w.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Data Table */}
      <div className="table-wrap" role="region" aria-label="Well planning records table">
        {isLoading && plans.length === 0 ? (
          <p className="hint" style={{ padding: '12px', textAlign: 'center' }}>
            Loading well plans from PostgreSQL...
          </p>
        ) : filteredPlans.length === 0 ? (
          <p className="hint" style={{ padding: '12px', textAlign: 'center' }}>
            No well planning records available. Add a planned target below.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Well</th>
                <th style={{ textAlign: 'left' }}>Objective</th>
                <th>Target MD</th>
                <th>Target TVD</th>
                <th>Inc (°)</th>
                <th>Azi (°)</th>
                <th>KOP</th>
                <th style={{ textAlign: 'left' }}>Remarks</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>
                    {plan.wellName || 'Well'}
                  </td>
                  <td
                    style={{
                      textAlign: 'left',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={plan.targetObjective}
                  >
                    {plan.targetObjective}
                  </td>
                  <td>{units.depth(plan.targetDepthMd)}</td>
                  <td>{units.depth(plan.targetDepthTvd)}</td>
                  <td>{plan.targetInclination.toFixed(1)}°</td>
                  <td>{plan.targetAzimuth.toFixed(1)}°</td>
                  <td>{units.depth(plan.plannedKickoffDepth)}</td>
                  <td
                    style={{
                      textAlign: 'left',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: 'var(--muted)',
                    }}
                    title={plan.remarks || ''}
                  >
                    {plan.remarks || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Authorized
                      permission="construction:edit"
                      fallback={<span className="hint">View only</span>}
                    >
                      {confirmDeleteId === plan.id ? (
                        <span className="row" style={{ gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn small"
                            style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }}
                            onClick={() => void handleDelete(plan.id, plan.wellName)}
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
                        <span className="row" style={{ gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => startEdit(plan)}
                            aria-label={`Edit plan for ${plan.wellName || 'well'}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setConfirmDeleteId(plan.id)}
                            aria-label={`Delete plan for ${plan.wellName || 'well'}`}
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </Authorized>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Form */}
      <Authorized
        permission="construction:edit"
        fallback={
          <p className="hint">
            Read-only mode. Wellbore.Engineer role is required to add or modify well plans.
          </p>
        }
      >
        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--line)',
          }}
          aria-label={editingId ? 'Edit well planning record' : 'Add well planning record'}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingId ? 'Edit Well Plan' : 'Add Well Plan Target'}
            </strong>
            {editingId && (
              <button type="button" className="btn small" onClick={() => resetForm()}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <label className="field">
              Target Well *
              <select
                value={effectiveWellId}
                onChange={(e) => setSelectedWellId(e.target.value)}
                aria-label="Target Well"
              >
                {wells.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.wellCode ? `(${w.wellCode})` : ''}
                  </option>
                ))}
                {wells.length === 0 && (
                  <option value={effectiveWellId}>
                    {effectiveWell?.name || 'Default Well'}
                  </option>
                )}
              </select>
            </label>

            <label className="field">
              Target Objective *
              <input
                type="text"
                value={targetObjective}
                onChange={(e) => setTargetObjective(e.target.value)}
                placeholder="e.g. Reservoir A sand penetration"
                required
                aria-label="Target Objective"
              />
            </label>
          </div>

          <div className="grid4">
            <label className="field">
              Target MD ({units.unit}) *
              <input
                type="number"
                step="0.1"
                min="0"
                value={targetMdStr}
                onChange={(e) => setTargetMdStr(e.target.value)}
                placeholder="e.g. 15000"
                required
                aria-label={`Target Depth MD in ${units.unit}`}
              />
            </label>

            <label className="field">
              Target TVD ({units.unit}) *
              <input
                type="number"
                step="0.1"
                min="0"
                value={targetTvdStr}
                onChange={(e) => setTargetTvdStr(e.target.value)}
                placeholder="e.g. 6000"
                required
                aria-label={`Target Depth TVD in ${units.unit}`}
              />
            </label>

            <label className="field">
              Target Inc (°) *
              <input
                type="number"
                step="0.01"
                min="0"
                max="180"
                value={targetIncStr}
                onChange={(e) => setTargetIncStr(e.target.value)}
                placeholder="e.g. 90.0"
                required
                aria-label="Target Inclination in degrees"
              />
            </label>

            <label className="field">
              Target Azi (°) *
              <input
                type="number"
                step="0.01"
                min="0"
                max="360"
                value={targetAziStr}
                onChange={(e) => setTargetAziStr(e.target.value)}
                placeholder="e.g. 45.0"
                required
                aria-label="Target Azimuth in degrees"
              />
            </label>
          </div>

          <div className="grid4" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <label className="field">
              Planned KOP ({units.unit}) *
              <input
                type="number"
                step="0.1"
                min="0"
                value={kickoffDepthStr}
                onChange={(e) => setKickoffDepthStr(e.target.value)}
                placeholder="e.g. 4000"
                required
                aria-label={`Planned Kickoff Depth in ${units.unit}`}
              />
            </label>

            <label className="field">
              Remarks / Geological Notes
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Geosteering window +/- 5 ft; monitor fault boundary"
                aria-label="Remarks or Geological Notes"
              />
            </label>
          </div>

          <div className="row" style={{ marginTop: '4px' }}>
            <button className="btn primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Well Plan'}
            </button>
            {editingId && (
              <button type="button" className="btn" onClick={() => resetForm()}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </Authorized>

      {storeError && (
        <p className="msg err" role="alert">
          {storeError}
        </p>
      )}

      <p className={`msg ${msg?.kind ?? ''}`} role="status">
        {msg?.text}
      </p>
    </section>
  );
}
