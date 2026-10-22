import { describe, expect, it, vi } from 'vitest';
import { EVENT_TYPES, type EventType } from '../model/types';
import {
  CATEGORY_COLORS,
  drawEventIcon,
  getEventCategoryFromType,
  getEventColors,
} from './eventIcons';

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    rect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 10 }),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
  } as unknown as CanvasRenderingContext2D;
}

describe('eventIcons', () => {
  const all21Types = Object.values(EVENT_TYPES).flat() as EventType[];

  it('contains exactly 21 defined event types across 4 categories', () => {
    expect(all21Types).toHaveLength(21);
    expect(EVENT_TYPES.Shows).toHaveLength(6);
    expect(EVENT_TYPES.Hazards).toHaveLength(6);
    expect(EVENT_TYPES.Geology).toHaveLength(2);
    expect(EVENT_TYPES.Operations).toHaveLength(7);
  });

  describe('drawEventIcon for all 21 event types', () => {
    it.each(all21Types)('renders icon successfully for type: "%s"', (type) => {
      const ctx = createMockContext();
      const success = drawEventIcon(ctx, type, 16, 16, 32, { badge: true });

      expect(success).toBe(true);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.translate).toHaveBeenCalledWith(16, 16);
      expect(ctx.restore).toHaveBeenCalled();
      // Should have executed at least one fill or stroke command
      const hasDrawing =
        (ctx.fill as unknown as { mock: { calls: unknown[] } }).mock.calls.length > 0 ||
        (ctx.stroke as unknown as { mock: { calls: unknown[] } }).mock.calls.length > 0;
      expect(hasDrawing).toBe(true);
    });
  });

  describe('category and color mappings', () => {
    it('resolves correct categories for each event type', () => {
      expect(getEventCategoryFromType('oil_good')).toBe('Shows');
      expect(getEventCategoryFromType('water')).toBe('Shows');
      expect(getEventCategoryFromType('kick')).toBe('Hazards');
      expect(getEventCategoryFromType('stuck')).toBe('Hazards');
      expect(getEventCategoryFromType('fault')).toBe('Geology');
      expect(getEventCategoryFromType('fracture')).toBe('Geology');
      expect(getEventCategoryFromType('casing')).toBe('Operations');
      expect(getEventCategoryFromType('td')).toBe('Operations');
      expect(getEventCategoryFromType('unknown_type')).toBe('Operations');
    });

    it('returns theme colors matching category specifications', () => {
      const lostColor = getEventColors('lost');
      expect(lostColor.category).toBe('Hazards');
      expect(lostColor.border).toBe(CATEGORY_COLORS.Hazards.border);

      const fluorColor = getEventColors('fluor');
      expect(fluorColor.category).toBe('Shows');
      expect(fluorColor.fg).toBe('#2ecc71');
    });
  });

  describe('handling invalid inputs and fallbacks', () => {
    it('gracefully renders fallback symbol for unknown event types', () => {
      const ctx = createMockContext();
      const success = drawEventIcon(ctx, 'non_existent_event', 20, 20, 40);

      expect(success).toBe(true);
      expect(ctx.fillText).toHaveBeenCalledWith('?', 0, 0);
    });

    it('returns false and skips drawing when size <= 0', () => {
      const ctx = createMockContext();
      expect(drawEventIcon(ctx, 'casing', 10, 10, 0)).toBe(false);
      expect(drawEventIcon(ctx, 'casing', 10, 10, -5)).toBe(false);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('returns false when context is missing or coordinates are non-finite', () => {
      const ctx = createMockContext();
      expect(drawEventIcon(null as unknown as CanvasRenderingContext2D, 'casing', 10, 10, 32)).toBe(
        false,
      );
      expect(drawEventIcon(ctx, 'casing', NaN, 10, 32)).toBe(false);
      expect(drawEventIcon(ctx, 'casing', 10, Infinity, 32)).toBe(false);
      expect(drawEventIcon(ctx, 'casing', 10, 10, NaN)).toBe(false);
    });

    it('supports custom color overrides and disabling badge background', () => {
      const ctx = createMockContext();
      const success = drawEventIcon(ctx, 'oil_good', 16, 16, 32, {
        badge: false,
        color: '#ff00ff',
      });

      expect(success).toBe(true);
      expect(ctx.save).toHaveBeenCalled();
    });
  });
});
