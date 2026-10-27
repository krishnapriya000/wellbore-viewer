import { describe, expect, it, vi } from 'vitest';
import { drawStripLog, type StripLogDrawOptions } from './stripLogDraw';
import type { StripLogInterval } from './stripLogLayout';

const MOCK_INTERVALS: StripLogInterval[] = [
  {
    id: 'fm-1',
    name: 'Overburden',
    ref: 'TVD',
    well: 'All',
    fromFt: 0,
    toFt: 1500,
    thicknessFt: 1500,
    color: { hex: '#707b7c', r: 0.44, g: 0.48, b: 0.49 },
    comp: [
      { lith: 'shale', pct: 70 },
      { lith: 'sandstone', pct: 30 },
    ],
    compSummary: 'shale 70%, sandstone 30%',
    isOverride: false,
  },
  {
    id: 'fm-5',
    name: 'Sand Stringer',
    ref: 'MD',
    well: 'L1',
    fromFt: 4100,
    toFt: 4300,
    thicknessFt: 200,
    color: { hex: '#f4d03f', r: 0.96, g: 0.82, b: 0.25 },
    comp: [{ lith: 'sandstone', pct: 100 }],
    compSummary: 'sandstone 100%',
    isOverride: true,
  },
];

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    closePath: vi.fn(),
    setLineDash: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 50 }),
  } as unknown as CanvasRenderingContext2D;
}

describe('drawStripLog', () => {
  it('executes canvas drawing commands cleanly without errors', () => {
    const ctx = createMockContext();

    const options: StripLogDrawOptions = {
      width: 400,
      height: 300,
      dpr: 1,
      intervals: MOCK_INTERVALS,
      ticks: [
        { depthFt: 0, depthDisplay: 0, label: '0' },
        { depthFt: 1000, depthDisplay: 1000, label: '1,000' },
        { depthFt: 4500, depthDisplay: 4500, label: '4,500' },
      ],
      minDepthFt: 0,
      maxDepthFt: 4500,
      unit: 'ft',
      theme: 'dark',
      modeTitle: 'TVD Stratigraphy',
    };

    drawStripLog(ctx, options);

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining('Overburden'),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('handles empty intervals without errors and displays empty notice', () => {
    const ctx = createMockContext();

    const options: StripLogDrawOptions = {
      width: 400,
      height: 300,
      dpr: 1,
      intervals: [],
      ticks: [],
      minDepthFt: 0,
      maxDepthFt: 5000,
      unit: 'ft',
      theme: 'light',
      modeTitle: 'TVD Stratigraphy',
    };

    drawStripLog(ctx, options);

    expect(ctx.fillText).toHaveBeenCalledWith(
      expect.stringContaining('No formations defined'),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('draws all 12 USGS lithology hatch patterns without errors', () => {
    const allLithologies = [
      'sandstone',
      'shale',
      'limestone',
      'dolomite',
      'siltstone',
      'coal',
      'anhydrite',
      'salt',
      'conglomerate',
      'marl',
      'chert',
      'basement',
    ] as const;

    const intervals: StripLogInterval[] = allLithologies.map((lith, idx) => ({
      id: `fm-${idx}`,
      name: `Layer ${lith}`,
      ref: 'TVD',
      well: 'All',
      fromFt: idx * 500,
      toFt: (idx + 1) * 500,
      thicknessFt: 500,
      color: { hex: '#888888', r: 0.5, g: 0.5, b: 0.5 },
      comp: [{ lith, pct: 100 }],
      compSummary: `${lith} 100%`,
      isOverride: false,
    }));

    const ctx = createMockContext();
    const options: StripLogDrawOptions = {
      width: 500,
      height: 600,
      dpr: 1,
      intervals,
      ticks: [{ depthFt: 0, depthDisplay: 0, label: '0' }],
      minDepthFt: 0,
      maxDepthFt: 6000,
      unit: 'ft',
      theme: 'dark',
      modeTitle: 'All 12 Lithologies',
    };

    expect(() => drawStripLog(ctx, options)).not.toThrow();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
