import { describe, expect, it } from 'vitest';
import { computeSurvey } from '@/features/survey';
import { deviationFromPlan } from './deviation';
import { advance, passedBetween } from './engine';

describe('drilling clock', () => {
  const base = { md: 0, playing: true, speedFtPerS: 250 };

  it('advances by speed × dt and stops at TD', () => {
    expect(advance(base, 0.04, 1000).md).toBeCloseTo(10);
    const end = advance({ ...base, md: 995 }, 0.04, 1000);
    expect(end).toMatchObject({ md: 1000, playing: false });
  });

  it('does nothing when paused and caps a long frame at 0.1 s', () => {
    expect(advance({ ...base, playing: false }, 1, 1000).md).toBe(0);
    expect(advance(base, 5, 1000).md).toBeCloseTo(25);
  });

  it('reports items passed in the half-open interval (from, to]', () => {
    expect(passedBetween([100, 200, 300], (x) => x, 100, 300)).toEqual([200, 300]);
  });
});

describe('deviation from plan', () => {
  const plan = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1000, inc: 0, azi: 0 },
  ]);

  it('is zero on plan', () => {
    expect(deviationFromPlan(plan[1]!, plan)!.ctc).toBeCloseTo(0);
  });

  it('separates below/above and right/left', () => {
    const tip = { ...plan[1]!, tvd: 1010, e: 20 }; // 10 ft low, 20 ft east (= right when heading north)
    const d = deviationFromPlan(tip, plan)!;
    expect(d.below).toBeCloseTo(10);
    expect(d.right).toBeCloseTo(20);
    expect(d.ctc).toBeCloseTo(Math.hypot(10, 20));
  });
});
