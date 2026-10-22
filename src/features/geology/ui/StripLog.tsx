import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { Segmented } from '@/shared/ui/Segmented';
import { drawStripLog } from '../lib/stripLogDraw';
import {
  computeMdIntervals,
  computeStripLogTicks,
  computeTvdIntervals,
  getIntervalsDepthRange,
} from '../lib/stripLogLayout';
import { useGeologyStore } from '../model/geologyStore';

export function StripLog({ activeWell }: { activeWell?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();

  const formations = useGeologyStore((s) => s.formations);
  const version = useGeologyStore((s) => s.version);
  const unit = useSettings((s) => s.unit);
  const theme = useSettings((s) => s.theme);
  const order = useSurveyStore((s) => s.order);
  const wells = useSurveyStore((s) => s.wells);

  const [refMode, setRefMode] = useState<'TVD' | 'MD'>('TVD');
  const [userSelectedWell, setUserSelectedWell] = useState<string | null>(null);

  const selectedWell =
    userSelectedWell && order.includes(userSelectedWell)
      ? userSelectedWell
      : activeWell && order.includes(activeWell)
        ? activeWell
        : order[0] ?? 'L1';

  // Resolve system theme to light or dark
  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return theme;
  }, [theme]);

  // Compute intervals based on selected depth reference
  const intervals = useMemo(() => {
    if (refMode === 'TVD') {
      return computeTvdIntervals(formations);
    }
    const targetWell = wells[selectedWell];
    const points = targetWell
      ? targetWell.actual.length >= 2
        ? targetWell.actual
        : targetWell.plan
      : [];
    return computeMdIntervals(formations, selectedWell, points);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for formations
  }, [refMode, selectedWell, formations, version, wells]);

  const { minDepthFt, maxDepthFt } = useMemo(
    () => getIntervalsDepthRange(intervals),
    [intervals],
  );

  const ticks = useMemo(
    () => computeStripLogTicks(minDepthFt, maxDepthFt, unit),
    [minDepthFt, maxDepthFt, unit],
  );

  const modeTitle =
    refMode === 'TVD'
      ? 'TVD Stratigraphy (Field)'
      : `Wellbore ${selectedWell} Measured Depth (MD)`;

  // Redraw canvas on data, resize, unit, or theme changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(260, Math.floor(rect.width));
      const cssH = 360; // Standard comfortable vertical log height
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      // Adjust buffer size only when dimensions change
      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawStripLog(ctx, {
        width: cssW,
        height: cssH,
        dpr,
        intervals,
        ticks,
        minDepthFt,
        maxDepthFt,
        unit,
        theme: effectiveTheme,
        modeTitle,
      });
    };

    render();

    // Observe container resizing for responsive layout
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(render);
          })
        : null;

    if (ro) ro.observe(container);

    return () => {
      if (ro) ro.disconnect();
      cancelAnimationFrame(animId);
    };
  }, [intervals, ticks, minDepthFt, maxDepthFt, unit, effectiveTheme, modeTitle]);

  return (
    <section className="block" aria-labelledby={titleId}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 id={titleId} style={{ margin: 0 }}>
          Geological Strip Log
        </h2>
        <Segmented<'TVD' | 'MD'>
          label="Depth reference"
          value={refMode}
          onChange={setRefMode}
          options={[
            { value: 'TVD', label: 'TVD' },
            { value: 'MD', label: 'MD' },
          ]}
        />
      </div>

      {refMode === 'MD' && order.length > 1 && (
        <div className="row" style={{ alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--muted)' }}>Lateral:</span>
          <div className="seg" role="group" aria-label="Select lateral for MD strip log">
            {order.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={selectedWell === name}
                onClick={() => setUserSelectedWell(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <span className="pill idle" style={{ fontSize: '0.72rem' }}>
            MD Reference
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className="strip-log-container"
        style={{
          width: '100%',
          minHeight: '360px',
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--line)',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Geological Strip Log - ${modeTitle}`}
          style={{ display: 'block' }}
        />
      </div>
    </section>
  );
}
