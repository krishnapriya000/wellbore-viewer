import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, Timer, Vector3 } from 'three';
import { advance, useDrilling } from '@/features/drilling';
import { detectCrossings, useEventsStore } from '@/features/events';
import { arcPoint, atMd, stationsReached, useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { toScene } from '../../lib/scene';

const TIP_SAMPLES = 6;
const tmp = new Vector3();

/**
 * Owns the drilling clock and renders the active drilling bit marker in 3D:
 * 1. Prominent pulsing drill bit sphere at the exact tip MD.
 * 2. Luminous outer halo highlighting the active endpoint.
 * 3. Clearly visible lateral identification badge (e.g. "L1 · 5,600 ft") right above the bit.
 * 4. Advances bit MD and synchronizes well progress dynamically.
 */
export function BitLayer({ color, visible = true }: { color: string; visible?: boolean }) {
  const bitGroup = useRef<Group>(null);
  const bit = useRef<Mesh>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

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
    const points = drill.mode === 'plan' ? well?.plan : well?.actual;
    if (!well || !points || points.length < 2 || !bitGroup.current) {
      if (bitGroup.current) bitGroup.current.visible = false;
      return;
    }

    const td = points.at(-1)!.md;
    const next = advance(drill, dt, td);
    if (next.md !== drill.md || next.playing !== drill.playing) {
      const events = useEventsStore.getState().events;
      const unit = useSettings.getState().unit;
      const crossings = detectCrossings(points, events, well.name, drill.md, next.md, unit);
      useDrilling.setState((s) => ({
        md: next.md,
        playing: next.playing,
        wellProgress: { ...s.wellProgress, [well.name]: next.md },
      }));
      if (crossings.length) {
        drill.pushFeed(crossings);
      }
    }

    if (!visible) {
      if (bitGroup.current) bitGroup.current.visible = false;
      return;
    }

    const md = useDrilling.getState().md;
    const tip = atMd(points, md)!;
    bitGroup.current.visible = true;
    bitGroup.current.position.copy(toScene(tip, tmp));

    timer.update();
    const elapsed = timer.getElapsed();
    const pulse = next.playing ? 1 + 0.18 * Math.sin(elapsed * 6) : 1;
    if (bit.current) bit.current.scale.setScalar(pulse);

    if (labelRef.current) {
      labelRef.current.textContent = `${well.name} · ${Math.round(tip.md).toLocaleString('en-US')} ft`;
    }

    // Segment from the last passed station to the bit, along the true arc.
    const i = stationsReached(points, md);
    const from = points[Math.max(0, i - 1)]!;
    const to = points[Math.min(i, points.length - 1)]!;
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
      {visible && (
        <>
          <group ref={bitGroup}>
            {/* 1. Core pulsing drill bit sphere (radius 1.3 matching reference HTML) */}
            <mesh ref={bit}>
              <sphereGeometry args={[1.3, 18, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* 2. Clearly visible active lateral identification label near drill bit */}
            <Html position={[0, 2.8, 0]} center className="bit-active-badge">
              <span ref={labelRef} className="bit-active-pill" />
            </Html>
          </group>
          <primitive object={tipObject} />
        </>
      )}
    </group>
  );
}
