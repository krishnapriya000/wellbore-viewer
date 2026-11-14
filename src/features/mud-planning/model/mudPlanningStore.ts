import { create } from 'zustand';
import { backendClient, type BackendMudPlan } from '@/shared/api/backendClient';
import {
  validateMudPlanInput,
  type MudPlanInput,
  type MudPlanRecord,
} from './types';

export interface MudPlanningState {
  plans: MudPlanRecord[];
  isLoading: boolean;
  error: string | null;

  fetchPlans: (wellId?: string) => Promise<MudPlanRecord[]>;
  addPlan: (
    input: MudPlanInput,
  ) => Promise<{ ok: true; plan: MudPlanRecord } | { ok: false; error: string }>;
  updatePlan: (
    id: string,
    input: Partial<MudPlanInput>,
  ) => Promise<{ ok: true; plan: MudPlanRecord } | { ok: false; error: string }>;
  deletePlan: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  setPlans: (plans: MudPlanRecord[]) => void;
  getPlansByWell: (wellId: string) => MudPlanRecord[];
}

function mapBackendMudPlan(bp: BackendMudPlan): MudPlanRecord {
  return {
    id: bp.id,
    wellId: bp.wellId,
    wellName: bp.well?.name,
    mudType: bp.mudType,
    mudWeight: bp.mudWeight,
    plasticViscosity: bp.plasticViscosity,
    yieldPoint: bp.yieldPoint,
    fluidLoss: bp.fluidLoss,
    remarks: bp.remarks ?? undefined,
    createdAt: bp.createdAt,
    updatedAt: bp.updatedAt,
  };
}

export const useMudPlanningStore = create<MudPlanningState>()((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  async fetchPlans(wellId) {
    set({ isLoading: true, error: null });
    try {
      const backendPlans = await backendClient.getMudPlans(wellId);
      const mapped = backendPlans.map(mapBackendMudPlan);
      set({ plans: mapped, isLoading: false });
      return mapped;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Could not load mud plans from backend:', err);
      set({ error: errorMsg, isLoading: false });
      return get().plans;
    }
  },

  async addPlan(input) {
    const validation = validateMudPlanInput(input);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'Validation failed' };
    }

    const localRecord: MudPlanRecord = {
      ...input,
      id: 'mp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
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
        const created = await backendClient.createMudPlan({
          wellId: input.wellId,
          mudType: input.mudType,
          mudWeight: input.mudWeight,
          plasticViscosity: input.plasticViscosity,
          yieldPoint: input.yieldPoint,
          fluidLoss: input.fluidLoss,
          remarks: input.remarks,
        });
        const serverRecord = mapBackendMudPlan(created);
        set((state) => ({
          plans: state.plans.map((p) => (p.id === localRecord.id ? serverRecord : p)),
        }));
        return { ok: true, plan: serverRecord };
      } catch (err) {
        console.warn('Could not sync mud plan to PostgreSQL:', err);
      }
    }

    return { ok: true, plan: localRecord };
  },

  async updatePlan(id, input) {
    const existing = get().plans.find((p) => p.id === id);
    if (!existing) {
      return { ok: false, error: 'Mud planning record not found.' };
    }

    const merged: MudPlanInput = {
      wellId: input.wellId ?? existing.wellId,
      wellName: input.wellName ?? existing.wellName,
      mudType: input.mudType ?? existing.mudType,
      mudWeight: input.mudWeight ?? existing.mudWeight,
      plasticViscosity: input.plasticViscosity ?? existing.plasticViscosity,
      yieldPoint: input.yieldPoint ?? existing.yieldPoint,
      fluidLoss: input.fluidLoss ?? existing.fluidLoss,
      remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
    };

    const validation = validateMudPlanInput(merged);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'Validation failed' };
    }

    const updatedRecord: MudPlanRecord = {
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
        const updated = await backendClient.updateMudPlan(id, {
          wellId: merged.wellId,
          mudType: merged.mudType,
          mudWeight: merged.mudWeight,
          plasticViscosity: merged.plasticViscosity,
          yieldPoint: merged.yieldPoint,
          fluidLoss: merged.fluidLoss,
          remarks: merged.remarks ?? null,
        });
        const serverRecord = mapBackendMudPlan(updated);
        set((state) => ({
          plans: state.plans.map((p) => (p.id === id ? serverRecord : p)),
        }));
      } catch (err) {
        console.warn('Could not sync mud plan update to PostgreSQL:', err);
      }
    }

    return { ok: true, plan: updatedRecord };
  },

  async deletePlan(id) {
    const exists = get().plans.some((p) => p.id === id);
    if (!exists) {
      return { ok: false, error: 'Mud planning record not found.' };
    }

    set((state) => ({
      plans: state.plans.filter((p) => p.id !== id),
      error: null,
    }));

    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      try {
        await backendClient.deleteMudPlan(id);
      } catch (err) {
        console.warn('Could not delete mud plan from PostgreSQL:', err);
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
