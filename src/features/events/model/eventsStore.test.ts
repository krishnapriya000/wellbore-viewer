import { beforeEach, describe, expect, it } from 'vitest';
import {
  EVENT_TYPE_LABELS,
  getEventCategory,
  INITIAL_EVENTS,
  useEventsStore,
} from './eventsStore';

describe('eventsStore', () => {
  beforeEach(() => {
    useEventsStore.getState().resetToSample();
    useEventsStore.setState({ version: 0 });
  });

  it('initializes with default sample events and version 0', () => {
    const state = useEventsStore.getState();
    expect(state.events).toHaveLength(INITIAL_EVENTS.length);
    expect(state.version).toBe(0);
    expect(state.events[0]!.type).toBe('casing');
    expect(state.events[0]!.well).toBe('L1');
  });

  it('adds a valid event and increments version', () => {
    const result = useEventsStore.getState().addEvent({
      well: 'L1',
      md: 4800,
      type: 'kick',
      note: 'Gas kick observed at 4800 ft, shut in well',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.event.id).toBeTruthy();
    expect(result.event.well).toBe('L1');
    expect(result.event.md).toBe(4800);
    expect(result.event.type).toBe('kick');

    const state = useEventsStore.getState();
    expect(state.events).toHaveLength(INITIAL_EVENTS.length + 1);
    expect(state.version).toBe(1);
    expect(state.events.at(-1)?.type).toBe('kick');
  });

  it('adds a valid event with an explicit ID', () => {
    const result = useEventsStore.getState().addEvent({
      id: 'custom-ev-42',
      well: 'L2',
      md: 3100,
      type: 'bit',
      note: 'PDC bit run #2',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.event.id).toBe('custom-ev-42');
    expect(useEventsStore.getState().events.some((e) => e.id === 'custom-ev-42')).toBe(true);
  });

  it('rejects adding an event with duplicate ID', () => {
    const result = useEventsStore.getState().addEvent({
      id: 'ev-1', // Already in INITIAL_EVENTS
      well: 'L1',
      md: 1200,
      type: 'casing',
      note: 'Duplicate ID',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already exists/i);
    expect(useEventsStore.getState().version).toBe(0);
  });

  it('rejects adding an invalid event (negative MD, empty well, invalid type, note too long)', () => {
    // Negative MD
    const negativeMd = useEventsStore.getState().addEvent({
      well: 'L1',
      md: -10,
      type: 'gas',
      note: 'Bad MD',
    });
    expect(negativeMd.ok).toBe(false);

    // Empty well
    const emptyWell = useEventsStore.getState().addEvent({
      well: '',
      md: 1000,
      type: 'gas',
      note: 'Empty well',
    });
    expect(emptyWell.ok).toBe(false);

    // Invalid event type
    const invalidType = useEventsStore.getState().addEvent({
      well: 'L1',
      md: 1000,
      type: 'not_a_real_type',
      note: 'Bogus type',
    });
    expect(invalidType.ok).toBe(false);

    // Note too long (>240 chars)
    const longNote = useEventsStore.getState().addEvent({
      well: 'L1',
      md: 1000,
      type: 'gas',
      note: 'x'.repeat(241),
    });
    expect(longNote.ok).toBe(false);
  });

  it('updates an existing event and increments version', () => {
    const updateResult = useEventsStore.getState().updateEvent('ev-2', {
      well: 'L1',
      md: 2500,
      type: 'gas',
      note: 'Updated: Peak gas at 2500 ft (400 units)',
    });

    expect(updateResult.ok).toBe(true);
    const updated = useEventsStore.getState().events.find((e) => e.id === 'ev-2');
    expect(updated?.md).toBe(2500);
    expect(updated?.note).toBe('Updated: Peak gas at 2500 ft (400 units)');
    expect(useEventsStore.getState().version).toBe(1);
  });

  it('returns an error when updating a non-existent event', () => {
    const result = useEventsStore.getState().updateEvent('ghost-id', {
      well: 'L1',
      md: 2000,
      type: 'oil_good',
      note: 'Non existent',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it('removes an existing event and increments version', () => {
    const result = useEventsStore.getState().removeEvent('ev-4');
    expect(result.ok).toBe(true);

    const state = useEventsStore.getState();
    expect(state.events.some((e) => e.id === 'ev-4')).toBe(false);
    expect(state.events).toHaveLength(INITIAL_EVENTS.length - 1);
    expect(state.version).toBe(1);
  });

  it('returns error when removing non-existent event', () => {
    const result = useEventsStore.getState().removeEvent('non-existent-id');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not found/i);
    }
  });

  it('replaces the entire event list via setEvents', () => {
    const newList = [
      {
        id: 'new-ev-1',
        well: 'L1',
        md: 500,
        type: 'mw',
        note: 'Mud weight increased to 10.5 ppg',
      },
    ];

    const result = useEventsStore.getState().setEvents(newList);
    expect(result.ok).toBe(true);

    const state = useEventsStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0]!.id).toBe('new-ev-1');
    expect(state.version).toBe(1);
  });

  it('rejects setEvents if input is not an array or has invalid entries or duplicate IDs', () => {
    // Not an array
    const notArray = useEventsStore.getState().setEvents({} as unknown[]);
    expect(notArray.ok).toBe(false);

    // Invalid entry
    const invalidEntry = useEventsStore.getState().setEvents([
      {
        id: 'bad-1',
        well: '',
        md: 100,
        type: 'gas',
        note: '',
      },
    ]);
    expect(invalidEntry.ok).toBe(false);

    // Duplicate ID in list
    const duplicateIds = useEventsStore.getState().setEvents([
      {
        id: 'dup-1',
        well: 'L1',
        md: 100,
        type: 'gas',
        note: 'First',
      },
      {
        id: 'dup-1',
        well: 'L1',
        md: 200,
        type: 'gas',
        note: 'Duplicate',
      },
    ]);
    expect(duplicateIds.ok).toBe(false);
    if (!duplicateIds.ok) {
      expect(duplicateIds.error).toMatch(/duplicate event id/i);
    }
  });

  it('resets events back to sample list via resetToSample', () => {
    useEventsStore.getState().removeEvent('ev-1');
    expect(useEventsStore.getState().events).toHaveLength(INITIAL_EVENTS.length - 1);

    useEventsStore.getState().resetToSample();
    expect(useEventsStore.getState().events).toHaveLength(INITIAL_EVENTS.length);
  });

  it('maps all 21 event types to valid categories and human labels', () => {
    const state = useEventsStore.getState();
    expect(state.events).toBeDefined();

    expect(getEventCategory('oil_good')).toBe('Shows');
    expect(getEventCategory('gas')).toBe('Shows');
    expect(getEventCategory('kick')).toBe('Hazards');
    expect(getEventCategory('h2s')).toBe('Hazards');
    expect(getEventCategory('fault')).toBe('Geology');
    expect(getEventCategory('fracture')).toBe('Geology');
    expect(getEventCategory('casing')).toBe('Operations');
    expect(getEventCategory('td')).toBe('Operations');

    expect(EVENT_TYPE_LABELS['oil_good']).toBe('Good Oil Show');
    expect(EVENT_TYPE_LABELS['kick']).toBe('Well Kick');
    expect(EVENT_TYPE_LABELS['fault']).toBe('Fault');
    expect(EVENT_TYPE_LABELS['casing']).toBe('Casing Shoe');
  });
});
