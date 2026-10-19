import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LiveFeed, useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { Segmented } from '@/shared/ui/Segmented';
import { wellBounds } from '../lib/scene';
import { CameraRig, type CameraView } from './CameraRig';
import { ActualLayer } from './layers/ActualLayer';
import { BitLayer } from './layers/BitLayer';
import { GridLayer } from './layers/GridLayer';
import { PlanLayer } from './layers/PlanLayer';
import { useSceneColors } from './useSceneColors';

export function Viewport() {
  const wells = useSurveyStore(useShallow((s) => s.order.map((n) => s.wells[n]!)));
  const activeWell = useDrilling((s) => s.activeWell);
  const [view, setView] = useState<CameraView>('3d');
  const [autoRotate, setAutoRotate] = useState(false);
  const colors = useSceneColors();

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
        {wells.map((w) => (
          <PlanLayer key={w.name} well={w} color={colors.wells[w.slot] ?? colors.label} />
        ))}
        {active && <ActualLayer key={active.name} well={active} color={colors.actual} />}
        <BitLayer color={colors.actual} />
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
            <button type="button" aria-pressed={autoRotate} onClick={() => setAutoRotate((v) => !v)}>
              Rotate
            </button>
          </div>
        </div>
      </div>
      <LiveFeed />
    </section>
  );
}
