import { describe, expect, it } from 'vitest';
import type { SurveyPoint, Well } from '@/features/survey';
import type { ConstructionItem } from '../model/types';
import {
  computeConstructionRadius,
  computeConstructionSegments,
  sampleTrajectorySpan,
} from './casingGeometry';

// Helper to create synthetic survey stations
function createTestSurvey(depths: number[]): SurveyPoint[] {
  return depths.map((md) => ({
    md,
    inc: md > 2000 ? Math.min(90, (md - 2000) * 0.02) : 0,
    azi: 45,
    tvd: md > 2000 ? 2000 + (md - 2000) * 0.7 : md,
    n: md > 2000 ? (md - 2000) * 0.5 : 0,
    e: md > 2000 ? (md - 2000) * 0.5 : 0,
    dls: 0,
    beta: 0,
  }));
}

const mockWells: Record<string, Well> = {
  L1: {
    name: 'L1',
    slot: 0,
    plan: createTestSurvey([0, 1000, 2000, 3000, 5000, 8000]),
    actual: createTestSurvey([0, 1000, 2000, 3000, 5000, 8000]),
    junction: 0,
    version: 1,
  },
  L2: {
    name: 'L2',
    slot: 1,
    plan: createTestSurvey([0, 1000, 2000, 3000, 5000, 9000]),
    actual: createTestSurvey([0, 1000, 2000, 3000, 5000, 9000]),
    junction: 3000,
    version: 1,
  },
};

