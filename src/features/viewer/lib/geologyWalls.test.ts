import { Box3, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { Formation } from '@/features/geology';
import type { Well } from '@/features/survey';
import { computeGeologyWalls } from './geologyWalls';
import { SCALE } from './scene';

const TEST_FORMATIONS: Formation[] = [
  {
    id: 'fm-1',
    name: 'Overburden',
    ref: 'TVD',
    well: 'All',
    from: 0,
    to: 1500,
    comp: [{ lith: 'shale', pct: 100 }],
  },
  {
    id: 'fm-2',
    name: 'Target Sand',
    ref: 'TVD',
    well: 'All',
    from: 1500,
    to: 4500,
    comp: [{ lith: 'sandstone', pct: 100 }],
  },
  {
    id: 'fm-3',
    name: 'Sand Stringer',
    ref: 'MD',
    well: 'L1',
    from: 2000,
    to: 2500,
    comp: [{ lith: 'sandstone', pct: 100 }],
  },
];

const MOCK_WELL: Well = {
  name: 'L1',
  slot: 0,
  junction: 0,
  version: 1,
  plan: [
    { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
    { md: 2000, inc: 30, azi: 45, tvd: 1900, n: 100, e: 100, dls: 1.5, beta: 0 },
    { md: 2500, inc: 60, azi: 45, tvd: 2250, n: 300, e: 300, dls: 6, beta: 0 },
    { md: 5000, inc: 90, azi: 45, tvd: 2500, n: 2000, e: 2000, dls: 1.2, beta: 0 },
  ],
  actual: [],
};

describe('computeGeologyWalls', () => {
  it('computes TVD wall layers with negative Y depths corresponding to TVD * SCALE', () => {
    const bounds = new Box3(new Vector3(-20, -50, -20), new Vector3(20, 0, 20));
    const layout = computeGeologyWalls(TEST_FORMATIONS, bounds, [MOCK_WELL]);

    expect(layout.tvdWalls).toHaveLength(2);

    const overburden = layout.tvdWalls[0]!;
    expect(overburden.name).toBe('Overburden');
    expect(overburden.dominantLith).toBe('shale');
    expect(overburden.yTop).toBe(-0 * SCALE);
    expect(overburden.yBottom).toBe(-1500 * SCALE);
    expect(overburden.size[1]).toBeCloseTo(1500 * SCALE);
    expect(overburden.position[1]).toBeCloseTo(-750 * SCALE);
    expect(overburden.northWallPosition).toBeDefined();
    expect(overburden.westWallPosition).toBeDefined();
    expect(overburden.topPlanePosition).toBeDefined();
    expect(overburden.horizonLoop).toHaveLength(5);

    const targetSand = layout.tvdWalls[1]!;
    expect(targetSand.name).toBe('Target Sand');
    expect(targetSand.dominantLith).toBe('sandstone');
    expect(targetSand.yTop).toBe(-1500 * SCALE);
    expect(targetSand.yBottom).toBe(-4500 * SCALE);
    expect(targetSand.size[1]).toBeCloseTo(3000 * SCALE);
    expect(targetSand.position[1]).toBeCloseTo(-3000 * SCALE);
  });

  it('places TVD formation label on the north wall near the top (not at scene perimeter corner)', () => {
    const bounds = new Box3(new Vector3(-20, -50, -20), new Vector3(20, 0, 20));
    const layout = computeGeologyWalls(TEST_FORMATIONS, bounds, [MOCK_WELL]);

    for (const wall of layout.tvdWalls) {
      const [lx, ly, lz] = wall.labelPosition;
      const { footprint } = layout;
      const centerX = (footprint.minX + footprint.maxX) / 2;

      // X should be at the horizontal center of the scene footprint
      expect(lx).toBeCloseTo(centerX, 1);

      // Y must fall inside the formation's vertical band
      expect(ly).toBeLessThanOrEqual(wall.yTop + 0.001);
      expect(ly).toBeGreaterThanOrEqual(wall.yBottom - 0.001);

      // Z should be at the north-wall face (minZ), not the south perimeter (maxZ)
      expect(lz).toBeCloseTo(footprint.minZ, 1);
    }
  });

  it('computes localized MD override bounding boxes for well-specific formations', () => {
    const bounds = new Box3(new Vector3(-20, -50, -20), new Vector3(20, 0, 20));
    const layout = computeGeologyWalls(TEST_FORMATIONS, bounds, [MOCK_WELL]);

    expect(layout.mdOverrides).toHaveLength(1);
    const override = layout.mdOverrides[0]!;
    expect(override.name).toBe('Sand Stringer');
    expect(override.well).toBe('L1');
    expect(override.ref).toBe('MD');
    expect(override.dominantLith).toBe('sandstone');
    expect(override.size[0]).toBeGreaterThan(0);
    expect(override.size[1]).toBeGreaterThan(0);
    expect(override.size[2]).toBeGreaterThan(0);
  });

  it('ignores invalid formations where from >= to', () => {
    const invalidFormations: Formation[] = [
      {
        id: 'bad-1',
        name: 'Inverted',
        ref: 'TVD',
        well: 'All',
        from: 5000,
        to: 2000, // invalid
        comp: [{ lith: 'shale', pct: 100 }],
      },
    ];

    const bounds = new Box3(new Vector3(-20, -50, -20), new Vector3(20, 0, 20));
    const layout = computeGeologyWalls(invalidFormations, bounds, []);
    expect(layout.tvdWalls).toHaveLength(0);
    expect(layout.mdOverrides).toHaveLength(0);
  });
});
