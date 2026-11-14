import { beforeEach, describe, expect, it } from 'vitest';
import { useMudPlanningStore } from './mudPlanningStore';

describe('mudPlanningStore', () => {
  beforeEach(() => {
    useMudPlanningStore.setState({ plans: [], error: null, isLoading: false });
  });

  it('starts with an empty mud plan list', () => {
    const state = useMudPlanningStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('adds a valid mud plan', async () => {
    const res = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      mudType: 'Water-Based Mud (WBM)',
      mudWeight: 9.8,
      plasticViscosity: 22,
      yieldPoint: 16,
      fluidLoss: 5.5,
      remarks: 'Add bentonite and maintain pH 9.5',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.plan.id).toBeTruthy();
    expect(res.plan.wellId).toBe('w-1');
    expect(res.plan.mudWeight).toBe(9.8);
    expect(res.plan.plasticViscosity).toBe(22);
    expect(res.plan.yieldPoint).toBe(16);
    expect(res.plan.fluidLoss).toBe(5.5);

    const state = useMudPlanningStore.getState();
    expect(state.plans).toHaveLength(1);
  });

  it('rejects invalid mud properties', async () => {
    // Non-positive mud weight
    const res1 = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      mudType: 'Water-Based Mud (WBM)',
      mudWeight: 0,
      plasticViscosity: 15,
      yieldPoint: 12,
      fluidLoss: 6.0,
    });
    expect(res1.ok).toBe(false);

    // Negative PV
    const res2 = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      mudType: 'Water-Based Mud (WBM)',
      mudWeight: 10.0,
      plasticViscosity: -5,
      yieldPoint: 12,
      fluidLoss: 6.0,
    });
    expect(res2.ok).toBe(false);

    // Empty mud type
    const res3 = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      mudType: '   ',
      mudWeight: 10.0,
      plasticViscosity: 15,
      yieldPoint: 12,
      fluidLoss: 6.0,
    });
    expect(res3.ok).toBe(false);
  });

  it('updates an existing mud plan', async () => {
    const addRes = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      mudType: 'Water-Based Mud (WBM)',
      mudWeight: 9.5,
      plasticViscosity: 18,
      yieldPoint: 14,
      fluidLoss: 6.0,
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    const updateRes = await useMudPlanningStore.getState().updatePlan(addRes.plan.id, {
      mudWeight: 11.2,
      plasticViscosity: 24,
      remarks: 'Weighted up with barite for high pore pressure',
    });

    expect(updateRes.ok).toBe(true);
    if (!updateRes.ok) return;
    expect(updateRes.plan.mudWeight).toBe(11.2);
    expect(updateRes.plan.plasticViscosity).toBe(24);
    expect(updateRes.plan.remarks).toBe('Weighted up with barite for high pore pressure');
  });

  it('deletes an existing mud plan', async () => {
    const addRes = await useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      mudType: 'Oil-Based Mud (OBM)',
      mudWeight: 12.0,
      plasticViscosity: 25,
      yieldPoint: 18,
      fluidLoss: 3.5,
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    const delRes = await useMudPlanningStore.getState().deletePlan(addRes.plan.id);
    expect(delRes.ok).toBe(true);
    expect(useMudPlanningStore.getState().plans).toHaveLength(0);
  });
});
