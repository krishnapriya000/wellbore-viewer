import { describe, expect, it } from 'vitest';
import type { SurveyPoint } from '@/features/survey';
import type { Formation } from '../model/types';
import { computeSleeveSegments } from './sleevePath';

const pt = (
  md: number,
  inc: number,
  azi: number,
  tvd: number,
  n: number,
  e: number,
  dls = 0,
): SurveyPoint => ({
  md,
  inc,
  azi,
  tvd,
  n,
  e,
  dls,
  beta: 0,
});

// Sample formations matching the geological model
const TEST_FORMATIONS: Formation[] = [
  {
    id: 'fm-1',
    name: 'Overburden',
    ref: 'TVD',
    well: 'All',
    from: 0,
    to: 1500,
    comp: [
      { lith: 'shale', pct: 70 },
      { lith: 'sandstone', pct: 30 },
    ],
  },
  {
    id: 'fm-2',
    name: 'Upper Shale',
    ref: 'TVD',
    well: 'All',
    from: 1500,
    to: 3500,
    comp: [{ lith: 'shale', pct: 100 }],
  },
  {
    id: 'fm-3',
    name: 'Target Sand',
    ref: 'TVD',
    well: 'All',
    from: 3500,
    to: 4500,
    comp: [
      { lith: 'sandstone', pct: 85 },
      { lith: 'siltstone', pct: 15 },
    ],
  },
  {
    id: 'fm-4',
    name: 'Lower Carbonate',
    ref: 'TVD',
    well: 'All',
    from: 4500,
    to: 6500,
    comp: [
      { lith: 'limestone', pct: 60 },
      { lith: 'dolomite', pct: 40 },
    ],
  },
  {
    id: 'fm-5',
    name: 'Sand Stringer',
    ref: 'MD',
    well: 'L1',
    from: 4100,
    to: 4300,
    comp: [{ lith: 'sandstone', pct: 100 }],
  },
];

