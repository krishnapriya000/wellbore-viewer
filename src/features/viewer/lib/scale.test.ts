import { describe, expect, it } from 'vitest';
import {
  computeDepthGuideLines,
  computeLandingPlanes,
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
  getMaxTvd,
  pickMdInterval,
  pickTvdInterval,
  SCALE,
  tvdToSceneY,
} from './scale';

describe('scale pure calculations', () => {
  describe('tvdToSceneY', () => {
    it('converts TVD in feet to negative scene y using scene scale', () => {
      expect(tvdToSceneY(0)).toBe(0);
      expect(tvdToSceneY(1000)).toBe(-10);
      expect(tvdToSceneY(5500)).toBe(-55);
    });
  });

  describe('pickTvdInterval and computeTvdTicks', () => {
    it('picks intervals based on depth in feet', () => {
      expect(pickTvdInterval(1500, 'ft')).toBe(500);
      expect(pickTvdInterval(4000, 'ft')).toBe(1000);
      expect(pickTvdInterval(9000, 'ft')).toBe(2000);
      expect(pickTvdInterval(15000, 'ft')).toBe(5000);
    });

    it('picks intervals based on depth in metres', () => {
      expect(pickTvdInterval(1000, 'm')).toBeCloseTo(200 / 0.3048);
      expect(pickTvdInterval(5000, 'm')).toBeCloseTo(500 / 0.3048);
      expect(pickTvdInterval(10000, 'm')).toBeCloseTo(1000 / 0.3048);
      expect(pickTvdInterval(20000, 'm')).toBeCloseTo(2000 / 0.3048);
    });

    it('handles zero or negative depths safely', () => {
      const ticks = computeTvdTicks(0, 'ft');
      expect(ticks).toEqual([{ tvdFt: 0, y: 0, label: '0 ft' }]);

      const negTicks = computeTvdTicks(-500, 'm');
      expect(negTicks).toEqual([{ tvdFt: 0, y: 0, label: '0 m' }]);
    });

    it('computes correct ticks and labels for 6000 ft TVD', () => {
      const ticks = computeTvdTicks(6000, 'ft');
      expect(ticks.length).toBe(7); // 0, 1000, 2000, 3000, 4000, 5000, 6000
      expect(ticks[0]).toEqual({ tvdFt: 0, y: 0, label: '0 ft' });
      expect(ticks[1]).toEqual({ tvdFt: 1000, y: -10, label: '1,000 ft' });
      expect(ticks[6]).toEqual({ tvdFt: 6000, y: -60, label: '6,000 ft' });
    });

    it('computes correct ticks in metric units', () => {
      const ticks = computeTvdTicks(3000, 'm'); // ~914 m -> interval 500 m
      expect(ticks[0]!.label).toBe('0 m');
      expect(ticks[1]!.label).toBe('500 m');
      expect(ticks[1]!.y).toBeCloseTo((-500 / 0.3048) * SCALE);
    });
  });

  describe('pickMdInterval and computeMdMarkers', () => {
    it('returns empty array when total MD is zero or negative', () => {
      expect(computeMdMarkers(0, () => null, 'ft')).toEqual([]);
      expect(computeMdMarkers(-100, () => null, 'ft')).toEqual([]);
    });

    it('picks appropriate MD intervals in feet and metres', () => {
      expect(pickMdInterval(2500, 'ft')).toBe(500);
      expect(pickMdInterval(5000, 'ft')).toBe(1000);
      expect(pickMdInterval(12000, 'ft')).toBe(2000);
      expect(pickMdInterval(20000, 'ft')).toBe(5000);

      expect(pickMdInterval(3000, 'm')).toBeCloseTo(250 / 0.3048);
      expect(pickMdInterval(6000, 'm')).toBeCloseTo(500 / 0.3048);
      expect(pickMdInterval(12000, 'm')).toBeCloseTo(1000 / 0.3048);
      expect(pickMdInterval(20000, 'm')).toBeCloseTo(2000 / 0.3048);
    });

    it('computes 3D positions and labels along trajectory', () => {
      // Mock trajectory: 45 degree inclined well going North and East
      const mockAtMd = (md: number) => ({
        md,
        n: md * 0.5,
        e: md * 0.5,
        tvd: md * 0.7,
      });

      const markers = computeMdMarkers(3500, mockAtMd, 'ft');
      expect(markers.length).toBe(3); // 1000, 2000, 3000
      expect(markers[0]!.mdFt).toBe(1000);
      expect(markers[0]!.label).toBe('1,000 ft');
      expect(markers[0]!.position).toEqual({
        x: 500 * SCALE,
        y: -700 * SCALE,
        z: -500 * SCALE,
      });
      expect(markers[1]!.label).toBe('2,000 ft');
      expect(markers[2]!.label).toBe('3,000 ft');
    });

    it('skips stations where atMd returns null', () => {
      const mockAtMd = (md: number) => (md === 1000 ? null : { md, n: 0, e: 0, tvd: md });
      const markers = computeMdMarkers(5000, mockAtMd, 'ft');
      expect(markers.length).toBe(3); // 2000, 3000, 4000 (1000 skipped)
      expect(markers.map((m) => m.mdFt)).toEqual([2000, 3000, 4000]);
    });
  });

  describe('computeStaffPosition', () => {
    it('calculates position offset from bounds min corner', () => {
      const bounds = {
        min: { x: -20, z: -15 },
        max: { x: 50, z: 40 },
      };
      const pos = computeStaffPosition(bounds, 8);
      expect(pos).toEqual({ x: -28, z: -23 });
    });

    it('calculates position for SW corner when specified', () => {
      const bounds = {
        min: { x: -20, z: -15 },
        max: { x: 50, z: 40 },
      };
      const pos = computeStaffPosition(bounds, 8, 'sw');
      expect(pos).toEqual({ x: -28, z: 48 });
    });

    it('handles infinite/empty bounds with default fallback', () => {
      const emptyBounds = {
        min: { x: Infinity, z: Infinity },
        max: { x: -Infinity, z: -Infinity },
      };
      expect(computeStaffPosition(emptyBounds, 8)).toEqual({ x: -8, z: -8 });
    });
  });

  describe('getMaxTvd', () => {
    it('returns 0 for undefined or empty well', () => {
      expect(getMaxTvd(undefined)).toBe(0);
      expect(getMaxTvd({ plan: [], actual: [] })).toBe(0);
    });

    it('finds true maximum TVD even if later stations steer upward', () => {
      const well = {
        plan: [
          { tvd: 0 },
          { tvd: 5000 },
          { tvd: 9200 }, // build section max
          { tvd: 9150 }, // horizontal section steers slightly upward
          { tvd: 9000 },
        ],
        actual: [],
      };
      expect(getMaxTvd(well)).toBe(9200);
    });

    it('finds maximum TVD across multiple wells', () => {
      const wells = [
        { plan: [{ tvd: 4000 }, { tvd: 7500 }], actual: [] },
        { plan: [{ tvd: 3000 }], actual: [{ tvd: 9800 }] },
      ];
      expect(getMaxTvd(wells)).toBe(9800);
    });
  });

  describe('computeLandingPlanes', () => {
    it('returns empty array when no horizontal sections exist', () => {
      const verticalWell = {
        name: 'L1',
        slot: 0,
        plan: [
          { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0 },
          { md: 2000, inc: 15, azi: 45, tvd: 1980, n: 100, e: 100 },
        ],
        actual: [],
      };
      expect(computeLandingPlanes([verticalWell])).toEqual([]);
    });

    it('computes landing plane descriptor for lateral with inc >= 85°', () => {
      const lateralWell = {
        name: 'L1',
        slot: 0,
        plan: [
          { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0 },
          { md: 4000, inc: 45, azi: 45, tvd: 3500, n: 500, e: 500 },
          { md: 6000, inc: 88, azi: 45, tvd: 5000, n: 1500, e: 1500 },
          { md: 8000, inc: 90, azi: 45, tvd: 5000, n: 3000, e: 3000 },
          { md: 10000, inc: 90, azi: 45, tvd: 5000, n: 4500, e: 4500 },
        ],
        actual: [],
      };
      const planes = computeLandingPlanes([lateralWell], 350);
      expect(planes.length).toBe(1);
      expect(planes[0]!.wellName).toBe('L1');
      expect(planes[0]!.slot).toBe(0);
      expect(planes[0]!.avgTvdFt).toBe(5000);
      // minE=1500, maxE=4500 -> diff 3000 + 2*350 = 3700 -> in scene scale: 37
      expect(planes[0]!.width).toBeCloseTo(37);
      expect(planes[0]!.length).toBeCloseTo(37);
      expect(planes[0]!.position.y).toBeCloseTo(-5000 * SCALE - 0.9);
    });
  });

  describe('computeDepthGuideLines', () => {
    it('generates guide lines at major depth ticks', () => {
      const staffPos = { x: -30, z: -20 };
      const bounds = { min: { x: -20, z: -10 }, max: { x: 50, z: 40 } };
      const ticks = [
        { tvdFt: 0, y: 0, label: '0 ft' },
        { tvdFt: 2000, y: -20, label: '2,000 ft' },
        { tvdFt: 4000, y: -40, label: '4,000 ft' },
      ];
      const guides = computeDepthGuideLines(staffPos, bounds, ticks);
      expect(guides.length).toBe(2); // skips surface 0
      expect(guides[0]!.y).toBe(-20);
      expect(guides[0]!.xStart).toBe(-30);
      expect(guides[0]!.zStart).toBe(-20);
      expect(guides[0]!.xEnd).toBeGreaterThan(-30);
      expect(guides[0]!.zEnd).toBeGreaterThan(-20);
    });
  });
});