describe('casingGeometry', () => {
  describe('computeConstructionRadius', () => {
    it('computes concentric engineering radii respecting the physical hierarchy', () => {
      const casingRadius = computeConstructionRadius('casing', 13.375);
      const cementRadius = computeConstructionRadius('cement', 13.375);
      const holeRadius = computeConstructionRadius('hole', 17.5);

      // Trajectory core = 0.42
      // Casing should be larger than trajectory core
      expect(casingRadius).toBeGreaterThan(0.42);

      // Cement sheath must envelope the casing string (casingRadius + 0.08)
      expect(cementRadius).toBeCloseTo(casingRadius + 0.08, 4);

      // Hole borehole rock boundary must exceed the casing string
      expect(holeRadius).toBeGreaterThan(casingRadius);
    });

    it('scales monotonically with entered diameter', () => {
      const rSmall = computeConstructionRadius('casing', 7.0);
      const rMed = computeConstructionRadius('casing', 9.625);
      const rLarge = computeConstructionRadius('casing', 13.375);

      expect(rSmall).toBeLessThan(rMed);
      expect(rMed).toBeLessThan(rLarge);
    });

    it('safely clamps extreme or out-of-range sizes', () => {
      const rMin = computeConstructionRadius('casing', -5);
      const rClamped1 = computeConstructionRadius('casing', 1);
      expect(rMin).toEqual(rClamped1);

      const rMax = computeConstructionRadius('casing', 120);
      const rClamped60 = computeConstructionRadius('casing', 60);
      expect(rMax).toEqual(rClamped60);
    });
  });

  describe('sampleTrajectorySpan', () => {
    const survey = createTestSurvey([0, 1000, 2000, 3000, 4000, 5000]);

    it('returns empty array when survey has fewer than 2 points', () => {
      expect(sampleTrajectorySpan([], 0, 1000)).toEqual([]);
      expect(sampleTrajectorySpan([survey[0]!], 0, 1000)).toEqual([]);
    });

    it('returns empty array when endMd <= startMd', () => {
      expect(sampleTrajectorySpan(survey, 1000, 1000)).toEqual([]);
      expect(sampleTrajectorySpan(survey, 2000, 1000)).toEqual([]);
    });

    it('samples 3D points along the trajectory arc with sub-station density', () => {
      const pts = sampleTrajectorySpan(survey, 500, 2500, 200);
      expect(pts.length).toBeGreaterThan(5);

      // First point corresponds to startMd (500 ft)
      // Since scale is 0.01: TVD at 500 = 500 -> scene Y = -5.0
      expect(pts[0]![1]).toBeCloseTo(-5.0, 1);

      // Last point corresponds to endMd (2500 ft)
      expect(pts.at(-1)![1]).toBeLessThan(-15.0);
    });

    it('deduplicates identical consecutive coordinates safely', () => {
      const flatSurvey: SurveyPoint[] = [
        { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
        { md: 10, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      ];
      // When points have 0 distance, cannot form valid 3D curve
      const pts = sampleTrajectorySpan(flatSurvey, 0, 10);
      expect(pts).toEqual([]);
    });
  });

  describe('computeConstructionSegments', () => {
    it('returns empty array when no construction items exist', () => {
      const segments = computeConstructionSegments([], mockWells, ['L1', 'L2']);
      expect(segments).toEqual([]);
    });

    it('maps shared "All" items to the motherbore well (wellOrder[0]) without duplication', () => {
      const items: ConstructionItem[] = [
        {
          id: 'hole-1',
          kind: 'hole',
          size: 17.5,
          from: 0,
          to: 1500,
          well: 'All',
          note: '',
        },
        {
          id: 'csg-1',
          kind: 'casing',
          size: 13.375,
          from: 0,
          to: 1500,
          well: 'All',
          note: '',
        },
      ];

      const segments = computeConstructionSegments(items, mockWells, ['L1', 'L2']);

      // Should map to L1 (motherbore), but NOT duplicate onto L2
      expect(segments).toHaveLength(2);
      expect(segments[0]!.wellName).toBe('L1');
      expect(segments[1]!.wellName).toBe('L1');
      expect(segments.some((s) => s.wellName === 'L2')).toBe(false);
    });

    it('maps well-specific items strictly to their target well', () => {
      const items: ConstructionItem[] = [
        {
          id: 'csg-l1',
          kind: 'casing',
          size: 9.625,
          from: 1500,
          to: 5000,
          well: 'L1',
          note: '',
        },
        {
          id: 'csg-l2',
          kind: 'casing',
          size: 7.0,
          from: 3000,
          to: 6000,
          well: 'L2',
          note: '',
        },
      ];

      const segments = computeConstructionSegments(items, mockWells, ['L1', 'L2']);
      expect(segments).toHaveLength(2);

      const l1Seg = segments.find((s) => s.itemId === 'csg-l1');
      const l2Seg = segments.find((s) => s.itemId === 'csg-l2');

      expect(l1Seg).toBeDefined();
      expect(l1Seg!.wellName).toBe('L1');

      expect(l2Seg).toBeDefined();
      expect(l2Seg!.wellName).toBe('L2');
    });

    it('calculates casing shoe 3D position for casing strings', () => {
      const items: ConstructionItem[] = [
        {
          id: 'csg-1',
          kind: 'casing',
          size: 13.375,
          from: 0,
          to: 2000,
          well: 'L1',
          note: '',
        },
        {
          id: 'hole-1',
          kind: 'hole',
          size: 17.5,
          from: 0,
          to: 2000,
          well: 'L1',
          note: '',
        },
      ];

      const segments = computeConstructionSegments(items, mockWells, ['L1']);
      const csgSeg = segments.find((s) => s.kind === 'casing')!;
      const holeSeg = segments.find((s) => s.kind === 'hole')!;

      // Casing string has shoePosition
      expect(csgSeg.shoePosition).toBeDefined();
      expect(csgSeg.shoePosition![1]).toBeCloseTo(-20.0, 1); // 2000 ft * 0.01 = -20 scene Y

      // Hole section has no casing shoe
      expect(holeSeg.shoePosition).toBeUndefined();
    });

    it('detects fit-check engineering warnings and sets hasWarnings flag', () => {
      const items: ConstructionItem[] = [
        {
          id: 'hole-1',
          kind: 'hole',
          size: 8.5,
          from: 0,
          to: 2000,
          well: 'L1',
          note: '',
        },
        {
          id: 'csg-oversized',
          kind: 'casing',
          size: 9.625, // 9.625" casing inside 8.5" hole -> will not fit!
          from: 0,
          to: 2000,
          well: 'L1',
          note: '',
        },
        {
          id: 'cmt-uncovered',
          kind: 'cement',
          size: 7.0, // No 7" casing covers this interval
          from: 500,
          to: 1800,
          well: 'L1',
          note: '',
        },
      ];

      const segments = computeConstructionSegments(items, mockWells, ['L1']);

      const csgSeg = segments.find((s) => s.itemId === 'csg-oversized')!;
      expect(csgSeg.hasWarnings).toBe(true);
      expect(csgSeg.warnings[0]).toMatch(/will not fit/i);

      const cmtSeg = segments.find((s) => s.itemId === 'cmt-uncovered')!;
      expect(cmtSeg.hasWarnings).toBe(true);
      expect(cmtSeg.warnings[0]).toMatch(/no 7" casing spans/i);
    });

    it('safely skips items starting beyond well total depth or with zero span', () => {
      const items: ConstructionItem[] = [
        {
          id: 'out-of-bounds',
          kind: 'hole',
          size: 12.25,
          from: 10000, // L1 TD is 8000 ft
          to: 12000,
          well: 'L1',
          note: '',
        },
        {
          id: 'zero-span',
          kind: 'hole',
          size: 12.25,
          from: 2000,
          to: 2000,
          well: 'L1',
          note: '',
        },
      ];

      const segments = computeConstructionSegments(items, mockWells, ['L1']);
      expect(segments).toEqual([]);
    });
  });
});
