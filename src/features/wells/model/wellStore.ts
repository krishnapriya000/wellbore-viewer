import { create } from 'zustand';
import { backendClient, type BackendWell } from '@/shared/api/backendClient';

export interface WellState {
  wells: BackendWell[];
  currentWellId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchWells: () => Promise<BackendWell[]>;
  setCurrentWellId: (wellId: string) => void;
  createWell: (data: {
    name: string;
    wellCode?: string;
    fieldName?: string;
    location?: string;
    description?: string;
  }) => Promise<BackendWell>;
  updateWell: (wellId: string, data: Partial<BackendWell>) => Promise<BackendWell>;
  deleteWell: (wellId: string) => Promise<void>;
  createLateral: (wellId: string, data: { code: string; name?: string; type?: 'MAIN' | 'BRANCH' }) => Promise<void>;
}

export function getActiveWellId(): string {
  const current = useWellStore.getState().currentWellId;
  if (current) return current;
  const first = useWellStore.getState().wells[0]?.id;
  if (first) return first;
  return 'cmw8qdvme0000vt1opi0i2ado';
}

export const useWellStore = create<WellState>()((set, get) => ({
  wells: [],
  currentWellId: null,
  isLoading: false,
  error: null,

  async fetchWells() {
    set({ isLoading: true, error: null });
    try {
      const wells = await backendClient.getWells();
      const current = get().currentWellId;
      const validCurrent = wells.some((w) => w.id === current) ? current : wells[0]?.id || null;

      set({
        wells,
        currentWellId: validCurrent,
        isLoading: false,
      });
      return wells;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      return [];
    }
  },

  setCurrentWellId(wellId: string) {
    set({ currentWellId: wellId });
  },

  async createWell(data) {
    set({ isLoading: true, error: null });
    try {
      const well = await backendClient.createWell(data);
      set((s) => ({
        wells: [...s.wells, well],
        currentWellId: well.id,
        isLoading: false,
      }));
      return well;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      throw err;
    }
  },

  async updateWell(wellId, data) {
    set({ isLoading: true, error: null });
    try {
      const updated = await backendClient.updateWell(wellId, data);
      set((s) => ({
        wells: s.wells.map((w) => (w.id === wellId ? updated : w)),
        isLoading: false,
      }));
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      throw err;
    }
  },

  async deleteWell(wellId) {
    set({ isLoading: true, error: null });
    try {
      await backendClient.deleteWell(wellId);
      const remaining = get().wells.filter((w) => w.id !== wellId);
      set({
        wells: remaining,
        currentWellId: remaining[0]?.id || null,
        isLoading: false,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error, isLoading: false });
      throw err;
    }
  },

  async createLateral(wellId, data) {
    try {
      await backendClient.createLateral(wellId, data);
      await get().fetchWells();
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      set({ error });
      throw err;
    }
  },
}));

