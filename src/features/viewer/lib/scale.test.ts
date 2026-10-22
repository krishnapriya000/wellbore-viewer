import { describe, expect, it } from 'vitest';
import {
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
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

    it('handles infinite/empty bounds with default fallback', () => {
      const emptyBounds = {
        min: { x: Infinity, z: Infinity },
        max: { x: -Infinity, z: -Infinity },
      };
      expect(computeStaffPosition(emptyBounds, 8)).toEqual({ x: -8, z: -8 });
    });
  });
});
