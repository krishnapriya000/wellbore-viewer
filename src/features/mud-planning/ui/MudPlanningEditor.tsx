import { useEffect, useId, useState, type FormEvent } from 'react';
import { useWellStore } from '@/features/wells';
import { Authorized } from '@/shared/auth';
import { useMudPlanningStore } from '../model/mudPlanningStore';
import { STANDARD_MUD_TYPES, type MudPlanRecord } from '../model/types';

export function MudPlanningEditor() {
  const formId = useId();

  const wells = useWellStore((s) => s.wells);
  const currentWellId = useWellStore((s) => s.currentWellId);

  const plans = useMudPlanningStore((s) => s.plans);
  const isLoading = useMudPlanningStore((s) => s.isLoading);
  const storeError = useMudPlanningStore((s) => s.error);
  const fetchPlans = useMudPlanningStore((s) => s.fetchPlans);
  const addPlan = useMudPlanningStore((s) => s.addPlan);
  const updatePlan = useMudPlanningStore((s) => s.updatePlan);
  const deletePlan = useMudPlanningStore((s) => s.deletePlan);

  const activeWell = wells.find((w) => w.id === currentWellId) || wells[0];
  const defaultWellId = activeWell?.id || (wells[0]?.id ?? '');

  // Form states
  const [selectedWellId, setSelectedWellId] = useState<string>(defaultWellId);
  const [mudType, setMudType] = useState<string>(STANDARD_MUD_TYPES[0]);
  const [isCustomMudType, setIsCustomMudType] = useState(false);
  const [customMudType, setCustomMudType] = useState('');
  const [mudWeightStr, setMudWeightStr] = useState('9.5');
  const [pvStr, setPvStr] = useState('18');
  const [ypStr, setYpStr] = useState('14');
  const [fluidLossStr, setFluidLossStr] = useState('6.0');
  const [remarks, setRemarks] = useState('');

  // Editing & confirmation states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterWellId, setFilterWellId] = useState<string>('all');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

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
        if (active) console.warn('Could not load mud plans:', err);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [fetchPlans, currentWellId, filterWellId]);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setMudType(STANDARD_MUD_TYPES[0]);
    setIsCustomMudType(false);
    setCustomMudType('');
    setMudWeightStr('9.5');
    setPvStr('18');
    setYpStr('14');
    setFluidLossStr('6.0');
    setRemarks('');
    if (!keepMsg) setMsg(null);
  }

  function startEdit(plan: MudPlanRecord) {
    setEditingId(plan.id);
    setSelectedWellId(plan.wellId);
    if ((STANDARD_MUD_TYPES as readonly string[]).includes(plan.mudType)) {
      setMudType(plan.mudType);
      setIsCustomMudType(false);
      setCustomMudType('');
    } else {
      setIsCustomMudType(true);
      setCustomMudType(plan.mudType);
    }
    setMudWeightStr(String(plan.mudWeight));
    setPvStr(String(plan.plasticViscosity));
    setYpStr(String(plan.yieldPoint));
    setFluidLossStr(String(plan.fluidLoss));
    setRemarks(plan.remarks || '');
    setMsg(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const weightNum = Number(mudWeightStr);
    const pvNum = Number(pvStr);
    const ypNum = Number(ypStr);
    const flNum = Number(fluidLossStr);
    const resolvedMudType = (isCustomMudType ? customMudType : mudType).trim();

    if (!resolvedMudType) {
      setMsg({ kind: 'err', text: 'Mud Type is required.' });
      return;
    }
    if (isNaN(weightNum) || !mudWeightStr.trim() || weightNum <= 0) {
      setMsg({ kind: 'err', text: 'Mud Weight must be a positive number (ppg).' });
      return;
    }
    if (weightNum > 25) {
      setMsg({ kind: 'err', text: 'Mud Weight cannot exceed 25.0 ppg.' });
      return;
    }
    if (isNaN(pvNum) || !pvStr.trim() || pvNum < 0) {
      setMsg({ kind: 'err', text: 'Plastic Viscosity (PV) must be 0 or greater (cP).' });
      return;
    }
    if (pvNum > 150) {
      setMsg({ kind: 'err', text: 'Plastic Viscosity (PV) cannot exceed 150 cP.' });
      return;
    }
    if (isNaN(ypNum) || !ypStr.trim() || ypNum < 0) {
      setMsg({ kind: 'err', text: 'Yield Point (YP) must be 0 or greater (lb/100ft²).' });
      return;
    }
    if (ypNum > 120) {
      setMsg({ kind: 'err', text: 'Yield Point (YP) cannot exceed 120 lb/100ft².' });
      return;
    }
    if (isNaN(flNum) || !fluidLossStr.trim() || flNum < 0) {
      setMsg({ kind: 'err', text: 'Fluid Loss must be 0 or greater (mL/30min).' });
      return;
    }
    if (flNum > 100) {
      setMsg({ kind: 'err', text: 'Fluid Loss cannot exceed 100 mL/30min.' });
      return;
    }

    const targetWellObj = wells.find((w) => w.id === effectiveWellId);
    const wellName = targetWellObj ? targetWellObj.name : 'Unknown Well';

    const planPayload = {
      wellId: effectiveWellId,
      wellName,
      mudType: resolvedMudType,
      mudWeight: weightNum,
      plasticViscosity: pvNum,
      yieldPoint: ypNum,
      fluidLoss: flNum,
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
        text: `Updated mud plan (${resolvedMudType}, ${weightNum} ppg) for "${wellName}" (Saved in PostgreSQL).`,
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
        text: `Added mud plan (${resolvedMudType}, ${weightNum} ppg) for "${wellName}" (Saved in PostgreSQL).`,
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
        text: `Deleted mud planning record${wellName ? ` for ${wellName}` : ''} (Deleted from PostgreSQL).`,
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
        Mud Planning <span className="pill ok">PostgreSQL</span> <span className="pill idle">{plans.length}</span>
      </h2>

      {/* Well filter controls */}
      {wells.length > 1 && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hint">Filter by Well:</span>
          <select
            value={filterWellId}
            onChange={(e) => setFilterWellId(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
            aria-label="Filter mud plans by well"
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
      <div className="table-wrap" role="region" aria-label="Mud planning records table">
        {isLoading && plans.length === 0 ? (
          <p className="hint" style={{ padding: '12px', textAlign: 'center' }}>
            Loading mud plans from PostgreSQL...
          </p>
        ) : filteredPlans.length === 0 ? (
          <p className="hint" style={{ padding: '12px', textAlign: 'center' }}>
            No mud planning records available. Configure a drilling fluid plan below.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Well</th>
                <th style={{ textAlign: 'left' }}>Mud Type</th>
                <th>Weight (ppg)</th>
                <th>PV (cP)</th>
                <th>YP (lb/100ft²)</th>
                <th>Fluid Loss (mL)</th>
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
                  <td style={{ textAlign: 'left' }}>
                    <span className="pill ok" style={{ fontSize: '0.68rem' }}>
                      {plan.mudType}
                    </span>
                  </td>
                  <td className="mono">{plan.mudWeight.toFixed(2)}</td>
                  <td className="mono">{plan.plasticViscosity.toFixed(0)}</td>
                  <td className="mono">{plan.yieldPoint.toFixed(0)}</td>
                  <td className="mono">{plan.fluidLoss.toFixed(1)}</td>
                  <td
                    style={{
                      textAlign: 'left',
                      maxWidth: '140px',
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
                            aria-label={`Edit mud plan for ${plan.wellName || 'well'}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setConfirmDeleteId(plan.id)}
                            aria-label={`Delete mud plan for ${plan.wellName || 'well'}`}
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
            Read-only mode. Wellbore.Engineer role is required to add or modify mud plans.
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
          aria-label={editingId ? 'Edit mud planning record' : 'Add mud planning record'}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingId ? 'Edit Mud Plan' : 'Add Mud Planning Record'}
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
              Mud Type *
              <div className="row" style={{ gap: '6px' }}>
                <select
                  value={isCustomMudType ? '__custom__' : mudType}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomMudType(true);
                    } else {
                      setIsCustomMudType(false);
                      setMudType(e.target.value);
                    }
                  }}
                  aria-label="Mud Type Select"
                  style={{ flex: 1 }}
                >
                  {STANDARD_MUD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                  <option value="__custom__">Other / Custom Fluid...</option>
                </select>
                {isCustomMudType && (
                  <input
                    type="text"
                    value={customMudType}
                    onChange={(e) => setCustomMudType(e.target.value)}
                    placeholder="Custom Mud Name"
                    style={{ flex: 1 }}
                    required
                    aria-label="Custom Mud Type"
                  />
                )}
              </div>
            </label>
          </div>

          <div className="grid4">
            <label className="field">
              Mud Weight (ppg) *
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="25"
                value={mudWeightStr}
                onChange={(e) => setMudWeightStr(e.target.value)}
                placeholder="e.g. 9.5"
                required
                aria-label="Mud Weight in ppg"
              />
            </label>

            <label className="field">
              Plastic Viscosity (cP) *
              <input
                type="number"
                step="1"
                min="0"
                max="150"
                value={pvStr}
                onChange={(e) => setPvStr(e.target.value)}
                placeholder="e.g. 18"
                required
                aria-label="Plastic Viscosity in cP"
              />
            </label>

            <label className="field">
              Yield Point (lb/100ft²) *
              <input
                type="number"
                step="1"
                min="0"
                max="120"
                value={ypStr}
                onChange={(e) => setYpStr(e.target.value)}
                placeholder="e.g. 14"
                required
                aria-label="Yield Point in lb/100ft²"
              />
            </label>

            <label className="field">
              Fluid Loss (mL/30min) *
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={fluidLossStr}
                onChange={(e) => setFluidLossStr(e.target.value)}
                placeholder="e.g. 6.0"
                required
                aria-label="Fluid Loss in mL/30min"
              />
            </label>
          </div>

          <label className="field">
            Remarks & Fluid Additives
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Bentonite + PAC-R; maintain pH 9.0-10.0; barite on standby for trips"
              aria-label="Remarks and Additives"
            />
          </label>

          <div className="row" style={{ marginTop: '4px' }}>
            <button className="btn primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Mud Plan'}
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
