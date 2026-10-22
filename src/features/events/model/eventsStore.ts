import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { DrillEventSchema, EVENT_TYPES, type DrillEvent, type EventType } from './types';

export const INITIAL_EVENTS: DrillEvent[] = [
  {
    id: 'ev-1',
    well: 'L1',
    md: 1200,
    type: 'casing',
    note: 'Surface casing shoe set at 1200 ft',
  },
  {
    id: 'ev-2',
    well: 'L1',
    md: 2450,
    type: 'gas',
    note: 'Background gas increase (150 units)',
  },
  {
    id: 'ev-3',
    well: 'L1',
    md: 3600,
    type: 'oil_good',
    note: 'Good oil show with yellow fluorescence in target sand',
  },
  {
    id: 'ev-4',
    well: 'L1',
    md: 4250,
    type: 'tight',
    note: 'Tight hole noticed during connection',
  },
  {
    id: 'ev-5',
    well: 'L2',
    md: 3800,
    type: 'fault',
    note: 'Normal fault cross-cut, bed dip reversal',
  },
];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  oil_good: 'Good Oil Show',
  oil_fair: 'Fair Oil Show',
  oil_poor: 'Poor Oil Show',
  fluor: 'Fluorescence',
  gas: 'Gas Show',
  water: 'Water Inflow',
  h2s: 'H2S Hazard',
  kick: 'Well Kick',
  lost: 'Lost Circulation',
  stuck: 'Stuck Pipe',
  tight: 'Tight Hole',
  washout: 'Hole Washout',
  fault: 'Fault',
  fracture: 'Fracture',
  casing: 'Casing Shoe',
  kop: 'Kick-off Point (KOP)',
  bit: 'Bit Change',
  core: 'Core Sample',
  dst: 'Drill Stem Test (DST)',
  mw: 'Mud Weight Change',
  td: 'Total Depth (TD)',
};

export type EventCategory = keyof typeof EVENT_TYPES;

export function getEventCategory(type: EventType): EventCategory {
  for (const [category, types] of Object.entries(EVENT_TYPES) as [EventCategory, readonly EventType[]][]) {
    if (types.includes(type)) {
      return category;
    }
  }
  return 'Operations';
}

let nextId = 100;
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ev-${++nextId}`;
}

export interface EventsState {
  events: DrillEvent[];
  /** Incremented on every modification. Future 3D layers rebuild geometry only on version change. */
  version: number;
  addEvent: (input: unknown) => { ok: true; event: DrillEvent } | { ok: false; error: string };
  updateEvent: (
    id: string,
    input: unknown,
  ) => { ok: true; event: DrillEvent } | { ok: false; error: string };
  removeEvent: (id: string) => { ok: true } | { ok: false; error: string };
  setEvents: (list: unknown[]) => { ok: true } | { ok: false; error: string };
  resetToSample: () => void;
}

export const useEventsStore = create<EventsState>()(
  subscribeWithSelector((set, get) => ({
    events: INITIAL_EVENTS,
    version: 0,

    addEvent(input) {
      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const candidate = {
        ...raw,
        id: typeof raw['id'] === 'string' && raw['id'].trim() ? raw['id'].trim() : generateId(),
      };
      const parsed = DrillEventSchema.safeParse(candidate);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid event data' };
      }
      const existing = get().events;
      if (existing.some((e) => e.id === parsed.data.id)) {
        return { ok: false, error: `Event with ID "${parsed.data.id}" already exists` };
      }
      set((s) => ({
        events: [...s.events, parsed.data],
        version: s.version + 1,
      }));
      return { ok: true, event: parsed.data };
    },

    updateEvent(id, input) {
      const existing = get().events;
      const index = existing.findIndex((e) => e.id === id);
      if (index === -1) {
        return { ok: false, error: `Event with ID "${id}" not found` };
      }
      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const parsed = DrillEventSchema.safeParse({ ...raw, id });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid event data' };
      }
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? parsed.data : e)),
        version: s.version + 1,
      }));
      return { ok: true, event: parsed.data };
    },

    removeEvent(id) {
      const existing = get().events;
      if (!existing.some((e) => e.id === id)) {
        return { ok: false, error: `Event with ID "${id}" not found` };
      }
      set((s) => ({
        events: s.events.filter((e) => e.id !== id),
        version: s.version + 1,
      }));
      return { ok: true };
    },

    setEvents(list) {
      if (!Array.isArray(list)) {
        return { ok: false, error: 'Input must be an array of events' };
      }
      const parsedList: DrillEvent[] = [];
      const ids = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const parsed = DrillEventSchema.safeParse(item);
        if (!parsed.success) {
          return {
            ok: false,
            error: `Item at index ${i}: ${parsed.error.issues[0]?.message ?? 'Invalid event'}`,
          };
        }
        if (ids.has(parsed.data.id)) {
          return {
            ok: false,
            error: `Duplicate event ID "${parsed.data.id}" found in list`,
          };
        }
        ids.add(parsed.data.id);
        parsedList.push(parsed.data);
      }
      set((s) => ({
        events: parsedList,
        version: s.version + 1,
      }));
      return { ok: true };
    },

    resetToSample() {
      set((s) => ({
        events: INITIAL_EVENTS,
        version: s.version + 1,
      }));
    },
  })),
);
