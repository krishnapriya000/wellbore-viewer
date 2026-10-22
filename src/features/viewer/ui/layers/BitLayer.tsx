import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, Timer, Vector3 } from 'three';
import { advance, useDrilling } from '@/features/drilling';
import { detectCrossings, useEventsStore } from '@/features/events';
import { arcPoint, atMd, stationsReached, useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { toScene } from '../../lib/scene';

const TIP_SAMPLES = 6;
const tmp = new Vector3();

/**
 * Owns the drilling clock. Runs inside the R3F render loop:
 *  1. advances bit MD with the pure `advance` function,
 *  2. writes it to the store (no React re-render: panels read it throttled),
 *  3. moves the bit mesh and the short segment from the last station to the bit in place.
 */
export function BitLayer({ color }: { color: string }) {
  const bit = useRef<Mesh>(null);
  const timer = useMemo(() => {
    const t = new Timer();
    if (typeof document !== 'undefined') {
      t.connect(document);
    }
    return t;
  }, []);

  // `<line>` collides with the SVG JSX element, so the segment is a primitive we own and dispose.
  const tipObject = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(TIP_SAMPLES * 3), 3));
    return new Line(geometry, new LineBasicMaterial({ color }));
  }, [color]);

  useEffect(
    () => () => {
      tipObject.geometry.dispose();
      tipObject.material.dispose();
      timer.dispose();
    },
    [tipObject, timer],
  );

  useFrame((_, dt) => {
    const drill = useDrilling.getState();
    const well = drill.activeWell ? useSurveyStore.getState().wells[drill.activeWell] : undefined;
    if (!well || well.actual.length < 2 || !bit.current) {
      if (bit.current) bit.current.visible = false;
      return;
    }

    const td = well.actual.at(-1)!.md;
    const next = advance(drill, dt, td);
    if (next.md !== drill.md || next.playing !== drill.playing) {
      const events = useEventsStore.getState().events;
      const unit = useSettings.getState().unit;
      const crossings = detectCrossings(well.actual, events, well.name, drill.md, next.md, unit);
      useDrilling.setState({ md: next.md, playing: next.playing });
      if (crossings.length) {
        drill.pushFeed(crossings);
      }
    }

    const md = useDrilling.getState().md;
    const tip = atMd(well.actual, md)!;
    bit.current.visible = true;
    bit.current.position.copy(toScene(tip, tmp));

    timer.update();
    const elapsed = timer.getElapsed();
    bit.current.scale.setScalar(next.playing ? 1 + 0.18 * Math.sin(elapsed * 6) : 1);

    // Segment from the last passed station to the bit, along the true arc.
    const i = stationsReached(well.actual, md);
    const from = well.actual[Math.max(0, i - 1)]!;
    const to = well.actual[Math.min(i, well.actual.length - 1)]!;
    const span = to.md - from.md;
    const attr = tipObject.geometry.getAttribute('position') as BufferAttribute;
    for (let k = 0; k < TIP_SAMPLES; k++) {
      const f = span > 0 ? ((md - from.md) / span) * (k / (TIP_SAMPLES - 1)) : 0;
      toScene(arcPoint(from, to, f), tmp).toArray(attr.array as Float32Array, k * 3);
    }
    attr.needsUpdate = true;
  });

  return (
    <group name="bit">
      <mesh ref={bit}>
        <sphereGeometry args={[1.3, 18, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <primitive object={tipObject} />
    </group>
  );
}
