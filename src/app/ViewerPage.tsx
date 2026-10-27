import { lazy, Suspense, useEffect } from 'react';
import { ConstructionEditor, Schematic } from '@/features/construction';
import { BitReadout, DrillControls, useDrilling } from '@/features/drilling';
import { EventEditor } from '@/features/events';
import { FormationEditor, StripLog } from '@/features/geology';
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

  const setMode = useDrilling((s) => s.setMode);
  const setPlaying = useDrilling((s) => s.setPlaying);

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
        <ErrorBoundary name="Geology">
          <StripLog activeWell={activeWell} />
          <FormationEditor />
        </ErrorBoundary>
        <ErrorBoundary name="Well construction">
          <Schematic activeWell={activeWell} />
          <ConstructionEditor />
        </ErrorBoundary>
        <ErrorBoundary name="Events">
          <EventEditor />
        </ErrorBoundary>
        <ErrorBoundary name="Survey data">
          <SurveyImport
            activeWell={activeWell}
            onLoaded={(kind, wells) => {
              const firstWell = wells.keys().next().value;
              const targetWell = activeWell && wells.has(activeWell) ? activeWell : firstWell;
              if (kind === 'actual') {
                if (targetWell) {
                  setActiveWell(targetWell, 0);
                  setPlaying(true);
                }
                setMode('actual');
              } else {
                if (targetWell && (!activeWell || !wells.has(activeWell))) {
                  setActiveWell(targetWell, 0);
                }
                setMode('plan');
              }
            }}
            onLoadSample={async () => {
              await loadSample();
              setActiveWell('L1', 0);
              setPlaying(true);
            }}
          />
          <SurveyTable well={activeWell} bitStore={useDrilling} />
        </ErrorBoundary>
      </aside>
    </main>
  );
}