describe('computeSleeveSegments', () => {
  it('handles a vertical trajectory crossing multiple TVD formations', () => {
    // Pure vertical well: MD === TVD, Inc === 0
    const verticalStations: SurveyPoint[] = [
      pt(0, 0, 0, 0, 0, 0),
      pt(1000, 0, 0, 1000, 0, 0),
      pt(2000, 0, 0, 2000, 0, 0),
      pt(3000, 0, 0, 3000, 0, 0),
    ];

    const segments = computeSleeveSegments(verticalStations, 'L1', TEST_FORMATIONS);

    // Crosses Overburden (0-1500 ft) then Upper Shale (1500-3500 ft)
    expect(segments.length).toBe(2);
    expect(segments[0]!.formationName).toBe('Overburden');
    expect(segments[0]!.startTvd).toBe(0);
    expect(segments[0]!.endTvd).toBeCloseTo(1500, 0);

    expect(segments[1]!.formationName).toBe('Upper Shale');
    expect(segments[1]!.startTvd).toBeCloseTo(1500, 0);
    expect(segments[1]!.endTvd).toBe(3000);
  });

  it('handles an inclined/build section transitioning formations as TVD deepens', () => {
    // Section building inclination from 0° to 60°
    const buildStations: SurveyPoint[] = [
      pt(3000, 0, 45, 3000, 0, 0),
      pt(3500, 30, 45, 3450, 70, 70, 6),
      pt(4000, 60, 45, 3800, 250, 250, 6),
    ];

    const segments = computeSleeveSegments(buildStations, 'L2', TEST_FORMATIONS);

    // Crosses TVD 3500 ft boundary between Upper Shale and Target Sand
    expect(segments.length).toBe(2);
    expect(segments[0]!.formationName).toBe('Upper Shale');
    expect(segments[1]!.formationName).toBe('Target Sand');
    expect(segments[0]!.endTvd).toBeCloseTo(3500, 0);
    expect(segments[1]!.startTvd).toBeCloseTo(3500, 0);
  });

  it('handles a horizontal section staying near constant TVD', () => {
    // Lateral staying horizontal at TVD ~4000 ft (inside Target Sand 3500-4500)
    const horizontalStations: SurveyPoint[] = [
      pt(4500, 90, 90, 4000, 100, 500),
      pt(5500, 90, 90, 4000, 100, 1500),
      pt(6500, 90, 90, 4000, 100, 2500),
    ];

    const segments = computeSleeveSegments(horizontalStations, 'L2', TEST_FORMATIONS);

    // Entire horizontal section should remain in Target Sand
    expect(segments.length).toBe(1);
    expect(segments[0]!.formationName).toBe('Target Sand');
    expect(segments[0]!.startMd).toBe(4500);
    expect(segments[0]!.endMd).toBe(6500);
  });

  it('applies MD overrides to the specified well, but not to other multilateral laterals', () => {
    // Both wells L1 and L2 drill through MD 4000 - 4500 at TVD ~4000
    const stations: SurveyPoint[] = [
      pt(4000, 80, 45, 3950, 200, 200),
      pt(4200, 85, 45, 3970, 350, 350, 2),
      pt(4500, 90, 45, 4000, 600, 600, 2),
    ];

    // For well L1: MD override 'Sand Stringer' applies from 4100 to 4300 MD
    const segmentsL1 = computeSleeveSegments(stations, 'L1', TEST_FORMATIONS);
    expect(segmentsL1.length).toBe(3);
    expect(segmentsL1[0]!.formationName).toBe('Target Sand');
    expect(segmentsL1[0]!.endMd).toBeCloseTo(4100, 0);

    expect(segmentsL1[1]!.formationName).toBe('Sand Stringer');
    expect(segmentsL1[1]!.ref).toBe('MD');
    expect(segmentsL1[1]!.startMd).toBeCloseTo(4100, 0);
    expect(segmentsL1[1]!.endMd).toBeCloseTo(4300, 0);

    expect(segmentsL1[2]!.formationName).toBe('Target Sand');
    expect(segmentsL1[2]!.startMd).toBeCloseTo(4300, 0);

    // For well L2: MD override does NOT apply; it stays in Target Sand
    const segmentsL2 = computeSleeveSegments(stations, 'L2', TEST_FORMATIONS);
    expect(segmentsL2.length).toBe(1);
    expect(segmentsL2[0]!.formationName).toBe('Target Sand');
  });

  it('ensures adjacent segments share their boundary transition point for gapless tubes', () => {
    const stations: SurveyPoint[] = [pt(1000, 0, 0, 1000, 0, 0), pt(2000, 0, 0, 2000, 0, 0)];

    const segments = computeSleeveSegments(stations, 'L1', TEST_FORMATIONS);
    expect(segments.length).toBe(2);

    const seg1End = segments[0]!.points.at(-1)!;
    const seg2Start = segments[1]!.points[0]!;

    expect(seg1End.md).toBeCloseTo(seg2Start.md, 1);
    expect(seg1End.scene[0]).toBeCloseTo(seg2Start.scene[0], 2);
    expect(seg1End.scene[1]).toBeCloseTo(seg2Start.scene[1], 2);
    expect(seg1End.scene[2]).toBeCloseTo(seg2Start.scene[2], 2);
  });

  it('handles empty or single-point trajectories cleanly', () => {
    expect(computeSleeveSegments([], 'L1', TEST_FORMATIONS)).toEqual([]);
    expect(computeSleeveSegments([pt(0, 0, 0, 0, 0, 0)], 'L1', TEST_FORMATIONS)).toEqual([]);
  });

  it('handles missing or empty formation data with fallback segment', () => {
    const stations: SurveyPoint[] = [pt(0, 0, 0, 0, 0, 0), pt(1000, 0, 0, 1000, 0, 0)];

    const segments = computeSleeveSegments(stations, 'L1', []);
    expect(segments.length).toBe(1);
    expect(segments[0]!.formationId).toBeNull();
    expect(segments[0]!.formationName).toBe('Unmapped');
    expect(segments[0]!.points.length).toBeGreaterThanOrEqual(2);
  });
});
