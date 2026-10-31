import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LiveFeed, useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { Segmented } from '@/shared/ui/Segmented';
import { wellBounds } from '../lib/scene';
import { CameraRig, type CameraView } from './CameraRig';
import { LayersPanel } from './LayersPanel';
import { useLayersState } from './useLayersState';
import { ActualLayer } from './layers/ActualLayer';
import { BitLayer } from './layers/BitLayer';
import { CasingLayer } from './layers/CasingLayer';
import { EventMarkersLayer } from './layers/EventMarkersLayer';
import { GeologyWallsLayer } from './layers/GeologyWallsLayer';
import { GridLayer } from './layers/GridLayer';
import { PlanLayer } from './layers/PlanLayer';
import { ScaleLayer } from './layers/ScaleLayer';
import { SleeveLayer } from './layers/SleeveLayer';
import { useSceneColors } from './useSceneColors';

export function Viewport() {
  const wells = useSurveyStore(useShallow((s) => s.order.map((n) => s.wells[n]!)));
  const activeWell = useDrilling((s) => s.activeWell);
  const mode = useDrilling((s) => s.mode);
  const [view, setView] = useState<CameraView>('3d');
  const [autoRotate, setAutoRotate] = useState(false);
  const colors = useSceneColors();

  const layers = useLayersState(wells);

  // Content key: changes when any well's data changes, not when the bit moves.
  const dataKey = wells.map((w) => `${w.name}:${w.version}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- dataKey is the content key for wells
  const bounds = useMemo(() => wellBounds(wells), [dataKey]);
  const active = wells.find((w) => w.name === activeWell);

  return (
    <section className="viewport" aria-label="3D wellbore trajectory view">
      <Canvas camera={{ fov: 42, near: 0.1, far: 10000 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={[colors.scene]} />
        <hemisphereLight args={[0xffffff, 0x445555, 0.75]} />
        <directionalLight position={[80, 140, 60]} intensity={0.7} />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />
        <CameraRig view={view} bounds={bounds} fitKey={wells.map((w) => w.name).join('|')} />
        <GridLayer bounds={bounds} colors={colors} />
        <GeologyWallsLayer bounds={bounds} wells={wells} visible={layers.showGeology} />
        {wells.map((w) => (
          <SleeveLayer key={`sleeve-${w.name}`} well={w} visible={layers.showGeology} />
        ))}
        <CasingLayer />
        {wells.map((w) => (
          <PlanLayer
            key={w.name}
            well={w}
            color={colors.wells[w.slot] ?? colors.label}
            mode={mode}
            isActiveWell={w.name === activeWell}
            visible={layers.isPlanVisible(w.name)}
          />
        ))}
        {layers.showActual && active && (
          <ActualLayer
            key={active.name}
            well={active}
            color={colors.actual}
            mode={mode}
            visible={layers.showActual}
          />
        )}
        <BitLayer color={colors.actual} visible={layers.showActual} />
        <EventMarkersLayer />
        <ScaleLayer
          bounds={bounds}
          well={active}
          wells={wells}
          color={colors.actual}
          labelColor={colors.label}
          gridColor={colors.grid}
          wellColors={colors.wells}
          visible={layers.showScale}
        />
      </Canvas>

      <div className="hud top">
        <div className="brand">
          Multilateral Trajectory
          <small>Minimum curvature · drilling {activeWell ?? '—'}</small>
        </div>
        <div className="tools">
          <Segmented
            label="Camera view"
            value={view}
            onChange={setView}
            options={[
              { value: '3d', label: '3D' },
              { value: 'plan', label: 'Plan' },
              { value: 'section', label: 'Section' },
            ]}
          />
          <div className="seg">
            <button
              type="button"
              aria-pressed={layers.showGeology}
              onClick={() => layers.setShowGeology((v) => !v)}
              title="Toggle 3D geological formations and lithology patterns"
            >
              Formations
            </button>
            <button type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
              Rotate
            </button>
          </div>
        </div>
      </div>
      <LayersPanel
        wells={wells}
        colors={colors}
        showPlans={layers.showPlans}
        planVisibility={layers.planVisibility}
        showActual={layers.showActual}
        showGeology={layers.showGeology}
        showScale={layers.showScale}
        onTogglePlan={layers.togglePlan}
        onToggleShowPlans={layers.toggleShowPlans}
        onToggleActual={layers.toggleActual}
        onToggleGeology={layers.toggleGeology}
        onToggleScale={layers.toggleScale}
      />
      <LiveFeed />
    </section>
  );
}
