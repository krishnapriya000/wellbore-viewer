import { describe, expect, it } from 'vitest';
import { computeSurvey, type Well } from '@/features/survey';
import { cssToken, SCALE, toScene, wellBounds } from './scene';

describe('scene mapping', () => {
  it('maps north → −z, east → +x, depth → −y at 1 unit per 100 ft', () => {
    const v = toScene({ n: 100, e: 200, tvd: 300 });
    expect([v.x, v.y, v.z]).toEqual([200 * SCALE, -300 * SCALE, -100 * SCALE]);
  });

  it('bounds cover surface and every plan and actual point', () => {
    const plan = computeSurvey([
      { md: 0, inc: 0, azi: 0 },
      { md: 1000, inc: 0, azi: 0 },
    ]);
    const well: Well = { name: 'A', slot: 0, plan, actual: [], junction: 0, version: 1 };
    const b = wellBounds([well]);
    expect(b.min.y).toBeCloseTo(-10);
    expect(b.max.y).toBe(0);
  });

  it('reads CSS tokens with a fallback', () => {
    document.documentElement.style.setProperty('--probe', '#123456');
    expect(cssToken('--probe')).toBe('#123456');
    expect(cssToken('--missing', '#abcdef')).toBe('#abcdef');
  });
});
