import { useEffect, useState } from 'react';
import { ConstructionEditor, Schematic, useConstructionStore } from '@/features/construction';
import { useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

export function WellboreGeometryPage() {
  const status = useSurveyStore((s) => s.status);
  const loadSample = useSurveyStore((s) => s.loadSample);
  const order = useSurveyStore((s) => s.order);
  const activeDrillingWell = useDrilling((s) => s.activeWell);
  const setActiveDrillingWell = useDrilling((s) => s.setActiveWell);

  const items = useConstructionStore((s) => s.items);
  const [userSelectedWell, setUserSelectedWell] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'empty') void loadSample();
  }, [status, loadSample]);

  const selectedWell =
    userSelectedWell && order.includes(userSelectedWell)
      ? userSelectedWell
      : activeDrillingWell && order.includes(activeDrillingWell)
        ? activeDrillingWell
        : order[0] ?? 'L1';

  const handleWellChange = (well: string) => {
    setUserSelectedWell(well);
    setActiveDrillingWell(well);
  };

  const casingCount = items.filter((i) => i.kind === 'casing').length;
  const holeCount = items.filter((i) => i.kind === 'hole').length;

  return (
    <div className="module-page" style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div
        className="block"
        style={{
          borderLeft: '4px solid var(--accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              font: '700 1.3rem var(--f-display)',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Wellbore Geometry & Construction
            <span className="pill ok" style={{ fontSize: '0.72rem' }}>
              PostgreSQL
            </span>
            <span className="pill idle" style={{ fontSize: '0.72rem' }}>
              {holeCount} Hole {holeCount === 1 ? 'Section' : 'Sections'} · {casingCount} {casingCount === 1 ? 'Casing' : 'Casings'}
            </span>
          </h1>
          <p className="hint" style={{ margin: 0 }}>
            Wellbore structural schematic, casing program, hole section sizing, cementing stages, and fit-check validation.
          </p>
        </div>

        {/* Well / Lateral Selector */}
        <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
          <label htmlFor="geometry-well-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Wellbore:
          </label>
          <select
            id="geometry-well-select"
            value={selectedWell}
            onChange={(e) => handleWellChange(e.target.value)}
            style={{ minWidth: '120px' }}
          >
            {order.length === 0 ? (
              <option value="L1">L1</option>
            ) : (
              order.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main Grid: Schematic on Left, Construction Editor on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(360px, 1fr)',
          gap: '16px',
          alignItems: 'start',
        }}
        className="geometry-grid"
      >
        {/* Left: 2D Wellbore Schematic with Fit-Check */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBoundary name="Well Construction Schematic">
            <Schematic activeWell={selectedWell} />
          </ErrorBoundary>
        </div>

        {/* Right: Construction Elements Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBoundary name="Construction Editor">
            <ConstructionEditor />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
