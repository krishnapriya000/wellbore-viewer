import { describe, expect, it } from 'vitest';
import { LITHOLOGIES } from '../model/types';
import {
  blendLithologyColor,
  DEFAULT_LITHOLOGY_COLOR,
  dominantLithology,
  formatCompSummary,
  LITHOLOGY_COLORS,
} from './lithologyColors';

describe('lithologyColors', () => {
  it('defines valid color mappings for all 12 supported lithologies', () => {
    for (const lith of LITHOLOGIES) {
      const color = LITHOLOGY_COLORS[lith];
      expect(color).toBeDefined();
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(1);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(1);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(1);
    }
  });

  it('blends single component with 100% to its exact base color', () => {
    const single = blendLithologyColor([{ lith: 'sandstone', pct: 100 }]);
    expect(single.hex.toLowerCase()).toBe(LITHOLOGY_COLORS.sandstone.hex.toLowerCase());
  });

  it('blends multiple components proportionally to their percentages', () => {
    const blended = blendLithologyColor([
      { lith: 'shale', pct: 70 },
      { lith: 'sandstone', pct: 30 },
    ]);
    expect(blended.hex).toMatch(/^#[0-9a-f]{6}$/i);

    // Blended RGB should sit between pure shale and pure sandstone
    const shale = LITHOLOGY_COLORS.shale;
    const sand = LITHOLOGY_COLORS.sandstone;
    const expectedR = 0.7 * shale.r + 0.3 * sand.r;
    expect(Math.abs(blended.r - expectedR)).toBeLessThan(0.02);
  });

  it('handles empty or zero-percentage inputs gracefully', () => {
    expect(blendLithologyColor([])).toEqual(DEFAULT_LITHOLOGY_COLOR);
    expect(blendLithologyColor([{ lith: 'shale', pct: 0 }])).toEqual(DEFAULT_LITHOLOGY_COLOR);
  });

  it('identifies dominant lithology correctly', () => {
    expect(
      dominantLithology([
        { lith: 'shale', pct: 70 },
        { lith: 'sandstone', pct: 30 },
      ]),
    ).toBe('shale');

    expect(
      dominantLithology([
        { lith: 'limestone', pct: 40 },
        { lith: 'dolomite', pct: 60 },
      ]),
    ).toBe('dolomite');

    expect(dominantLithology([])).toBe('shale');
  });

  it('formats composition summaries properly', () => {
    expect(
      formatCompSummary({
        comp: [
          { lith: 'sandstone', pct: 85 },
          { lith: 'siltstone', pct: 15 },
        ],
      }),
    ).toBe('sandstone 85%, siltstone 15%');
  });
});
