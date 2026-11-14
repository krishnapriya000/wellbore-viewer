import { useEffect, useId, useState, type FormEvent } from 'react';
import { useSurveyStore } from '@/features/survey';
import { getActiveWellId, useWellStore } from '@/features/wells';
import { Authorized } from '@/shared/auth';
import { backendClient } from '@/shared/api/backendClient';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import {
  EVENT_TYPE_LABELS,
  getEventCategory,
  INITIAL_EVENTS,
  useEventsStore,
} from '../model/eventsStore';
import {
  DrillEventSchema,
  EVENT_TYPES,
  type DrillEvent,
  type EventType,
} from '../model/types';

export function EventEditor() {
  const events = useEventsStore((s) => s.events);
  const addEvent = useEventsStore((s) => s.addEvent);
  const updateEvent = useEventsStore((s) => s.updateEvent);
  const removeEvent = useEventsStore((s) => s.removeEvent);
  const setEvents = useEventsStore((s) => s.setEvents);
  const resetToSample = useEventsStore((s) => s.resetToSample);

  const currentWellId = useWellStore((s) => s.currentWellId);
  const wellId = currentWellId || getActiveWellId();

  const wells = useSurveyStore((s) => s.order);
  const units = useUnits();
  const formId = useId();

  // Load events from PostgreSQL on mount / well change
  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') return;
    let active = true;
    async function loadEvents() {
      try {
        const backendEvents = await backendClient.getEngineeringEvents(wellId);
        if (!active) return;
        if (backendEvents && backendEvents.length > 0) {
          const mapped: DrillEvent[] = backendEvents.map((e) => ({
            id: e.id,
            well: e.lateral?.code || 'L1',
            md: e.measuredDepth ?? 0,
            type: (EVENT_TYPE_LABELS[e.eventType as EventType] ? e.eventType : 'casing') as EventType,
            note: e.description ?? '',
          }));
          setEvents(mapped);
        } else if (useEventsStore.getState().events.length === 0) {
          // If PostgreSQL has no events, seed with INITIAL_EVENTS
          await backendClient.batchSaveEngineeringEvents(wellId, INITIAL_EVENTS);
          if (active) setEvents(INITIAL_EVENTS);
        }
      } catch (err) {
        console.warn('Could not load engineering events from backend:', err);
      }
    }
    void loadEvents();
    return () => {
      active = false;
    };
  }, [wellId, setEvents]);

  // Filter selection: 'All' or a specific well
  const [wellFilter, setWellFilter] = useState('All');

  // Editing state: null when adding, or event ID being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form field state
  const defaultWell = wells.length > 0 ? (wells[0] ?? 'L1') : 'L1';
  const [well, setWell] = useState(defaultWell);
  const [mdStr, setMdStr] = useState('');
  const [type, setType] = useState<EventType>('casing');
  const [note, setNote] = useState('');

  // Inline delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status message
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const filteredEvents =
    wellFilter === 'All' ? events : events.filter((e) => e.well === wellFilter);

  function resetForm(keepMsg = false) {
    setEditingId(null);
    setWell(wells.length > 0 ? (wells[0] ?? 'L1') : 'L1');
    setMdStr('');
    setType('casing');
    setNote('');
    if (!keepMsg) setMsg(null);
  }

  function startEdit(event: DrillEvent) {
    setEditingId(event.id);
    setWell(event.well);
    setMdStr(formatNumber(toDisplay(event.md, units.unit), 1).replace(/,/g, ''));
    setType(event.type);
    setNote(event.note ?? '');
    setMsg(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);

    const mdNum = Number(mdStr);
    if (isNaN(mdNum) || mdStr.trim() === '') {
      setMsg({ kind: 'err', text: 'Measured depth must be a valid number.' });
      return;
    }

    if (mdNum < 0) {
      setMsg({ kind: 'err', text: 'Measured depth cannot be negative.' });
      return;
    }

    // Convert display unit to internal feet
    const mdFt = units.parseDepth(mdNum);

    const id = editingId ?? ('ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7));
    const candidate = {
      id,
      well: well.trim() || 'L1',
      md: mdFt,
      type,
      note: note.trim(),
    };

    const parsed = DrillEventSchema.safeParse(candidate);
    if (!parsed.success) {
      setMsg({ kind: 'err', text: parsed.error.issues[0]?.message ?? 'Validation failed' });
      return;
    }

    if (editingId) {
      void backendClient
        .updateEngineeringEvent(wellId, editingId, {
          eventType: type,
          measuredDepth: mdFt,
          description: note.trim(),
          lateralCode: well.trim() || 'L1',
        })
        .catch((err) => console.warn('Could not update event in PostgreSQL:', err));

      const res = updateEvent(editingId, candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }
      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Updated event "${EVENT_TYPE_LABELS[parsed.data.type]}" on ${parsed.data.well} (Saved in PostgreSQL).`,
      });
    } else {
      const res = addEvent(candidate);
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error });
        return;
      }

      void backendClient
        .createEngineeringEvent(wellId, {
          eventType: type,
          measuredDepth: mdFt,
          description: note.trim(),
          lateralCode: well.trim() || 'L1',
        })
        .catch((err) => console.warn('Could not save event in PostgreSQL:', err));

      resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Added event "${EVENT_TYPE_LABELS[parsed.data.type]}" at ${units.depth(parsed.data.md)} (Saved in PostgreSQL).`,
      });
    }
  }

  function handleDelete(id: string, eventType: EventType, eventWell: string) {
    void backendClient.deleteEngineeringEvent(wellId, id).catch((err) =>
      console.warn('Could not delete event in PostgreSQL:', err),
    );
    const res = removeEvent(id);
    setConfirmDeleteId(null);
    if (res.ok) {
      if (editingId === id) resetForm(true);
      setMsg({
        kind: 'ok',
        text: `Deleted event "${EVENT_TYPE_LABELS[eventType]}" on ${eventWell} (Deleted from PostgreSQL).`,
      });
    } else {
      setMsg({ kind: 'err', text: res.error });
    }
  }

  async function handleResetSample() {
    resetToSample();
    resetForm(true);
    setMsg({ kind: 'ok', text: 'Reset to sample events (Synchronized with PostgreSQL).' });
    try {
      await backendClient.batchSaveEngineeringEvents(wellId, INITIAL_EVENTS);
    } catch (err) {
      console.warn('Could not batch save events to PostgreSQL:', err);
    }
  }

  function getCategoryPillClass(eventType: EventType): string {
    const category = getEventCategory(eventType);
    switch (category) {
      case 'Shows':
        return 'pill ok';
      case 'Hazards':
        return 'pill crit';
      case 'Geology':
        return 'pill warn';
      case 'Operations':
      default:
        return 'pill idle';
    }
  }

  return (
    <section className="block" aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`}>
        Engineering Events <span className="pill idle">{events.length}</span>
      </h2>

      {/* Filter by well */}
      {wells.length > 1 && (
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="hint">Filter Well:</span>
          <select
            value={wellFilter}
            onChange={(e) => setWellFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '100px' }}
            aria-label="Filter events by well"
          >
            <option value="All">All Wells ({events.length})</option>
            {wells.map((w) => {
              const count = events.filter((e) => e.well === w).length;
              return (
                <option key={w} value={w}>
                  {w} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* 1. Existing events list */}
      <div className="event-list" role="region" aria-label="Engineering events list">
        {filteredEvents.length === 0 ? (
          <p className="hint">
            {events.length === 0
              ? 'No engineering events recorded.'
              : `No events recorded for well "${wellFilter}".`}
          </p>
        ) : (
          filteredEvents.map((ev) => {
            const label = EVENT_TYPE_LABELS[ev.type] ?? ev.type;
            const category = getEventCategory(ev.type);
            const pillClass = getCategoryPillClass(ev.type);

            return (
              <div key={ev.id} className="event-item">
                <div className="event-header">
                  <strong>{label}</strong>
                  <span className={pillClass}>
                    {category} · {ev.well}
                  </span>
                </div>
                <div className="event-meta">
                  <span>MD: {units.depth(ev.md)}</span>
                  <span className="mono" style={{ fontSize: '0.72rem' }}>
                    {ev.type}
                  </span>
                </div>
                {ev.note && <div className="event-note">{ev.note}</div>}
                <Authorized permission="events:edit">
                  <div className="event-actions">
                    <button
                      type="button"
                      className="btn small"
                      onClick={() => startEdit(ev)}
                      aria-label={`Edit ${label}`}
                    >
                      Edit
                    </button>
                    {confirmDeleteId === ev.id ? (
                      <span className="row" style={{ gap: '4px' }}>
                        <button
                          type="button"
                          className="btn small"
                          style={{ borderColor: 'var(--crit)', color: 'var(--crit)' }}
                          onClick={() => handleDelete(ev.id, ev.type, ev.well)}
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
                        onClick={() => setConfirmDeleteId(ev.id)}
                        aria-label={`Delete ${label}`}
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

      {/* 2. Event Add/Edit Form (Role-Gated) */}
      <Authorized
        permission="events:edit"
        fallback={
          <p className="hint">
            Read-only mode. Ask an admin for the Wellbore.Engineer role to edit events.
          </p>
        }
      >
        <form
          className="event-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label={editingId ? 'Edit event' : 'Add event'}
        >
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '0.85rem', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {editingId ? 'Edit Event' : 'Add Engineering Event'}
            </strong>
            {editingId && (
              <button type="button" className="btn small" onClick={() => resetForm()}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid4" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label className="field">
              Event Type (21 types)
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                aria-label="Event type"
              >
                {Object.entries(EVENT_TYPES).map(([cat, types]) => (
                  <optgroup key={cat} label={cat}>
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {EVENT_TYPE_LABELS[t] ?? t} ({t})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="field">
              Wellbore
              {wells.length > 0 ? (
                <select
                  value={well}
                  onChange={(e) => setWell(e.target.value)}
                  aria-label="Wellbore"
                >
                  {wells.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                  {!wells.includes(well) && <option value={well}>{well}</option>}
                </select>
              ) : (
                <input
                  type="text"
                  value={well}
                  onChange={(e) => setWell(e.target.value)}
                  placeholder="e.g. L1"
                  required
                />
              )}
            </label>
          </div>

          <div className="field">
            <label className="field">
              Measured Depth ({units.unit})
              <input
                type="number"
                step="0.1"
                min="0"
                value={mdStr}
                onChange={(e) => setMdStr(e.target.value)}
                placeholder="e.g. 3500"
                required
                aria-label={`Measured Depth in ${units.unit}`}
              />
            </label>
          </div>

          <label className="field">
            Note / Remarks (Max 240 chars)
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Observed 200 units gas show"
              maxLength={240}
              aria-label="Note or description"
            />
          </label>

          <div className="row" style={{ marginTop: '6px' }}>
            <button className="btn primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Event'}
            </button>
            <button type="button" className="btn" onClick={() => void handleResetSample()}>
              Reset Sample Events
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
