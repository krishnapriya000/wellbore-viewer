import { lazy, Suspense, useEffect } from 'react';
import { BitReadout, DrillControls, useDrilling } from '@/features/drilling';
import { SurveyImport, SurveyTable, useSurveyStore } from '@/features/survey';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

// three.js + R3F load in their own chunk, after the shell has painted.
const Viewport = lazy(() => import('@/features/viewer').then((m) => ({ default: m.Viewport })));

export function ViewerPage() {
  const status = useSurveyStore((s) => s.status);
  const error = useSurveyStore((s) => s.error);
  const loadSample = useSurveyStore((s) => s.loadSample);
  const order = useSurveyStore((s) => s.order);
  const activeWell = useDrilling((s) => s.activeWell);
  const setActiveWell = useDrilling((s) => s.setActiveWell);

  // Until the API exists, start with the bundled sample surveys.
  useEffect(() => {
    if (status === 'empty') void loadSample();
  }, [status, loadSample]);

  useEffect(() => {
    if (order.length && (!activeWell || !order.includes(activeWell))) setActiveWell(order[0]!);
  }, [order, activeWell, setActiveWell]);

  return (
    <main className="layout">
      <ErrorBoundary name="3D viewport">
        <Suspense fallback={<section className="viewport loading">Loading 3D view…</section>}>
          <Viewport />
        </Suspense>
      </ErrorBoundary>
      <aside className="panel">
        {status === 'error' && (
          <p className="msg err" role="alert">
            {error}
          </p>
        )}
        <ErrorBoundary name="Drilling">
          <DrillControls />
          <BitReadout />
        </ErrorBoundary>
        <ErrorBoundary name="Survey data">
          <SurveyImport activeWell={activeWell} />
          <SurveyTable well={activeWell} bitStore={useDrilling} />
        </ErrorBoundary>
      </aside>
    </main>
  );
}
