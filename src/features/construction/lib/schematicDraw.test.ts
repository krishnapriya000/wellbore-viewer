import { describe, expect, it, vi } from 'vitest';
import type { ConstructionItem } from '../model/types';
import {
  computeHalfWidthPx,
  computeSchematicTicks,
  drawSchematic,
  layoutCallouts,
  type SchematicCallout,
  type SchematicDrawOptions,
} from './schematicDraw';

describe('schematicDraw', () => {
  describe('computeSchematicTicks', () => {
    it('computes clean depth ticks in feet', () => {
      const ticks = computeSchematicTicks(0, 5000, 'ft');
      expect(ticks.length).toBeGreaterThanOrEqual(5);
      expect(ticks[0]!.depthDisplay).toBe(0);
      expect(ticks[0]!.label).toBe('0');
      expect(ticks.some((t) => t.isMajor)).toBe(true);
    });

    it('computes clean depth ticks in meters with metric intervals', () => {
      const ticks = computeSchematicTicks(0, 3000, 'm');
      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks[0]!.depthDisplay).toBe(0);
      // Depths in meters
      expect(ticks.every((t) => typeof t.depthDisplay === 'number')).toBe(true);
    });
  });

  describe('computeHalfWidthPx', () => {
    it('maintains strict monotonic scaling for engineering diameters', () => {
      const w7 = computeHalfWidthPx(7);
      const w9 = computeHalfWidthPx(9.625);
      const w13 = computeHalfWidthPx(13.375);
      const w17 = computeHalfWidthPx(17.5);
      const w30 = computeHalfWidthPx(30);

      expect(w7).toBeLessThan(w9);
      expect(w9).toBeLessThan(w13);
      expect(w13).toBeLessThan(w17);
      expect(w17).toBeLessThan(w30);
    });

    it('clamps extreme sizes gracefully', () => {
      const wNeg = computeHalfWidthPx(-10);
      const wMin = computeHalfWidthPx(1);
      expect(wNeg).toBe(wMin);

      const wHuge = computeHalfWidthPx(100);
      const wMax = computeHalfWidthPx(48);
      expect(wHuge).toBe(wMax);
    });
  });

  describe('layoutCallouts', () => {
    it('returns empty array when callouts array is empty', () => {
      expect(layoutCallouts([], 0, 500)).toEqual([]);
    });

    it('prevents vertical overlaps by enforcing minSpacing', () => {
      const callouts: SchematicCallout[] = [
        {
          id: '1',
          itemId: '1',
          kind: 'casing',
          sizeInches: 13.375,
          fromFt: 0,
          toFt: 1200,
          targetY: 100,
          adjustedY: 100,
          featureX: 120,
          title: 'Csg 1',
          subtitle: '1200 ft',
          hasWarnings: false,
          warnings: [],
        },
        {
          id: '2',
          itemId: '2',
          kind: 'casing',
          sizeInches: 9.625,
          fromFt: 0,
          toFt: 1250, // Very close to csg 1
          targetY: 105,
          adjustedY: 105,
          featureX: 115,
          title: 'Csg 2',
          subtitle: '1250 ft',
          hasWarnings: false,
          warnings: [],
        },
      ];

      const spaced = layoutCallouts(callouts, 0, 500, 30);
      expect(spaced[1]!.adjustedY - spaced[0]!.adjustedY).toBeGreaterThanOrEqual(30);
    });
  });

  describe('drawSchematic', () => {
    const createMockCtx = () => {
      return {
        save: vi.fn(),
        restore: vi.fn(),
        scale: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        closePath: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 60 }),
        setLineDash: vi.fn(),
        arc: vi.fn(),
      } as unknown as CanvasRenderingContext2D;
    };

    it('draws empty state message when no items exist for well', () => {
      const ctx = createMockCtx();
      const options: SchematicDrawOptions = {
        width: 320,
        height: 400,
        dpr: 1,
        items: [],
        wellName: 'L1',
        unit: 'ft',
        theme: 'dark',
      };

      drawSchematic(ctx, options);
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 400);
      expect(ctx.fillText).toHaveBeenCalledWith(
        'No construction items defined for this well',
        160,
        190,
      );
    });

    it('draws complete schematic with hole, casing, cement, and callouts', () => {
      const ctx = createMockCtx();
      const sampleItems: ConstructionItem[] = [
        {
          id: 'h1',
          kind: 'hole',
          size: 17.5,
          from: 0,
          to: 1200,
          well: 'All',
          note: '',
        },
        {
          id: 'c1',
          kind: 'casing',
          size: 13.375,
          from: 0,
          to: 1200,
          well: 'All',
          note: '',
        },
        {
          id: 'cmt1',
          kind: 'cement',
          size: 13.375,
          from: 0,
          to: 1200,
          well: 'All',
          note: '',
        },
      ];

      const options: SchematicDrawOptions = {
        width: 340,
        height: 420,
        dpr: 1,
        items: sampleItems,
        wellName: 'L1',
        unit: 'ft',
        theme: 'dark',
      };

      drawSchematic(ctx, options);
      // Background filled
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 340, 420);
      // Centerline set
      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
      // Labels rendered
      expect(ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('Casing Shoe'), expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('Hole Section'), expect.any(Number), expect.any(Number));
    });
  });
});
