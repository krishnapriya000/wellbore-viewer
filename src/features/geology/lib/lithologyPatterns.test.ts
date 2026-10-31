import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LITHOLOGIES } from '../model/types';
import {
  clearLithologyTileCache,
  drawLithologySwatch,
  drawLithologyTile,
  getLithologyTileCanvas,
} from './lithologyPatterns';

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn(),
    fillRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createPattern: vi.fn(),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
  } as unknown as CanvasRenderingContext2D;
}

describe('lithologyPatterns', () => {
  beforeEach(() => {
    clearLithologyTileCache();
  });

  describe('drawLithologyTile for all 12 lithologies', () => {
    it.each(LITHOLOGIES)('draws pattern successfully for: "%s"', (lith) => {
      const ctx = createMockContext();
      drawLithologyTile(ctx, lith, 64);

      // Base fillRect should be called with tile dimensions
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 64, 64);

      // Should have performed path strokes or fills for the pattern symbols
      const totalCalls =
        (ctx.stroke as unknown as ReturnType<typeof vi.fn>).mock.calls.length +
        (ctx.fill as unknown as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(totalCalls).toBeGreaterThan(0);
    });

    it('uses light stroke on dark base for coal', () => {
      const ctx = createMockContext();
      drawLithologyTile(ctx, 'coal', 64);
      expect(ctx.strokeStyle).toContain('255, 255, 255');
    });

    it('respects custom baseColor override for background fill', () => {
      let fillStyleAtRect = '';
      const ctx = createMockContext();
      ctx.fillRect = vi.fn().mockImplementation(() => {
        fillStyleAtRect = String(ctx.fillStyle);
      });
      drawLithologyTile(ctx, 'sandstone', 64, '#ff0000');
      expect(fillStyleAtRect).toBe('#ff0000');
    });
  });

  describe('getLithologyTileCanvas and caching', () => {
    it('returns canvas and caches subsequent requests', () => {
      const canvas1 = getLithologyTileCanvas('sandstone', 64);
      const canvas2 = getLithologyTileCanvas('sandstone', 64);
      expect(canvas1).not.toBeNull();
      expect(canvas1).toBe(canvas2);
    });

    it('differentiates cache keys by pixel size and custom base color', () => {
      const c64 = getLithologyTileCanvas('limestone', 64);
      const c32 = getLithologyTileCanvas('limestone', 32);
      const cCustom = getLithologyTileCanvas('limestone', 64, '#abcdef');
      expect(c64).not.toBe(c32);
      expect(c64).not.toBe(cCustom);
    });
  });

  describe('drawLithologySwatch', () => {
    it('handles swatch drawing with fallback when pattern creation returns null', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 20;

      // jsdom getContext returns mock or null; verify function completes safely
      expect(() => drawLithologySwatch(canvas, 'dolomite', '#b9a3dc')).not.toThrow();
    });
  });
});
