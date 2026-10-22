import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { checkItem, itemsFor } from '../lib/rules';
import { drawSchematic } from '../lib/schematicDraw';
import { useConstructionStore } from '../model/constructionStore';

interface SchematicProps {
  activeWell?: string | null;
}

/**
 * 2D Well Construction Schematic Component.
 *
 * Renders a standard vertical engineering schematic on an HTML5 canvas:
 * - Depth axis with ft/m preference and major/minor depth ticks.
 * - Symmetrically nested hole sections, casing strings with beveled shoes, and cement annular sheaths.
 * - Collision-avoidant callout labels displaying actual entered dimensions.
 * - Fit-check warning highlights and alerts when engineering rules are violated.
 * - High-DPI canvas scaling with responsive ResizeObserver lifecycle management.
 */
export function Schematic({ activeWell }: Readonly<SchematicProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();

  const items = useConstructionStore((s) => s.items);
  const version = useConstructionStore((s) => s.version);
  const unit = useSettings((s) => s.unit);
  const theme = useSettings((s) => s.theme);
  const order = useSurveyStore((s) => s.order);

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

  // Check if any applicable items have fit-check warnings
  const applicableItems = useMemo(
    () => itemsFor(items, selectedWell),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version tracks items mutations
    [items, selectedWell, version],
  );

  const fitWarnings = useMemo(() => {
    const list: string[] = [];
    for (const item of applicableItems) {
      const warns = checkItem(items, item, selectedWell);
      for (const w of warns) {
        list.push(`${item.size}" ${item.kind}: ${w}`);
      }
    }
    return list;
  }, [applicableItems, items, selectedWell]);

  // Redraw canvas on data, resize, unit, or theme changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animId = 0;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const cssW = Math.max(260, Math.floor(rect.width));
      const cssH = 420; // Standard comfortable vertical schematic height
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawSchematic(ctx, {
        width: cssW,
        height: cssH,
        dpr,
        items,
        wellName: selectedWell,
        unit,
        theme: effectiveTheme,
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
  }, [items, version, selectedWell, unit, effectiveTheme]);

  return (
    <section className="block" aria-labelledby={titleId}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 id={titleId} style={{ margin: 0 }}>
          Well Construction Schematic
        </h2>
        <span className="pill idle" style={{ fontSize: '0.72rem' }}>
          {applicableItems.length} {applicableItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {order.length > 1 && (
        <div
          className="row"
          style={{ alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginTop: '6px' }}
        >
          <span style={{ color: 'var(--muted)' }}>Well / Lateral:</span>
          <div className="seg" role="group" aria-label="Select well for construction schematic">
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
        </div>
      )}

      {/* Fit-check warning alert banner */}
      {fitWarnings.length > 0 && (
        <div
          role="alert"
          style={{
            margin: '8px 0',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--err, #ef4444)',
            color: 'var(--err, #ef4444)',
            fontSize: '0.8rem',
            lineHeight: 1.4,
          }}
        >
          <strong>Fit-Check Warning:</strong>
          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
            {fitWarnings.map((w, idx) => (
              <li key={`warn-${idx}`}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        ref={containerRef}
        className="schematic-container"
        style={{
          width: '100%',
          minHeight: '420px',
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--line)',
          marginTop: '8px',
        }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Well Construction Schematic for ${selectedWell}`}
          style={{ display: 'block' }}
        />
      </div>
    </section>
  );
}
