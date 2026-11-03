import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { useThrottledStore } from '@/shared/lib/useThrottledStore';
import { useSettings } from '@/shared/settings/settingsStore';
import { drawWellboreLithology } from '../lib/wellboreLithologyDraw';
import { useGeologyStore } from '../model/geologyStore';

function cssToken(name: string, fallback = '#888888'): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export interface WellboreLithologyProps {
  activeWell?: string | null;
  currentMd?: number;
}

/**
 * Lithology along the wellbore component:
 * Displays dual-band horizontal strip log (Plan vs Actual drilled) with live bit indicator
 * and depth scale (MD & TVD).
 *
 * Matches the reference HTML block:
 * <h2>Lithology along the wellbore</h2>
 */
export function WellboreLithology({ activeWell, currentMd: propMd }: WellboreLithologyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();

  const formations = useGeologyStore((s) => s.formations);
  const version = useGeologyStore((s) => s.version);
  const unit = useSettings((s) => s.unit);
  const theme = useSettings((s) => s.theme);
  const order = useSurveyStore((s) => s.order);
  const wells = useSurveyStore((s) => s.wells);

  const [selectedWellState, setSelectedWellState] = useState<string | null>(null);
  const [prevActiveWell, setPrevActiveWell] = useState(activeWell);

  // Reset internal selection override when parent activeWell prop changes
  if (activeWell !== prevActiveWell) {
    setPrevActiveWell(activeWell);
    setSelectedWellState(null);
  }

  const selectedWell =
    (selectedWellState && order.includes(selectedWellState) ? selectedWellState : null) ??
    (activeWell && order.includes(activeWell) ? activeWell : null) ??
    order[0] ??
    'L1';

  const handleSelectWell = (name: string) => {
    setSelectedWellState(name);
    useDrilling.getState().setActiveWell(name);
  };

  // Throttled subscription to the drilling bit MD (50ms interval ~ 20 FPS).
  // This causes React state updates during live drilling, guaranteeing progressive
  // extension and repainting of the ACTUAL band without waiting for TD/completion.
  const storeMd = useThrottledStore(
    useDrilling,
    (s) => (s.activeWell === selectedWell ? s.md : (s.wellProgress[selectedWell] ?? 0)),
    50,
  );
  const currentMd = propMd !== undefined ? propMd : storeMd;

  // System or explicit theme resolution
  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return theme;
  }, [theme]);

  // Keep rendering canvas in sync with store state and live bit depth
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(260, Math.floor(rect.width || container.clientWidth || 300));
      const cssH = 150;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const targetWell = wells[selectedWell];
      const planPoints = targetWell?.plan ?? [];
      const actualPoints = targetWell?.actual ?? [];
      const effectiveActual = actualPoints.length >= 2 ? actualPoints : planPoints;

      // Determine bit MD to draw: use latest store value or currentMd
      const drillingState = useDrilling.getState();
      const isDrillingThisWell = drillingState.activeWell === selectedWell;
      const mdToDraw = isDrillingThisWell
        ? Math.max(currentMd, drillingState.md)
        : currentMd;

      // Read design tokens with graceful fallbacks
      const isDark = effectiveTheme === 'dark';
      const colors = {
        ink: cssToken('--ink', isDark ? '#e0e8e5' : '#172220'),
        muted: cssToken('--muted', isDark ? '#90a09b' : '#586662'),
        line: cssToken('--line', isDark ? '#2b3735' : '#c9d2cf'),
        actual: cssToken('--actual', isDark ? '#7fa6ff' : '#1f4fd1'),
        surface: cssToken('--surface', isDark ? '#162020' : '#f7f9f8'),
        surface2: cssToken('--surface-2', isDark ? '#1c2827' : '#eef2f0'),
      };

      drawWellboreLithology(ctx, {
        width: cssW,
        height: cssH,
        dpr,
        wellName: selectedWell,
        planPoints,
        actualPoints: effectiveActual,
        currentMd: mdToDraw,
        formations,
        unit,
        theme: effectiveTheme,
        colors,
      });
    };

    render();

    // ResizeObserver for responsive width changes
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(render);
          })
        : null;

    if (ro) ro.observe(container);

    // Fast-path frame subscription: if store updates between React 50ms ticks,
    // requestAnimationFrame paints it smoothly without waiting.
    const unsubDrilling = useDrilling.subscribe(
      (s) => (s.activeWell === selectedWell ? s.md : (s.wellProgress[selectedWell] ?? 0)),
      () => {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(render);
      },
    );

    return () => {
      if (ro) ro.disconnect();
      unsubDrilling();
      cancelAnimationFrame(animId);
    };
  }, [selectedWell, currentMd, wells, formations, version, unit, effectiveTheme]);

  return (
    <section className="block" aria-labelledby={titleId}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 id={titleId} style={{ margin: 0 }}>
          Lithology along the wellbore
        </h2>
        {order.length > 1 && (
          <div className="seg" role="group" aria-label="Select lateral for lithology strip">
            {order.map((name) => (
              <button
                key={name}
                type="button"
                aria-pressed={selectedWell === name}
                onClick={() => handleSelectWell(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="strip-wrap"
        style={{
          width: '100%',
          height: '150px',
          minHeight: '150px',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          id="strip"
          role="img"
          aria-label={`Lithology strip log against measured depth - ${selectedWell}`}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>

      <p className="hint-text">
        Top band follows the plan, bottom band what the bit has drilled. Scale is MD; TVD at each tick is shown beneath.
      </p>
    </section>
  );
}
