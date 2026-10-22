import { describe, expect, it } from 'vitest';
import type { SurveyPoint } from '@/features/survey';
import type { Formation } from '../model/types';
import {
  computeMdIntervals,
  computeStripLogTicks,
  computeTvdIntervals,
  getIntervalsDepthRange,
} from './stripLogLayout';

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
    comp: [{ lith: 'sandstone', pct: 100 }],
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

const MOCK_SURVEY: SurveyPoint[] = [
  { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
  { md: 2000, inc: 0, azi: 0, tvd: 2000, n: 0, e: 0, dls: 0, beta: 0 },
  { md: 4000, inc: 80, azi: 45, tvd: 3800, n: 500, e: 500, dls: 4, beta: 0 },
  { md: 4500, inc: 90, azi: 45, tvd: 3900, n: 900, e: 900, dls: 2, beta: 0 },
];

describe('stripLogLayout', () => {
  describe('computeTvdIntervals', () => {
    it('returns TVD formations sorted by depth and skips MD overrides', () => {
      const intervals = computeTvdIntervals(TEST_FORMATIONS);
      expect(intervals).toHaveLength(3);
      expect(intervals[0]!.name).toBe('Overburden');
      expect(intervals[0]!.fromFt).toBe(0);
      expect(intervals[0]!.toFt).toBe(1500);

      expect(intervals[1]!.name).toBe('Upper Shale');
      expect(intervals[2]!.name).toBe('Target Sand');

      // None of the TVD intervals are flagged as override
      expect(intervals.every((i) => !i.isOverride)).toBe(true);
    });

    it('skips invalid formations where to <= from', () => {
      const invalid: Formation[] = [
        ...TEST_FORMATIONS,
        {
          id: 'bad',
          name: 'Inverted',
          ref: 'TVD',
          well: 'All',
          from: 5000,
          to: 2000,
          comp: [{ lith: 'shale', pct: 100 }],
        },
      ];
      const intervals = computeTvdIntervals(invalid);
      expect(intervals).toHaveLength(3);
    });
  });

  describe('computeMdIntervals', () => {
    it('segments MD trajectory and applies MD overrides to specified well', () => {
      const intervalsL1 = computeMdIntervals(TEST_FORMATIONS, 'L1', MOCK_SURVEY);
      expect(intervalsL1.length).toBeGreaterThanOrEqual(3);

      // Check that Sand Stringer appears as an override interval on L1
      const override = intervalsL1.find((i) => i.name === 'Sand Stringer');
      expect(override).toBeDefined();
      expect(override?.isOverride).toBe(true);
      expect(override?.fromFt).toBeCloseTo(4100, 0);
      expect(override?.toFt).toBeCloseTo(4300, 0);
    });

    it('does not apply MD override to other wells in MD mode', () => {
      const intervalsL2 = computeMdIntervals(TEST_FORMATIONS, 'L2', MOCK_SURVEY);
      const override = intervalsL2.find((i) => i.name === 'Sand Stringer');
      expect(override).toBeUndefined();
    });
  });

  describe('computeStripLogTicks', () => {
    it('generates rounded ticks in feet', () => {
      const ticks = computeStripLogTicks(0, 4500, 'ft');
      expect(ticks.length).toBeGreaterThan(2);
      expect(ticks[0]!.label).toBe('0');
      expect(ticks[1]!.depthFt).toBeGreaterThan(0);
    });

    it('generates rounded ticks in meters', () => {
      const ticks = computeStripLogTicks(0, 4500, 'm');
      expect(ticks.length).toBeGreaterThan(2);
      expect(ticks[0]!.label).toBe('0');
      // Converted display values should be in meters
      expect(ticks[ticks.length - 1]!.depthDisplay).toBeLessThan(4500);
    });
  });

  describe('getIntervalsDepthRange', () => {
    it('derives accurate min and max depth spanning all intervals', () => {
      const intervals = computeTvdIntervals(TEST_FORMATIONS);
      const range = getIntervalsDepthRange(intervals);
      expect(range.minDepthFt).toBe(0);
      expect(range.maxDepthFt).toBe(4500);
    });

    it('returns sensible defaults when intervals are empty', () => {
      const range = getIntervalsDepthRange([]);
      expect(range.minDepthFt).toBe(0);
      expect(range.maxDepthFt).toBe(5000);
    });
  });
});
