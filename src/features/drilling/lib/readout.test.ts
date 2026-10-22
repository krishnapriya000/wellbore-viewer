import { describe, expect, it } from 'vitest';
import type { ConstructionItem } from '@/features/construction';
import type { DrillEvent } from '@/features/events';
import type { Formation } from '@/features/geology';
import type { Well } from '@/features/survey';
import {
  computeDrillingReadout,
  getBitTip,
  getDeviationAtBit,
  getFormationAtBit,
  getLatestEventAtBit,
  getRelevantCasingShoe,
} from './readout';

describe('drilling readout helpers', () => {
  const sampleWell: Well = {
    name: 'L1',
    slot: 0,
    junction: 0,
    version: 1,
    plan: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 2000, inc: 0, azi: 0, tvd: 2000, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 4000, inc: 30, azi: 90, tvd: 3800, n: 0, e: 1000, dls: 1.5, beta: 0 },
    ],
    actual: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 2000, inc: 1, azi: 45, tvd: 1999, n: 10, e: 10, dls: 0.05, beta: 0 },
      { md: 4000, inc: 32, azi: 92, tvd: 3790, n: 15, e: 1020, dls: 1.6, beta: 0 },
    ],
  };

  const sampleFormations: Formation[] = [
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
      to: 5000,
      comp: [{ lith: 'sandstone', pct: 100 }],
    },
    {
      id: 'fm-override',
      name: 'Fault Zone Lens',
      ref: 'MD',
      well: 'L1',
      from: 1800,
      to: 2200,
      comp: [{ lith: 'siltstone', pct: 100 }],
    },
  ];

  const sampleCasings: ConstructionItem[] = [
    {
      id: 'csg-1',
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 1200,
      size: 13.375,
      note: 'Surface casing',
    },
    {
      id: 'csg-2',
      kind: 'casing',
      well: 'All',
      from: 0,
      to: 3500,
      size: 9.625,
      note: 'Intermediate casing',
    },
    {
      id: 'hole-1',
      kind: 'hole',
      well: 'All',
      from: 3500,
      to: 5000,
      size: 8.5,
      note: 'Open hole section',
    },
  ];

  const sampleEvents: DrillEvent[] = [
    {
      id: 'ev-1',
      well: 'All',
      md: 1200,
      type: 'casing',
      note: 'Surface casing shoe set',
    },
    {
      id: 'ev-2',
      well: 'L1',
      md: 2500,
      type: 'gas',
      note: 'Gas show',
    },
    {
      id: 'ev-3',
      well: 'L1',
      md: 3800,
      type: 'oil_good',
      note: 'Good oil show in sand',
    },
    {
      id: 'ev-other',
      well: 'L2',
      md: 2000,
      type: 'tight',
      note: 'Tight hole on L2',
    },
  ];

  describe('getBitTip', () => {
    it('returns null when well is undefined or surveys are empty', () => {
      expect(getBitTip(undefined, 1000, 'actual')).toBeNull();
      expect(getBitTip({ ...sampleWell, actual: [] }, 1000, 'actual')).toBeNull();
      expect(getBitTip({ ...sampleWell, plan: [] }, 1000, 'plan')).toBeNull();
    });

    it('interpolates actual trajectory in actual mode', () => {
      const tip = getBitTip(sampleWell, 2000, 'actual');
      expect(tip).not.toBeNull();
      expect(tip?.md).toBe(2000);
      expect(tip?.tvd).toBe(1999);
      expect(tip?.n).toBe(10);
    });

    it('interpolates plan trajectory in plan mode', () => {
      const tip = getBitTip(sampleWell, 2000, 'plan');
      expect(tip).not.toBeNull();
      expect(tip?.md).toBe(2000);
      expect(tip?.tvd).toBe(2000);
      expect(tip?.n).toBe(0);
    });
  });

  describe('getFormationAtBit', () => {
    it('returns null when tip is null', () => {
      expect(getFormationAtBit(sampleFormations, 'L1', null)).toBeNull();
    });

    it('resolves TVD regional horizon', () => {
      const tip = { md: 1000, inc: 0, azi: 0, tvd: 1000, n: 0, e: 0, dls: 0, beta: 0 };
      const fm = getFormationAtBit(sampleFormations, 'L1', tip);
      expect(fm?.name).toBe('Overburden');
    });

    it('prioritizes well MD override over TVD horizon', () => {
      // At md=2000, TVD is 1999 which falls in 'Upper Shale', but MD 2000 matches 'Fault Zone Lens' for L1
      const tip = { md: 2000, inc: 0, azi: 0, tvd: 1999, n: 0, e: 0, dls: 0, beta: 0 };
      const fm = getFormationAtBit(sampleFormations, 'L1', tip);
      expect(fm?.name).toBe('Fault Zone Lens');

      // For well L2, the L1 override does not apply and TVD horizon 'Upper Shale' is returned
      const fmL2 = getFormationAtBit(sampleFormations, 'L2', tip);
      expect(fmL2?.name).toBe('Upper Shale');
    });

    it('returns null if bit depth is outside any formation interval', () => {
      const tip = { md: 6000, inc: 0, azi: 0, tvd: 6000, n: 0, e: 0, dls: 0, beta: 0 };
      expect(getFormationAtBit(sampleFormations, 'L1', tip)).toBeNull();
    });
  });

  describe('getRelevantCasingShoe', () => {
    it('returns null when there are no casing items', () => {
      expect(getRelevantCasingShoe([], 'L1', 1000)).toBeNull();
    });

    it('returns containing casing string when bit is inside casing', () => {
      // At md=800, bit is inside 13.375" casing (0 to 1200)
      const shoe = getRelevantCasingShoe(sampleCasings, 'L1', 800);
      expect(shoe).not.toBeNull();
      expect(shoe?.sizeInches).toBe(13.375);
      expect(shoe?.shoeMd).toBe(1200);
      expect(shoe?.isInside).toBe(true);
    });

    it('returns intermediate casing shoe when deeper inside intermediate string', () => {
      // At md=2500, inside 9.625" (0 to 3500)
      const shoe = getRelevantCasingShoe(sampleCasings, 'L1', 2500);
      expect(shoe?.sizeInches).toBe(9.625);
      expect(shoe?.shoeMd).toBe(3500);
      expect(shoe?.isInside).toBe(true);
    });

    it('returns last passed shoe when bit is in open hole below shoe', () => {
      // At md=4000, bit has passed 3500 ft shoe into open hole
      const shoe = getRelevantCasingShoe(sampleCasings, 'L1', 4000);
      expect(shoe?.sizeInches).toBe(9.625);
      expect(shoe?.shoeMd).toBe(3500);
      expect(shoe?.isInside).toBe(false);
    });
  });

  describe('getLatestEventAtBit', () => {
    it('returns null when no events have occurred yet or are for other wells', () => {
      expect(getLatestEventAtBit(sampleEvents, 'L1', 500)).toBeNull();
      expect(getLatestEventAtBit(sampleEvents, 'L3', 500)).toBeNull();
    });

    it('returns the most recent event encountered at or above current MD', () => {
      // At md=1500, only ev-1 (md=1200, casing) has been passed
      const ev1 = getLatestEventAtBit(sampleEvents, 'L1', 1500);
      expect(ev1?.event.id).toBe('ev-1');
      expect(ev1?.md).toBe(1200);
      expect(ev1?.label).toBe('Casing Shoe');

      // At md=3000, ev-2 (md=2500, gas) is latest
      const ev2 = getLatestEventAtBit(sampleEvents, 'L1', 3000);
      expect(ev2?.event.id).toBe('ev-2');
      expect(ev2?.md).toBe(2500);
      expect(ev2?.label).toBe('Gas Show');

      // At md=4000, ev-3 (md=3800, oil_good) is latest
      const ev3 = getLatestEventAtBit(sampleEvents, 'L1', 4000);
      expect(ev3?.event.id).toBe('ev-3');
      expect(ev3?.md).toBe(3800);
      expect(ev3?.label).toBe('Good Oil Show');
    });

    it('filters events specific to other wells', () => {
      // L2 has tight hole at md=2000, which should not appear on L1
      const evL1 = getLatestEventAtBit(sampleEvents, 'L1', 2200);
      expect(evL1?.event.id).toBe('ev-1'); // Surface casing at 1200

      const evL2 = getLatestEventAtBit(sampleEvents, 'L2', 2200);
      expect(evL2?.event.id).toBe('ev-other'); // Tight hole at 2000
    });
  });

  describe('getDeviationAtBit', () => {
    it('returns 0 deviation in plan mode', () => {
      const tip = sampleWell.actual[1]!;
      const dev = getDeviationAtBit(tip, sampleWell.plan, 'plan');
      expect(dev).toEqual({ below: 0, right: 0, ctc: 0 });
    });

    it('returns calculated deviation in actual mode', () => {
      const tip = sampleWell.actual[1]!; // tvd: 1999, n: 10, e: 10
      const dev = getDeviationAtBit(tip, sampleWell.plan, 'actual');
      expect(dev).not.toBeNull();
      expect(dev?.ctc).toBeGreaterThan(0);
    });
  });

  describe('computeDrillingReadout', () => {
    it('aggregates all readout elements correctly in actual mode', () => {
      const readout = computeDrillingReadout(
        sampleWell,
        2500,
        'actual',
        sampleFormations,
        sampleCasings,
        sampleEvents,
      );

      expect(readout.tip?.md).toBe(2500);
      expect(readout.formation?.name).toBe('Upper Shale');
      expect(readout.casingShoe?.sizeInches).toBe(9.625);
      expect(readout.casingShoe?.shoeMd).toBe(3500);
      expect(readout.latestEvent?.label).toBe('Gas Show');
      expect(readout.deviation).not.toBeNull();
    });

    it('synchronizes appropriately when switching to plan mode', () => {
      const readout = computeDrillingReadout(
        sampleWell,
        2500,
        'plan',
        sampleFormations,
        sampleCasings,
        sampleEvents,
      );

      expect(readout.tip?.md).toBe(2500);
      expect(readout.deviation).toEqual({ below: 0, right: 0, ctc: 0 });
    });
  });
});
