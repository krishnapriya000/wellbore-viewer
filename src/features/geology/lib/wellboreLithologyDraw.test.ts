import { describe, expect, it, vi } from 'vitest';
import type { SurveyPoint } from '@/features/survey';
import type { Formation } from '../model/types';
import { drawWellboreLithology, type WellboreLithologyDrawOptions } from './wellboreLithologyDraw';

const MOCK_FORMATIONS: Formation[] = [
  {
    id: 'f0',
    name: 'Quaternary fill',
    ref: 'TVD',
    well: 'All',
    from: 0,
    to: 1200,
    comp: [{ lith: 'conglomerate', pct: 100 }],
  },
  {
    id: 'f1',
    name: 'Reservoir A',
    ref: 'TVD',
    well: 'All',
    from: 5850,
    to: 5970,
    comp: [{ lith: 'sandstone', pct: 100 }],
  },
  {
    id: 'f2',
    name: 'Calcite streak',
    ref: 'MD',
    well: 'L1',
    from: 10400,
    to: 10520,
    comp: [{ lith: 'limestone', pct: 100 }],
  },
];

const MOCK_PLAN: SurveyPoint[] = [
  { md: 0, inc: 0, azi: 45, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
  { md: 4000, inc: 0, azi: 45, tvd: 4000, n: 0, e: 0, dls: 0, beta: 0 },
  { md: 7000, inc: 90, azi: 45, tvd: 5900, n: 1500, e: 1500, dls: 3, beta: 0.1 },
  { md: 15000, inc: 90, azi: 45, tvd: 5900, n: 7000, e: 7000, dls: 0, beta: 0 },
];

const MOCK_ACTUAL: SurveyPoint[] = [
  { md: 0, inc: 0.35, azi: 130, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
  { md: 4000, inc: 0.28, azi: 172, tvd: 3999, n: -20, e: 5, dls: 0.1, beta: 0 },
  { md: 7000, inc: 88, azi: 45, tvd: 5920, n: 1480, e: 1490, dls: 2.8, beta: 0.1 },
  { md: 15000, inc: 90, azi: 48, tvd: 5910, n: 6980, e: 7020, dls: 0.2, beta: 0 },
];

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    createPattern: vi.fn().mockReturnValue({} as CanvasPattern),
  } as unknown as CanvasRenderingContext2D;
}

describe('drawWellboreLithology', () => {
  it('executes canvas drawing commands for PLAN and ACTUAL bands with live bit needle', () => {
    const ctx = createMockContext();

    const options: WellboreLithologyDrawOptions = {
      width: 400,
      height: 150,
      dpr: 1,
      wellName: 'L1',
      planPoints: MOCK_PLAN,
      actualPoints: MOCK_ACTUAL,
      currentMd: 6500,
      formations: MOCK_FORMATIONS,
      unit: 'ft',
      theme: 'light',
    };

    drawWellboreLithology(ctx, options);

    // Checks basic render execution
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 400, 150);
    expect(ctx.fillText).toHaveBeenCalledWith('PLAN', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('ACTUAL', expect.any(Number), expect.any(Number));
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.strokeRect).toHaveBeenCalledTimes(2); // Two band borders
    expect(ctx.fill).toHaveBeenCalled(); // Bit needle triangle
  });

  it('handles empty wellbores and zero MD gracefully without throwing', () => {
    const ctx = createMockContext();

    const options: WellboreLithologyDrawOptions = {
      width: 300,
      height: 150,
      dpr: 1,
      wellName: 'L1',
      planPoints: [],
      actualPoints: [],
      currentMd: 0,
      formations: [],
      unit: 'ft',
      theme: 'dark',
    };

    expect(() => drawWellboreLithology(ctx, options)).not.toThrow();
    expect(ctx.fillText).toHaveBeenCalledWith('PLAN', expect.any(Number), expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('ACTUAL', expect.any(Number), expect.any(Number));
  });

  it('correctly adapts tick marks and labels for metric unit (m)', () => {
    const ctx = createMockContext();

    const options: WellboreLithologyDrawOptions = {
      width: 450,
      height: 150,
      dpr: 1,
      wellName: 'L1',
      planPoints: MOCK_PLAN,
      actualPoints: MOCK_ACTUAL,
      currentMd: 7200,
      formations: MOCK_FORMATIONS,
      unit: 'm',
      theme: 'light',
    };

    drawWellboreLithology(ctx, options);

    expect(ctx.fillText).toHaveBeenCalledWith('MD m', 6, expect.any(Number));
    expect(ctx.fillText).toHaveBeenCalledWith('TVD m', 6, expect.any(Number));
  });

  it('progressively extends the ACTUAL band clip and needle at 10%, 30%, 50%, 80%, and 100% drilling checkpoints', () => {
    const td = 15000;
    const checkpoints = [
      { pct: 0.1, md: td * 0.1 },
      { pct: 0.3, md: td * 0.3 },
      { pct: 0.5, md: td * 0.5 },
      { pct: 0.8, md: td * 0.8 },
      { pct: 1.0, md: td },
    ];

    let prevClipWidth = 0;

    for (const cp of checkpoints) {
      const ctx = createMockContext();
      drawWellboreLithology(ctx, {
        width: 400,
        height: 150,
        dpr: 1,
        wellName: 'L1',
        planPoints: MOCK_PLAN,
        actualPoints: MOCK_ACTUAL,
        currentMd: cp.md,
        formations: MOCK_FORMATIONS,
        unit: 'ft',
        theme: 'light',
      });

      // Verification: ctx.clip is invoked to strictly bound actual band
      expect(ctx.clip).toHaveBeenCalled();

      // Find the clip rect call: ctx.rect(left, top2, width, bh)
      const rectCalls = (ctx.rect as ReturnType<typeof vi.fn>).mock.calls;
      const clipRect = rectCalls.find(
        (args: number[]) => args[0] === 52 && args[1] === 54 && args[3] === 30,
      );
      expect(clipRect).toBeDefined();

      const clipWidth = clipRect![2];
      // Every subsequent checkpoint must extend further to the right
      expect(clipWidth).toBeGreaterThan(prevClipWidth);
      prevClipWidth = clipWidth;

      // Needle must be drawn
      expect(ctx.fill).toHaveBeenCalled();
    }
  });
});
