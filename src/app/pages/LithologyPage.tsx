import { useEffect, useState } from 'react';
import { useDrilling } from '@/features/drilling';
import { FormationEditor, StripLog, useGeologyStore, WellboreLithology } from '@/features/geology';
import { useSurveyStore } from '@/features/survey';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

export function LithologyPage() {
  const status = useSurveyStore((s) => s.status);
  const loadSample = useSurveyStore((s) => s.loadSample);
  const order = useSurveyStore((s) => s.order);
  const activeDrillingWell = useDrilling((s) => s.activeWell);
  const setActiveDrillingWell = useDrilling((s) => s.setActiveWell);

  const formations = useGeologyStore((s) => s.formations);
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
            Lithology & Stratigraphy
            <span className="pill ok" style={{ fontSize: '0.72rem' }}>
              PostgreSQL
            </span>
            <span className="pill idle" style={{ fontSize: '0.72rem' }}>
              {formations.length} {formations.length === 1 ? 'Layer' : 'Layers'}
            </span>
          </h1>
          <p className="hint" style={{ margin: 0 }}>
            Geological formations, mineral lithology composition, wellbore strata intersections, and strip logs.
          </p>
        </div>

        {/* Well / Lateral Selector */}
        <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
          <label htmlFor="lithology-well-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Wellbore:
          </label>
          <select
            id="lithology-well-select"
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

      {/* Main Grid: Visuals & Strip Logs on Left/Center, Formation Editor on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 1.4fr) minmax(340px, 1fr)',
          gap: '16px',
          alignItems: 'start',
        }}
        className="lithology-grid"
      >
        {/* Left Column: Visual logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBoundary name="Wellbore Lithology">
            <WellboreLithology activeWell={selectedWell} />
          </ErrorBoundary>

          <ErrorBoundary name="Strip Log">
            <StripLog activeWell={selectedWell} />
          </ErrorBoundary>
        </div>

        {/* Right Column: Formation & Lithology Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ErrorBoundary name="Formation Editor">
            <FormationEditor />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
