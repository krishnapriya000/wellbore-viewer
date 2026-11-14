import { beforeEach, describe, expect, it } from 'vitest';
import { useWellPlanningStore } from './wellPlanningStore';

describe('wellPlanningStore', () => {
  beforeEach(() => {
    useWellPlanningStore.setState({ plans: [], error: null, isLoading: false });
  });

  it('starts with an empty plan list', () => {
    const state = useWellPlanningStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('adds a valid well plan', async () => {
    const res = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      targetDepthMd: 12000,
      targetDepthTvd: 8500,
      targetInclination: 88.5,
      targetAzimuth: 120.0,
      plannedKickoffDepth: 3500,
      targetObjective: 'Reservoir A Top Penetration',
      remarks: 'Maintain tight DLS at kickoff',
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.plan.id).toBeTruthy();
    expect(res.plan.wellId).toBe('w-1');
    expect(res.plan.targetDepthMd).toBe(12000);
    expect(res.plan.targetDepthTvd).toBe(8500);
    expect(res.plan.targetObjective).toBe('Reservoir A Top Penetration');

    const state = useWellPlanningStore.getState();
    expect(state.plans).toHaveLength(1);
    expect(state.plans[0]?.id).toBe(res.plan.id);
  });

  it('rejects well plans where TVD exceeds MD', async () => {
    const res = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      targetDepthMd: 5000,
      targetDepthTvd: 6000,
      targetInclination: 45,
      targetAzimuth: 90,
      plannedKickoffDepth: 2000,
      targetObjective: 'Invalid Target',
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch(/TVD cannot exceed.*MD/i);
    expect(useWellPlanningStore.getState().plans).toHaveLength(0);
  });

  it('rejects well plans where KOP exceeds target MD', async () => {
    const res = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      targetDepthMd: 5000,
      targetDepthTvd: 4500,
      targetInclination: 45,
      targetAzimuth: 90,
      plannedKickoffDepth: 5500,
      targetObjective: 'Invalid Target',
    });

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error).toMatch(/Kickoff Depth cannot exceed Target Depth MD/i);
  });

  it('rejects well plans with missing wellId or objective', async () => {
    const res1 = await useWellPlanningStore.getState().addPlan({
      wellId: '',
      targetDepthMd: 5000,
      targetDepthTvd: 4500,
      targetInclination: 45,
      targetAzimuth: 90,
      plannedKickoffDepth: 2000,
      targetObjective: 'Valid Objective',
    });
    expect(res1.ok).toBe(false);

    const res2 = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      targetDepthMd: 5000,
      targetDepthTvd: 4500,
      targetInclination: 45,
      targetAzimuth: 90,
      plannedKickoffDepth: 2000,
      targetObjective: '   ',
    });
    expect(res2.ok).toBe(false);
  });

  it('updates an existing well plan', async () => {
    const addRes = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      targetDepthMd: 10000,
      targetDepthTvd: 8000,
      targetInclination: 60,
      targetAzimuth: 45,
      plannedKickoffDepth: 3000,
      targetObjective: 'Initial Objective',
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    const updateRes = await useWellPlanningStore.getState().updatePlan(addRes.plan.id, {
      targetObjective: 'Updated Objective Target',
      targetInclination: 75,
    });

    expect(updateRes.ok).toBe(true);
    if (!updateRes.ok) return;
    expect(updateRes.plan.targetObjective).toBe('Updated Objective Target');
    expect(updateRes.plan.targetInclination).toBe(75);
    expect(updateRes.plan.targetDepthMd).toBe(10000);
  });

  it('deletes an existing well plan', async () => {
    const addRes = await useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      targetDepthMd: 10000,
      targetDepthTvd: 8000,
      targetInclination: 60,
      targetAzimuth: 45,
      plannedKickoffDepth: 3000,
      targetObjective: 'To Delete',
    });
    expect(addRes.ok).toBe(true);
    if (!addRes.ok) return;

    const delRes = await useWellPlanningStore.getState().deletePlan(addRes.plan.id);
    expect(delRes.ok).toBe(true);
    expect(useWellPlanningStore.getState().plans).toHaveLength(0);
  });
});
