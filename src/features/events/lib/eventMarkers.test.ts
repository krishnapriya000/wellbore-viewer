import { describe, expect, it } from 'vitest';
import { computeSurvey, type SurveyPoint, type Well } from '@/features/survey';
import type { DrillEvent } from '../model/types';
import {
  computeEventMarkers,
  getUnplacedEventDiagnostics,
  SCALE,
  surveyPointToScene,
} from './eventMarkers';

function makeWell(name: string, points: SurveyPoint[]): Well {
  return {
    name,
    slot: 0,
    plan: points,
    actual: points,
    junction: 0,
    version: 1,
  };
}

describe('eventMarkers', () => {
  const verticalStations = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1000, inc: 0, azi: 0 },
    { md: 2000, inc: 0, azi: 0 },
  ]);

  const inclinedStations = computeSurvey([
    { md: 0, inc: 0, azi: 45 },
    { md: 1000, inc: 30, azi: 45 },
    { md: 2000, inc: 45, azi: 45 },
  ]);

  const horizontalStations = computeSurvey([
    { md: 0, inc: 0, azi: 90 },
    { md: 1000, inc: 90, azi: 90 },
    { md: 2000, inc: 90, azi: 90 },
  ]);

  describe('coordinate conversions', () => {
    it('maps survey point to Three.js coordinates (x = e * 0.01, y = -tvd * 0.01, z = -n * 0.01)', () => {
      const pt: SurveyPoint = {
        md: 1500,
        inc: 20,
        azi: 45,
        tvd: 1400,
        n: 200,
        e: 300,
        dls: 0,
        beta: 0,
      };
      const scenePos = surveyPointToScene(pt);

      expect(scenePos.x).toBeCloseTo(300 * SCALE);
      expect(scenePos.y).toBeCloseTo(-1400 * SCALE);
      expect(scenePos.z).toBeCloseTo(-200 * SCALE);
    });
  });

  describe('trajectory placement', () => {
    it('places marker at exact depth on vertical trajectory', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', verticalStations),
      };
      const events: DrillEvent[] = [
        { id: 'ev-1', well: 'L1', md: 1500, type: 'casing', note: 'Shoe' },
      ];

      const markers = computeEventMarkers(events, wells, 'ft');
      expect(markers).toHaveLength(1);
      const m = markers[0]!;
      expect(m.id).toBe('ev-1');
      expect(m.well).toBe('L1');
      expect(m.mdFt).toBe(1500);
      expect(m.position.x).toBeCloseTo(0);
      expect(m.position.y).toBeCloseTo(-1500 * SCALE);
      expect(m.position.z).toBeCloseTo(0);
    });

    it('interpolates position accurately on inclined trajectory', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', inclinedStations),
      };
      // At md 1500 (halfway in inclined section)
      const events: DrillEvent[] = [
        { id: 'ev-2', well: 'L1', md: 1500, type: 'gas', note: 'Gas show' },
      ];

      const markers = computeEventMarkers(events, wells, 'ft');
      expect(markers).toHaveLength(1);
      const m = markers[0]!;
      // On azi 45, both east and north are > 0, so scene x > 0 and z < 0
      expect(m.position.x).toBeGreaterThan(0);
      expect(m.position.z).toBeLessThan(0);
      expect(m.position.y).toBeLessThan(0);
    });

    it('places marker accurately along horizontal wellbore section', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', horizontalStations),
      };
      // At md 1500 along horizontal section (azi = 90 -> pure East)
      const events: DrillEvent[] = [
        { id: 'ev-3', well: 'L1', md: 1500, type: 'oil_good', note: 'Pay zone' },
      ];

      const markers = computeEventMarkers(events, wells, 'ft');
      expect(markers).toHaveLength(1);
      const m = markers[0]!;
      expect(m.position.x).toBeGreaterThan(0);
      expect(m.position.y).toBeLessThan(0);
    });
  });

  describe('multilateral well mapping', () => {
    it('maps events to their distinct designated wells (L1 vs L2)', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', verticalStations),
        L2: makeWell('L2', inclinedStations),
      };

      const events: DrillEvent[] = [
        { id: 'ev-l1', well: 'L1', md: 1200, type: 'casing', note: 'L1 Casing' },
        { id: 'ev-l2', well: 'L2', md: 1600, type: 'kick', note: 'L2 Kick' },
      ];

      const markers = computeEventMarkers(events, wells, 'ft');
      expect(markers).toHaveLength(2);

      const m1 = markers.find((m) => m.id === 'ev-l1')!;
      const m2 = markers.find((m) => m.id === 'ev-l2')!;

      expect(m1.well).toBe('L1');
      expect(m1.position.x).toBe(0); // vertical trajectory has x=0
      expect(m2.well).toBe('L2');
      expect(m2.position.x).toBeGreaterThan(0); // inclined trajectory has east > 0
    });
  });

  describe('edge cases and diagnostics', () => {
    it('skips events with unknown wells, negative MDs, or MD exceeding TD', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', verticalStations), // max MD = 2000
      };

      const events: DrillEvent[] = [
        { id: 'ev-bad-well', well: 'GhostWell', md: 500, type: 'gas', note: '' },
        { id: 'ev-neg-md', well: 'L1', md: -100, type: 'gas', note: '' },
        { id: 'ev-beyond-td', well: 'L1', md: 3500, type: 'gas', note: '' },
      ];

      const markers = computeEventMarkers(events, wells, 'ft');
      expect(markers).toHaveLength(0);

      const diagnostics = getUnplacedEventDiagnostics(events, wells);
      expect(diagnostics).toHaveLength(3);
      expect(diagnostics.some((d) => d.reason === 'unknown_well')).toBe(true);
      expect(diagnostics.some((d) => d.reason === 'negative_md')).toBe(true);
      expect(diagnostics.some((d) => d.reason === 'out_of_range_md')).toBe(true);
    });

    it('correctly reports unit conversion in mdDisplay', () => {
      const wells: Record<string, Well> = {
        L1: makeWell('L1', verticalStations),
      };
      const events: DrillEvent[] = [
        { id: 'ev-units', well: 'L1', md: 1000, type: 'casing', note: '' },
      ];

      const markersFt = computeEventMarkers(events, wells, 'ft');
      expect(markersFt[0]!.mdDisplay).toBe(1000);
      expect(markersFt[0]!.unit).toBe('ft');

      const markersM = computeEventMarkers(events, wells, 'm');
      expect(markersM[0]!.mdDisplay).toBeCloseTo(304.8, 1);
      expect(markersM[0]!.unit).toBe('m');
    });
  });
});
