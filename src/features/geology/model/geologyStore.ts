import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { FormationSchema, type Formation } from './types';

export const INITIAL_FORMATIONS: Formation[] = [
  {
    id: 'fm-1',
    name: 'Overburden',
    ref: 'TVD',
    well: 'All',
    from: 0,
    to: 1500,
    comp: [
      { lith: 'shale', pct: 70 },
      { lith: 'sandstone', pct: 30 },
    ],
  },
  {
    id: 'fm-2',
    name: 'Upper Shale',
    ref: 'TVD',
    well: 'All',
    from: 1500,
    to: 3500,
    comp: [{ lith: 'shale', pct: 100 }],
  },
  {
    id: 'fm-3',
    name: 'Target Sand',
    ref: 'TVD',
    well: 'All',
    from: 3500,
    to: 4500,
    comp: [
      { lith: 'sandstone', pct: 85 },
      { lith: 'siltstone', pct: 15 },
    ],
  },
  {
    id: 'fm-4',
    name: 'Lower Carbonate',
    ref: 'TVD',
    well: 'All',
    from: 4500,
    to: 6500,
    comp: [
      { lith: 'limestone', pct: 60 },
      { lith: 'dolomite', pct: 40 },
    ],
  },
  {
    id: 'fm-5',
    name: 'Sand Stringer',
    ref: 'MD',
    well: 'L1',
    from: 4100,
    to: 4300,
    comp: [{ lith: 'sandstone', pct: 100 }],
  },
];

let nextId = 100;
function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fm-${++nextId}`;
}

export interface GeologyState {
  formations: Formation[];
  /** Incremented on every modification. Future 3D layers rebuild geometry only on version change. */
  version: number;
  addFormation: (input: unknown) => { ok: true; formation: Formation } | { ok: false; error: string };
  updateFormation: (
    id: string,
    input: unknown,
  ) => { ok: true; formation: Formation } | { ok: false; error: string };
  removeFormation: (id: string) => { ok: true } | { ok: false; error: string };
  setFormations: (list: unknown[]) => { ok: true } | { ok: false; error: string };
  resetToSample: () => void;
}

export const useGeologyStore = create<GeologyState>()(
  subscribeWithSelector((set, get) => ({
    formations: INITIAL_FORMATIONS,
    version: 0,

    addFormation(input) {
      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const candidate = {
        ...raw,
        id: typeof raw['id'] === 'string' && raw['id'].trim() ? raw['id'] : generateId(),
      };
      const parsed = FormationSchema.safeParse(candidate);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid formation data' };
      }
      const existing = get().formations;
      if (existing.some((f) => f.id === parsed.data.id)) {
        return { ok: false, error: `Formation with ID "${parsed.data.id}" already exists` };
      }
      set((s) => ({
        formations: [...s.formations, parsed.data],
        version: s.version + 1,
      }));
      return { ok: true, formation: parsed.data };
    },

    updateFormation(id, input) {
      const existing = get().formations;
      const index = existing.findIndex((f) => f.id === id);
      if (index === -1) {
        return { ok: false, error: `Formation with ID "${id}" not found` };
      }
      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const parsed = FormationSchema.safeParse({ ...raw, id });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid formation data' };
      }
      set((s) => ({
        formations: s.formations.map((f) => (f.id === id ? parsed.data : f)),
        version: s.version + 1,
      }));
      return { ok: true, formation: parsed.data };
    },

    removeFormation(id) {
      const existing = get().formations;
      if (!existing.some((f) => f.id === id)) {
        return { ok: false, error: `Formation with ID "${id}" not found` };
      }
      set((s) => ({
        formations: s.formations.filter((f) => f.id !== id),
        version: s.version + 1,
      }));
      return { ok: true };
    },

    setFormations(list) {
      const parsedList: Formation[] = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const parsed = FormationSchema.safeParse(item);
        if (!parsed.success) {
          return {
            ok: false,
            error: `Item at index ${i}: ${parsed.error.issues[0]?.message ?? 'Invalid formation'}`,
          };
        }
        parsedList.push(parsed.data);
      }
      set((s) => ({
        formations: parsedList,
        version: s.version + 1,
      }));
      return { ok: true };
    },

    resetToSample() {
      set((s) => ({
        formations: INITIAL_FORMATIONS,
        version: s.version + 1,
      }));
    },
  })),
);
