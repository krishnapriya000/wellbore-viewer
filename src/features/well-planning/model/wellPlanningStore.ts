import { create } from 'zustand';
import { backendClient, type BackendWellPlan } from '@/shared/api/backendClient';
import {
  validateWellPlanInput,
  type WellPlanInput,
  type WellPlanRecord,
} from './types';

export interface WellPlanningState {
  plans: WellPlanRecord[];
  isLoading: boolean;
  error: string | null;

  fetchPlans: (wellId?: string) => Promise<WellPlanRecord[]>;
  addPlan: (
    input: WellPlanInput,
  ) => Promise<{ ok: true; plan: WellPlanRecord } | { ok: false; error: string }>;
  updatePlan: (
    id: string,
    input: Partial<WellPlanInput>,
  ) => Promise<{ ok: true; plan: WellPlanRecord } | { ok: false; error: string }>;
  deletePlan: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  setPlans: (plans: WellPlanRecord[]) => void;
  getPlansByWell: (wellId: string) => WellPlanRecord[];
}

function mapBackendPlan(bp: BackendWellPlan): WellPlanRecord {
  return {
    id: bp.id,
    wellId: bp.wellId,
    wellName: bp.well?.name,
    targetDepthMd: bp.targetDepthMD,
    targetDepthTvd: bp.targetDepthTVD,
    targetInclination: bp.targetInclination,
    targetAzimuth: bp.targetAzimuth,
    plannedKickoffDepth: bp.plannedKickoffDepth,
    targetObjective: bp.targetObjective,
    remarks: bp.remarks ?? undefined,
    createdAt: bp.createdAt,
    updatedAt: bp.updatedAt,
  };
}

export const useWellPlanningStore = create<WellPlanningState>()((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  async fetchPlans(wellId) {
    set({ isLoading: true, error: null });
    try {
      const backendPlans = await backendClient.getWellPlans(wellId);
      const mapped = backendPlans.map(mapBackendPlan);
      set({ plans: mapped, isLoading: false });
      return mapped;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Could not load well plans from backend:', err);
      set({ error: errorMsg, isLoading: false });
      return get().plans;
    }
  },

  async addPlan(input) {
    const validation = validateWellPlanInput(input);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'Validation failed' };
    }

    const localRecord: WellPlanRecord = {
      ...input,
      id: 'wp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      remarks: input.remarks?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      plans: [localRecord, ...state.plans],
      error: null,
    }));

    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      try {
        const created = await backendClient.createWellPlan({
          wellId: input.wellId,
          targetDepthMD: input.targetDepthMd,
          targetDepthTVD: input.targetDepthTvd,
          targetInclination: input.targetInclination,
          targetAzimuth: input.targetAzimuth,
          plannedKickoffDepth: input.plannedKickoffDepth,
          targetObjective: input.targetObjective,
          remarks: input.remarks,
        });
        const serverRecord = mapBackendPlan(created);
        set((state) => ({
          plans: state.plans.map((p) => (p.id === localRecord.id ? serverRecord : p)),
        }));
        return { ok: true, plan: serverRecord };
      } catch (err) {
        console.warn('Could not sync well plan to PostgreSQL:', err);
      }
    }

    return { ok: true, plan: localRecord };
  },

  async updatePlan(id, input) {
    const existing = get().plans.find((p) => p.id === id);
    if (!existing) {
      return { ok: false, error: 'Well planning record not found.' };
    }

    const merged: WellPlanInput = {
      wellId: input.wellId ?? existing.wellId,
      wellName: input.wellName ?? existing.wellName,
      targetDepthMd: input.targetDepthMd ?? existing.targetDepthMd,
      targetDepthTvd: input.targetDepthTvd ?? existing.targetDepthTvd,
      targetInclination: input.targetInclination ?? existing.targetInclination,
      targetAzimuth: input.targetAzimuth ?? existing.targetAzimuth,
      plannedKickoffDepth: input.plannedKickoffDepth ?? existing.plannedKickoffDepth,
      targetObjective: input.targetObjective ?? existing.targetObjective,
      remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
    };

    const validation = validateWellPlanInput(merged);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'Validation failed' };
    }

    const updatedRecord: WellPlanRecord = {
      ...existing,
      ...merged,
      remarks: merged.remarks?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      plans: state.plans.map((p) => (p.id === id ? updatedRecord : p)),
      error: null,
    }));

    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      try {
        const updated = await backendClient.updateWellPlan(id, {
          wellId: merged.wellId,
          targetDepthMD: merged.targetDepthMd,
          targetDepthTVD: merged.targetDepthTvd,
          targetInclination: merged.targetInclination,
          targetAzimuth: merged.targetAzimuth,
          plannedKickoffDepth: merged.plannedKickoffDepth,
          targetObjective: merged.targetObjective,
          remarks: merged.remarks ?? null,
        });
        const serverRecord = mapBackendPlan(updated);
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? serverRecord : p)),
        }));
      } catch (err) {
        console.warn('Could not sync well plan update to PostgreSQL:', err);
      }
    }

    return { ok: true, plan: updatedRecord };
  },

  async deletePlan(id) {
    const exists = get().plans.some((p) => p.id === id);
    if (!exists) {
      return { ok: false, error: 'Well planning record not found.' };
    }

    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      error: null,
    }));

    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      try {
        await backendClient.deleteWellPlan(id);
      } catch (err) {
        console.warn('Could not delete well plan from PostgreSQL:', err);
      }
    }

    return { ok: true };
  },

  setPlans(plans) {
    set({ plans, error: null });
  },

  getPlansByWell(wellId) {
    return get().plans.filter((p) => p.wellId === wellId);
  },
}));
