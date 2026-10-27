import { beforeEach, describe, expect, it } from 'vitest';
import { formationAt } from '../lib/formationAt';
import { INITIAL_FORMATIONS, useGeologyStore } from './geologyStore';

describe('geologyStore', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
  });

  it('initializes with default sample formations and version 0', () => {
    const state = useGeologyStore.getState();
    expect(state.formations).toHaveLength(INITIAL_FORMATIONS.length);
    expect(state.version).toBe(0);
    expect(state.formations[0]!.name).toBe('Overburden');
  });

  it('adds a valid formation and increments version', () => {
    const result = useGeologyStore.getState().addFormation({
      name: 'Basement Granitoid',
      ref: 'TVD',
      well: 'All',
      from: 6500,
      to: 8000,
      comp: [{ lith: 'basement', pct: 100 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.formation.id).toBeTruthy();
    expect(result.formation.name).toBe('Basement Granitoid');

    const state = useGeologyStore.getState();
    expect(state.formations).toHaveLength(INITIAL_FORMATIONS.length + 1);
    expect(state.version).toBe(1);
    expect(state.formations.at(-1)?.name).toBe('Basement Granitoid');
  });

  it('rejects adding a formation with duplicate ID', () => {
    const result = useGeologyStore.getState().addFormation({
      id: 'fm-1', // Already in INITIAL_FORMATIONS
      name: 'Duplicate',
      ref: 'TVD',
      well: 'All',
      from: 0,
      to: 100,
      comp: [{ lith: 'shale', pct: 100 }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already exists/i);
    expect(useGeologyStore.getState().version).toBe(0);
  });

  it('rejects adding an invalid formation (to <= from or pct != 100)', () => {
    const invertedDepth = useGeologyStore.getState().addFormation({
      name: 'Bad Depths',
      ref: 'TVD',
      well: 'All',
      from: 2000,
      to: 1000,
      comp: [{ lith: 'shale', pct: 100 }],
    });
    expect(invertedDepth.ok).toBe(false);

    const badPct = useGeologyStore.getState().addFormation({
      name: 'Bad Percent',
      ref: 'TVD',
      well: 'All',
      from: 1000,
      to: 2000,
      comp: [{ lith: 'shale', pct: 80 }],
    });
    expect(badPct.ok).toBe(false);
    if (!badPct.ok) {
      expect(badPct.error).toMatch(/total 100%/i);
    }
  });

  it('updates an existing formation and bumps version', () => {
    const updateResult = useGeologyStore.getState().updateFormation('fm-3', {
      name: 'Target Sand (Updated)',
      ref: 'TVD',
      well: 'All',
      from: 3500,
      to: 4600,
      comp: [
        { lith: 'sandstone', pct: 90 },
        { lith: 'shale', pct: 10 },
      ],
    });

    expect(updateResult.ok).toBe(true);
    const updated = useGeologyStore.getState().formations.find((f) => f.id === 'fm-3');
    expect(updated?.name).toBe('Target Sand (Updated)');
    expect(updated?.to).toBe(4600);
    expect(useGeologyStore.getState().version).toBe(1);
  });

  it('returns an error when updating a non-existent formation', () => {
    const result = useGeologyStore.getState().updateFormation('non-existent-id', {
      name: 'Ghost',
      ref: 'TVD',
      well: 'All',
      from: 0,
      to: 100,
      comp: [{ lith: 'shale', pct: 100 }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not found/i);
  });

  it('removes an existing formation and increments version', () => {
    const result = useGeologyStore.getState().removeFormation('fm-2');
    expect(result.ok).toBe(true);

    const state = useGeologyStore.getState();
    expect(state.formations.some((f) => f.id === 'fm-2')).toBe(false);
    expect(state.formations).toHaveLength(INITIAL_FORMATIONS.length - 1);
    expect(state.version).toBe(1);
  });

  it('returns error when removing non-existent formation', () => {
    const result = useGeologyStore.getState().removeFormation('non-existent-id');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not found/i);
  });

  it('replaces the entire formation list via setFormations', () => {
    const newList = [
      {
        id: 'new-1',
        name: 'Single Layer',
        ref: 'TVD' as const,
        well: 'All',
        from: 0,
        to: 5000,
        comp: [{ lith: 'limestone' as const, pct: 100 }],
      },
    ];

    const result = useGeologyStore.getState().setFormations(newList);
    expect(result.ok).toBe(true);

    const state = useGeologyStore.getState();
    expect(state.formations).toHaveLength(1);
    expect(state.formations[0]!.id).toBe('new-1');
    expect(state.version).toBe(1);
  });

  it('rejects setFormations if any entry is invalid', () => {
    const invalidList = [
      {
        id: 'bad-1',
        name: 'Invalid',
        ref: 'TVD' as const,
        well: 'All',
        from: 5000,
        to: 1000, // inverted
        comp: [{ lith: 'limestone' as const, pct: 100 }],
      },
    ];

    const result = useGeologyStore.getState().setFormations(invalidList);
    expect(result.ok).toBe(false);
    expect(useGeologyStore.getState().formations).toHaveLength(INITIAL_FORMATIONS.length);
  });

  it('integrates seamlessly with formationAt query', () => {
    const state = useGeologyStore.getState();
    // At L1 depth 4200 MD, the MD override 'Sand Stringer' applies
    const fmL1 = formationAt(state.formations, 'L1', 4200, 4200);
    expect(fmL1?.name).toBe('Sand Stringer');

    // At L2 depth 4200 MD, no MD override exists; TVD layer 'Target Sand' applies
    const fmL2 = formationAt(state.formations, 'L2', 4200, 4200);
    expect(fmL2?.name).toBe('Target Sand');
  });

  it('toggles formation visibility and updates formationAt behavior', () => {
    const res = useGeologyStore.getState().toggleVisibility('fm-1');
    expect(res.ok).toBe(true);

    const f1 = useGeologyStore.getState().formations.find((f) => f.id === 'fm-1');
    expect(f1?.visible).toBe(false);

    // When hidden, formationAt skips fm-1 (Overburden: 0-1500) and returns null
    const hiddenQuery = formationAt(useGeologyStore.getState().formations, 'L1', 500, 500);
    expect(hiddenQuery).toBeNull();

    // Toggle back on
    const res2 = useGeologyStore.getState().toggleVisibility('fm-1');
    expect(res2.ok).toBe(true);
    const visibleQuery = formationAt(useGeologyStore.getState().formations, 'L1', 500, 500);
    expect(visibleQuery?.name).toBe('Overburden');
  });

  it('returns error when toggling visibility for non-existent formation', () => {
    const res = useGeologyStore.getState().toggleVisibility('non-existent');
    expect(res.ok).toBe(false);
  });

  describe('persistence', () => {
    it('persists changes to localStorage and reloads on startup', () => {
      useGeologyStore.getState().addFormation({
        id: 'persisted-1',
        name: 'Persistent Caprock',
        ref: 'TVD',
        well: 'All',
        from: 5000,
        to: 5500,
        comp: [{ lith: 'anhydrite', pct: 100 }],
      });

      const raw = localStorage.getItem('wellbore_geology_v1');
      expect(raw).toBeTruthy();
      expect(raw).toContain('Persistent Caprock');
    });

    it('gracefully recovers from corrupt localStorage payload and falls back to sample data', () => {
      localStorage.setItem('wellbore_geology_v1', 'NOT_VALID_JSON{:::');
      useGeologyStore.getState().resetToSample();
      expect(useGeologyStore.getState().formations).toHaveLength(INITIAL_FORMATIONS.length);
    });

    it('rejects invalid schema records in localStorage and keeps valid entries', () => {
      const corruptPayload = {
        version: 1,
        formations: [
          {
            id: 'corrupt-1',
            name: 'Inverted',
            ref: 'TVD',
            well: 'All',
            from: 6000,
            to: 1000, // Invalid: to <= from
            comp: [{ lith: 'sandstone', pct: 100 }],
          },
          {
            id: 'good-1',
            name: 'Valid Layer',
            ref: 'TVD',
            well: 'All',
            from: 1000,
            to: 2000,
            comp: [{ lith: 'limestone', pct: 100 }],
          },
        ],
      };
      localStorage.setItem('wellbore_geology_v1', JSON.stringify(corruptPayload));
      // Re-initialize state
      useGeologyStore.getState().resetToSample();
      expect(useGeologyStore.getState().formations).toHaveLength(INITIAL_FORMATIONS.length);
    });
  });
});
