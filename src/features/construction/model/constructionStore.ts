import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { checkItem } from '../lib/rules';
import { ConstructionItemSchema, type ConstructionItem } from './types';

export const INITIAL_CONSTRUCTION_ITEMS: ConstructionItem[] = [
  {
    id: 'hole-1',
    kind: 'hole',
    well: 'All',
    from: 0,
    to: 1200,
    size: 17.5,
    note: 'Surface hole section',
  },
  {
    id: 'csg-1',
    kind: 'casing',
    well: 'All',
    from: 0,
    to: 1200,
    size: 13.375,
    note: 'Surface casing string',
  },
  {
    id: 'cmt-1',
    kind: 'cement',
    well: 'All',
    from: 0,
    to: 1200,
    size: 13.375,
    note: 'Cement to surface',
  },
  {
    id: 'hole-2',
    kind: 'hole',
    well: 'All',
    from: 1200,
    to: 4500,
    size: 12.25,
    note: 'Intermediate hole section',
  },
  {
    id: 'csg-2',
    kind: 'casing',
    well: 'All',
    from: 0,
    to: 4500,
    size: 9.625,
    note: 'Intermediate casing string',
  },
  {
    id: 'cmt-2',
    kind: 'cement',
    well: 'All',
    from: 2500,
    to: 4500,
    size: 9.625,
    note: 'Intermediate cement TOC at 2500 ft',
  },
  {
    id: 'hole-3',
    kind: 'hole',
    well: 'L1',
    from: 4500,
    to: 7200,
    size: 8.5,
    note: 'L1 production hole section',
  },
  {
    id: 'csg-3',
    kind: 'casing',
    well: 'L1',
    from: 4200,
    to: 7200,
    size: 7,
    note: 'L1 production liner',
  },
  {
    id: 'cmt-3',
    kind: 'cement',
    well: 'L1',
    from: 4200,
    to: 7200,
    size: 7,
    note: 'L1 liner cement',
  },
];

let nextId = 100;
function generateId(kind: string = 'item'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${kind}-${++nextId}`;
}

export interface ConstructionState {
  items: ConstructionItem[];
  /** Incremented on every modification. Future 3D layers rebuild geometry only on version change. */
  version: number;
  addItem: (
    input: unknown,
  ) => { ok: true; item: ConstructionItem; warnings: string[] } | { ok: false; error: string };
  updateItem: (
    id: string,
    input: unknown,
  ) => { ok: true; item: ConstructionItem; warnings: string[] } | { ok: false; error: string };
  removeItem: (id: string) => { ok: true } | { ok: false; error: string };
  setItems: (list: unknown[]) => { ok: true } | { ok: false; error: string };
  resetToSample: () => void;
}

export const useConstructionStore = create<ConstructionState>()(
  subscribeWithSelector((set, get) => ({
    items: INITIAL_CONSTRUCTION_ITEMS,
    version: 0,

    addItem(input) {
      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const kindStr = typeof raw['kind'] === 'string' ? raw['kind'] : 'item';
      const candidate = {
        ...raw,
        id: typeof raw['id'] === 'string' && raw['id'].trim() ? raw['id'].trim() : generateId(kindStr),
      };

      const parsed = ConstructionItemSchema.safeParse(candidate);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid construction item data' };
      }

      const existing = get().items;
      if (existing.some((i) => i.id === parsed.data.id)) {
        return { ok: false, error: `Construction item with ID "${parsed.data.id}" already exists` };
      }

      const nextItems = [...existing, parsed.data];
      const warnings = checkItem(nextItems, parsed.data, parsed.data.well);

      set((s) => ({
        items: nextItems,
        version: s.version + 1,
      }));

      return { ok: true, item: parsed.data, warnings };
    },

    updateItem(id, input) {
      const existing = get().items;
      const index = existing.findIndex((i) => i.id === id);
      if (index === -1) {
        return { ok: false, error: `Construction item with ID "${id}" not found` };
      }

      const raw = typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {};
      const parsed = ConstructionItemSchema.safeParse({ ...raw, id });
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid construction item data' };
      }

      const nextItems = existing.map((i) => (i.id === id ? parsed.data : i));
      const warnings = checkItem(nextItems, parsed.data, parsed.data.well);

      set((s) => ({
        items: nextItems,
        version: s.version + 1,
      }));

      return { ok: true, item: parsed.data, warnings };
    },

    removeItem(id) {
      const existing = get().items;
      if (!existing.some((i) => i.id === id)) {
        return { ok: false, error: `Construction item with ID "${id}" not found` };
      }

      set((s) => ({
        items: s.items.filter((i) => i.id !== id),
        version: s.version + 1,
      }));

      return { ok: true };
    },

    setItems(list) {
      if (!Array.isArray(list)) {
        return { ok: false, error: 'Input must be an array of construction items' };
      }

      const parsedList: ConstructionItem[] = [];
      const ids = new Set<string>();

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const parsed = ConstructionItemSchema.safeParse(item);
        if (!parsed.success) {
          return {
            ok: false,
            error: `Item at index ${i}: ${parsed.error.issues[0]?.message ?? 'Invalid construction item'}`,
          };
        }
        if (ids.has(parsed.data.id)) {
          return {
            ok: false,
            error: `Duplicate construction item ID "${parsed.data.id}" found in list`,
          };
        }
        ids.add(parsed.data.id);
        parsedList.push(parsed.data);
      }

      set((s) => ({
        items: parsedList,
        version: s.version + 1,
      }));

      return { ok: true };
    },

    resetToSample() {
      set((s) => ({
        items: INITIAL_CONSTRUCTION_ITEMS,
        version: s.version + 1,
      }));
    },
  })),
);
