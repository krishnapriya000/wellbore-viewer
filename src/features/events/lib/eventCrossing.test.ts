import { describe, expect, it } from 'vitest';
import type { SurveyPoint } from '@/features/survey';
import type { DrillEvent } from '../model/types';
import {
  detectCrossings,
  findPassedEvents,
  formatEventFeedText,
} from './eventCrossing';

function makeStation(md: number): SurveyPoint {
  return {
    md,
    inc: 0,
    azi: 45,
    tvd: md,
    n: 0,
    e: 0,
    dls: 0,
    beta: 0,
  };
}

describe('eventCrossing', () => {
  const sampleEvents: DrillEvent[] = [
    {
      id: 'ev-1',
      well: 'L1',
      md: 1200,
      type: 'casing',
      note: 'Surface casing shoe',
    },
    {
      id: 'ev-2',
      well: 'L1',
      md: 2450,
      type: 'gas',
      note: '150 units gas show',
    },
    {
      id: 'ev-3',
      well: 'L1',
      md: 3600,
      type: 'oil_good',
      note: 'Target sand oil show',
    },
    {
      id: 'ev-l2',
      well: 'L2',
      md: 2000,
      type: 'fault',
      note: 'Normal fault on lateral 2',
    },
  ];

  const stations: SurveyPoint[] = [
    makeStation(1000),
    makeStation(1200),
    makeStation(2000),
    makeStation(3000),
    makeStation(4000),
  ];

  describe('findPassedEvents', () => {
    it('detects single event crossed in depth interval', () => {
      const passed = findPassedEvents(sampleEvents, 'L1', 1100, 1300);
      expect(passed).toHaveLength(1);
      expect(passed[0]!.id).toBe('ev-1');
      expect(passed[0]!.type).toBe('casing');
    });

    it('detects multiple events crossed in one larger update', () => {
      // Moves from 1000 to 3000 -> crosses ev-1 (1200) and ev-2 (2450)
      const passed = findPassedEvents(sampleEvents, 'L1', 1000, 3000);
      expect(passed).toHaveLength(2);
      expect(passed.map((e) => e.id)).toEqual(['ev-1', 'ev-2']);
    });

    it('matches exact boundary condition: fromMd < md <= toMd', () => {
      // Event exactly at 1200:
      // If fromMd = 1200, it was already crossed, should NOT be reported
      expect(findPassedEvents(sampleEvents, 'L1', 1200, 1300)).toHaveLength(0);
      // If toMd = 1200, it IS crossed on this step
      const atExact = findPassedEvents(sampleEvents, 'L1', 1199, 1200);
      expect(atExact).toHaveLength(1);
      expect(atExact[0]!.id).toBe('ev-1');
    });

    it('ignores events belonging to inactive lateral wells', () => {
      // L1 is drilling through 1900 to 2100 -> ev-l2 is on L2 at md 2000
      const passedL1 = findPassedEvents(sampleEvents, 'L1', 1900, 2100);
      expect(passedL1).toHaveLength(0);

      // But when L2 is active, ev-l2 is detected
      const passedL2 = findPassedEvents(sampleEvents, 'L2', 1900, 2100);
      expect(passedL2).toHaveLength(1);
      expect(passedL2[0]!.id).toBe('ev-l2');
    });

    it('returns empty when stationary or paused (toMd <= fromMd)', () => {
      expect(findPassedEvents(sampleEvents, 'L1', 2000, 2000)).toHaveLength(0);
      expect(findPassedEvents(sampleEvents, 'L1', 2000, 1900)).toHaveLength(0);
    });
  });

  describe('detectCrossings (interleaved with survey stations)', () => {
    it('interleaves survey stations and event crossings in ascending MD order', () => {
      // Depth advance from 1050 to 1350:
      // - Survey station at 1200
      // - Event ev-1 (casing) at 1200
      const crossings = detectCrossings(stations, sampleEvents, 'L1', 1050, 1350, 'ft');

      expect(crossings).toHaveLength(2);
      expect(crossings.some((c) => c.kind === 'survey')).toBe(true);
      expect(crossings.some((c) => c.kind === 'event')).toBe(true);

      const eventItem = crossings.find((c) => c.kind === 'event')!;
      expect(eventItem.text).toMatch(/casing shoe/i);
      expect(eventItem.text).toMatch(/1,200\.0 ft MD/i);
    });

    it('formats event text with units and remarks', () => {
      const textFt = formatEventFeedText(sampleEvents[1]!, 'ft');
      expect(textFt).toBe('Event: Gas Show (L1) at 2,450.0 ft MD — 150 units gas show');

      const textM = formatEventFeedText(sampleEvents[1]!, 'm');
      expect(textM).toContain('m MD');
    });

    it('does not produce duplicate notifications on repeated frames when stationary', () => {
      // Frame 1: bit arrives at 2500
      const frame1 = detectCrossings(stations, sampleEvents, 'L1', 2400, 2500, 'ft');
      expect(frame1.some((c) => c.kind === 'event')).toBe(true); // passed gas show at 2450

      // Frame 2: bit is paused or stationary at 2500
      const frame2 = detectCrossings(stations, sampleEvents, 'L1', 2500, 2500, 'ft');
      expect(frame2).toHaveLength(0);

      // Frame 3: next frame advances from 2500 to 2510
      const frame3 = detectCrossings(stations, sampleEvents, 'L1', 2500, 2510, 'ft');
      expect(frame3).toHaveLength(0);
    });
  });
});
