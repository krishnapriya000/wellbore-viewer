import { create } from 'zustand';
import { computeSurvey, junctionMd } from '../lib/mcm';
import { parseSurveyText } from '../lib/parseSurvey';
import { StationSchema, type StationInput } from '../lib/schema';
import type { Station, SurveyPoint } from '../lib/types';

export interface Well {
  name: string;
  /** Stable colour slot 0..5, assigned on first load. */
  slot: number;
  plan: SurveyPoint[];
  actual: SurveyPoint[];
  /** MD where the lateral leaves the motherbore. */
  junction: number;
  /** Bumped on every change. 3D layers rebuild geometry only when this changes. */
  version: number;
}

interface SurveyState {
  wells: Record<string, Well>;
  order: string[];
  status: 'empty' | 'loading' | 'ready' | 'error';
  error: string | null;
  setPlan: (wells: Map<string, Station[]>) => void;
  setActual: (wells: Map<string, Station[]>) => void;
  addLiveStation: (
    well: string,
    input: StationInput,
  ) => { ok: true; point: SurveyPoint } | { ok: false; error: string };
  loadSample: (fetchImpl?: typeof fetch) => Promise<void>;
}

const emptyWell = (name: string, slot: number): Well => ({
  name,
  slot,
  plan: [],
  actual: [],
  junction: 0,
  version: 0,
});

function upsert(
  state: SurveyState,
  name: string,
  patch: (w: Well) => Partial<Well>,
): Pick<SurveyState, 'wells' | 'order'> {
  const existing = state.wells[name] ?? emptyWell(name, state.order.length % 6);
  const next = { ...existing, ...patch(existing) };
  next.junction = junctionMd(next.plan.length ? next.plan : next.actual);
  next.version = existing.version + 1;
  return {
    wells: { ...state.wells, [name]: next },
    order: state.order.includes(name) ? state.order : [...state.order, name],
  };
}

export const useSurveyStore = create<SurveyState>()((set, get) => ({
  wells: {},
  order: [],
  status: 'empty',
  error: null,

  setPlan(wells) {
    let state = get();
    for (const [name, stations] of wells)
      state = { ...state, ...upsert(state, name, () => ({ plan: computeSurvey(stations) })) };
    set({ wells: state.wells, order: state.order, status: 'ready' });
  },

  // Unlike the old repo, an actual for a well with no plan creates that well instead of being dropped.
  setActual(wells) {
    let state = get();
    for (const [name, stations] of wells)
      state = { ...state, ...upsert(state, name, () => ({ actual: computeSurvey(stations) })) };
    set({ wells: state.wells, order: state.order, status: 'ready' });
  },

  addLiveStation(name, input) {
    const parsed = StationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid station' };
    const well = get().wells[name];
    if (!well) return { ok: false, error: `Unknown well ${name}` };
    const last = well.actual.at(-1);
    if (last && parsed.data.md <= last.md)
      return { ok: false, error: `MD must be deeper than the last survey (${last.md.toFixed(1)} ft)` };
    const stations: Station[] = well.actual.length
      ? [...well.actual.map(({ md, inc, azi }) => ({ md, inc, azi })), parsed.data]
      : [{ md: 0, inc: 0, azi: parsed.data.azi }, parsed.data];
    const actual = computeSurvey(stations);
    set((s) => upsert(s, name, () => ({ actual })));
    return { ok: true, point: actual.at(-1)! };
  },

  async loadSample(fetchImpl = fetch) {
    set({ status: 'loading', error: null });
    try {
      const [plan, actual] = await Promise.all(
        ['plan', 'actual'].map(async (k) => {
          const res = await fetchImpl(`${import.meta.env.BASE_URL}samples/${k}.csv`);
          if (!res.ok) throw new Error(`Sample ${k}.csv: HTTP ${res.status}`);
          return parseSurveyText(await res.text(), 'L1').wells;
        }),
      );
      set({ wells: {}, order: [] });
      get().setPlan(plan!);
      get().setActual(actual!);
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },
}));

export const selectWell = (name: string | null) => (s: SurveyState) => (name ? s.wells[name] : undefined);
