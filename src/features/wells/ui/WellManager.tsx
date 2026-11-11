import { useEffect, useState, type FormEvent } from 'react';
import { useWellStore } from '../model/wellStore';

export function WellManager() {
  const wells = useWellStore((s) => s.wells);
  const currentWellId = useWellStore((s) => s.currentWellId);
  const fetchWells = useWellStore((s) => s.fetchWells);
  const setCurrentWellId = useWellStore((s) => s.setCurrentWellId);
  const createWell = useWellStore((s) => s.createWell);
  const updateWell = useWellStore((s) => s.updateWell);
  const createLateral = useWellStore((s) => s.createLateral);

  const [isAddingWell, setIsAddingWell] = useState(false);
  const [isEditingWell, setIsEditingWell] = useState(false);
  const [isAddingLateral, setIsAddingLateral] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [wellCode, setWellCode] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Lateral form
  const [latCode, setLatCode] = useState('L4');
  const [latName, setLatName] = useState('Third Branch');
  const [latType, setLatType] = useState<'MAIN' | 'BRANCH'>('BRANCH');

  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    void fetchWells();
  }, [fetchWells]);

  const activeWell = wells.find((w) => w.id === currentWellId) || wells[0];

  function startEditWell() {
    if (!activeWell) return;
    setName(activeWell.name);
    setWellCode(activeWell.wellCode || '');
    setFieldName(activeWell.fieldName || '');
    setLocation(activeWell.location || '');
    setDescription(activeWell.description || '');
    setIsEditingWell(true);
    setIsAddingWell(false);
    setMsg(null);
  }

  async function handleSaveWell(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!name.trim()) {
      setMsg({ kind: 'err', text: 'Well name is required.' });
      return;
    }

    try {
      if (isEditingWell && activeWell) {
        await updateWell(activeWell.id, {
          name: name.trim(),
          wellCode: wellCode.trim() || null,
          fieldName: fieldName.trim() || null,
          location: location.trim() || null,
          description: description.trim() || null,
        });
        setIsEditingWell(false);
        setMsg({ kind: 'ok', text: `Well "${name}" updated successfully in PostgreSQL.` });
      } else {
        const created = await createWell({
          name: name.trim(),
          wellCode: wellCode.trim() || undefined,
          fieldName: fieldName.trim() || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
        });
        setIsAddingWell(false);
        setMsg({ kind: 'ok', text: `Well "${created.name}" created successfully in PostgreSQL.` });
      }
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    }
  }

  async function handleAddLateral(e: FormEvent) {
    e.preventDefault();
    if (!activeWell) return;
    setMsg(null);

    if (!latCode.trim()) {
      setMsg({ kind: 'err', text: 'Lateral code (e.g. L4) is required.' });
      return;
    }

    try {
      await createLateral(activeWell.id, {
        code: latCode.trim(),
        name: latName.trim() || undefined,
        type: latType,
      });
      setIsAddingLateral(false);
      setMsg({ kind: 'ok', text: `Lateral "${latCode}" created for ${activeWell.name} in PostgreSQL.` });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <div className="block" style={{ borderLeft: '3px solid var(--accent)' }}>
      <h2>
        Well & Lateral Management
        <span className="pill ok">PostgreSQL</span>
      </h2>

      {/* Current Well Selector and Info */}
      <div className="row-flex" style={{ justifyContent: 'space-between' }}>
        <label className="field" style={{ flex: 1 }}>
          Active Well
          <select
            value={activeWell?.id || ''}
            onChange={(e) => setCurrentWellId(e.target.value)}
            disabled={isAddingWell || isEditingWell}
          >
            {wells.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.wellCode ? `(${w.wellCode})` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="row-flex" style={{ marginTop: '18px' }}>
          {!isAddingWell && !isEditingWell && (
            <>
              <button
                type="button"
                className="btn small"
                onClick={startEditWell}
                title="Edit active well details"
              >
                Edit
              </button>
              <button
                type="button"
                className="btn small primary"
                onClick={() => {
                  setName('');
                  setWellCode('');
                  setFieldName('');
                  setLocation('');
                  setDescription('');
                  setIsAddingWell(true);
                  setIsEditingWell(false);
                  setMsg(null);
                }}
              >
                + New Well
              </button>
            </>
          )}
        </div>
      </div>

      {/* Well Meta Readout */}
      {activeWell && !isAddingWell && !isEditingWell && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--muted)',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--surface-2)',
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          <span>
            Field: <b style={{ color: 'var(--ink)' }}>{activeWell.fieldName || 'None'}</b>
          </span>
          <span>
            Code: <b style={{ color: 'var(--ink)' }}>{activeWell.wellCode || 'None'}</b>
          </span>
          <span>
            Laterals: <b style={{ color: 'var(--accent)' }}>{activeWell.laterals.length}</b>
          </span>
        </div>
      )}

      {/* Add / Edit Well Form */}
      {(isAddingWell || isEditingWell) && (
        <form onSubmit={handleSaveWell} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <strong style={{ fontSize: '0.85rem' }}>{isEditingWell ? 'Edit Well Details' : 'Create New Well'}</strong>
          <div className="row-flex">
            <label className="field" style={{ flex: 1.5 }}>
              Well Name *
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Well-01"
                required
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Well Code
              <input
                type="text"
                value={wellCode}
                onChange={(e) => setWellCode(e.target.value)}
                placeholder="e.g. W-01"
              />
            </label>
          </div>
          <div className="row-flex">
            <label className="field" style={{ flex: 1 }}>
              Field Name
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. North Sea Block A"
              />
            </label>
            <label className="field" style={{ flex: 1 }}>
              Location
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Offshore Platform 2"
              />
            </label>
          </div>
          <label className="field">
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Remarks or geological notes"
            />
          </label>
          <div className="row-flex">
            <button type="submit" className="btn primary small">
              {isEditingWell ? 'Save Changes' : 'Create Well'}
            </button>
            <button
              type="button"
              className="btn small"
              onClick={() => {
                setIsAddingWell(false);
                setIsEditingWell(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Laterals List for Active Well */}
      {activeWell && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="row-flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hint-text" style={{ fontWeight: 600 }}>
              Laterals for {activeWell.name}:
            </span>
            {!isAddingLateral && (
              <button
                type="button"
                className="btn small"
                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                onClick={() => setIsAddingLateral(true)}
              >
                + Add Lateral
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {activeWell.laterals.map((lat) => (
              <span
                key={lat.id}
                className="pill"
                style={{
                  background: 'var(--surface-2)',
                  borderColor: lat.type === 'MAIN' ? 'var(--accent)' : 'var(--line)',
                  padding: '3px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <b style={{ color: 'var(--ink)' }}>{lat.code}</b>
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                  {lat.type === 'MAIN' ? 'Main' : 'Branch'}
                </span>
              </span>
            ))}
          </div>

          {isAddingLateral && (
            <form onSubmit={handleAddLateral} style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', marginTop: '4px' }}>
              <label className="field" style={{ width: '80px' }}>
                Code
                <input
                  type="text"
                  value={latCode}
                  onChange={(e) => setLatCode(e.target.value)}
                  placeholder="L4"
                  required
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                Name
                <input
                  type="text"
                  value={latName}
                  onChange={(e) => setLatName(e.target.value)}
                  placeholder="Lateral Name"
                />
              </label>
              <label className="field" style={{ width: '90px' }}>
                Type
                <select value={latType} onChange={(e) => setLatType(e.target.value as 'MAIN' | 'BRANCH')}>
                  <option value="BRANCH">Branch</option>
                  <option value="MAIN">Main</option>
                </select>
              </label>
              <button type="submit" className="btn primary small">
                Save
              </button>
              <button type="button" className="btn small" onClick={() => setIsAddingLateral(false)}>
                ✕
              </button>
            </form>
          )}
        </div>
      )}

      {msg && <p className={`msg ${msg.kind}`}>{msg.text}</p>}
    </div>
  );
}

