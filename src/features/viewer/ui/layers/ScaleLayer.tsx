import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Box3, Group } from 'three';
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, Vector3 } from 'three';
import { useDrilling } from '@/features/drilling';
import { atMd, useSurveyStore, type Well } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';
import {
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
  SCALE,
  tvdToSceneY,
} from '../../lib/scale';
import { toScene } from '../../lib/scene';

const tmpBit = new Vector3();

/**
 * ScaleLayer displays:
 * 1. Moving drill-bit HUD label showing current MD & TVD without per-frame React state renders.
 * 2. Vertical TVD scale staff with tick lines and readable depth labels.
 * 3. Dynamic horizontal TVD reference line tracking the bit's vertical depth against the TVD staff.
 * 4. Measured Depth (MD) markers along the wellbore trajectory.
 */
export function ScaleLayer({
  bounds,
  well,
  color,
  labelColor,
  gridColor,
}: {
  bounds: Box3;
  well?: Well;
  color: string;
  labelColor: string;
  gridColor: string;
}) {
  const unit = useSettings((s) => s.unit);

  const staffPos = useMemo(() => computeStaffPosition(bounds, 10), [bounds]);

  const maxTvdFt = useMemo(() => {
    const depthFromBounds = Math.abs(bounds.min.y) / SCALE;
    const wellDepth = well ? (well.actual.at(-1)?.tvd ?? well.plan.at(-1)?.tvd ?? 0) : 0;
    return Math.max(1000, depthFromBounds, wellDepth);
  }, [bounds, well]);

  const ticks = useMemo(() => computeTvdTicks(maxTvdFt, unit), [maxTvdFt, unit]);

  const staffLength = Math.max(10, maxTvdFt * SCALE);

  // MD markers along the active trajectory, rebuilt only on data or unit change
  const mdMarkers = useMemo(() => {
    if (!well) return [];
    const points = well.actual.length >= 2 ? well.actual : well.plan;
    if (points.length < 2) return [];
    const totalMd = points.at(-1)!.md;
    return computeMdMarkers(totalMd, (md) => atMd(points, md), unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- well.version + well.name + unit are the content key
  }, [well?.name, well?.version, unit]);

  // TVD horizontal reference line (connects staff at bit TVD to the bit)
  const refLineObject = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(2 * 3), 3));
    const material = new LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    return new Line(geometry, material);
  }, [color]);

  useEffect(
    () => () => {
      refLineObject.geometry.dispose();
      refLineObject.material.dispose();
    },
    [refLineObject],
  );

  // Dynamic DOM and scene refs for per-frame updates without React renders
  const refLineRef = useRef<Line>(null);
  const bitLabelGroup = useRef<Group>(null);
  const bitLabelTextRef = useRef<HTMLDivElement>(null);
  const staffBadgeGroup = useRef<Group>(null);
  const staffBadgeTextRef = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const drill = useDrilling.getState();
    const activeWell = drill.activeWell ? useSurveyStore.getState().wells[drill.activeWell] : undefined;
    const refLine = refLineRef.current;

    if (!activeWell || activeWell.actual.length < 2 || !bitLabelGroup.current) {
      if (bitLabelGroup.current) bitLabelGroup.current.visible = false;
      if (staffBadgeGroup.current) staffBadgeGroup.current.visible = false;
      if (refLine) refLine.visible = false;
      return;
    }

    const tip = atMd(activeWell.actual, drill.md);
    if (!tip) {
      bitLabelGroup.current.visible = false;
      if (staffBadgeGroup.current) staffBadgeGroup.current.visible = false;
      if (refLine) refLine.visible = false;
      return;
    }

    const currentUnit = useSettings.getState().unit;
    const bitPos = toScene(tip, tmpBit);
    const bitY = tvdToSceneY(tip.tvd);

    // 1. Position moving bit HUD label
    bitLabelGroup.current.visible = true;
    bitLabelGroup.current.position.copy(bitPos);
    if (bitLabelTextRef.current) {
      const mdStr = formatNumber(toDisplay(tip.md, currentUnit), 1);
      const tvdStr = formatNumber(toDisplay(tip.tvd, currentUnit), 1);
      bitLabelTextRef.current.textContent = `${activeWell.name} · ${mdStr} MD · ${tvdStr} TVD ${currentUnit}`;
    }

    // 2. Position moving TVD staff badge
    if (staffBadgeGroup.current) {
      staffBadgeGroup.current.visible = true;
      staffBadgeGroup.current.position.set(staffPos.x, bitY, staffPos.z);
      if (staffBadgeTextRef.current) {
        staffBadgeTextRef.current.textContent = `▼ ${formatNumber(toDisplay(tip.tvd, currentUnit), 0)} ${currentUnit}`;
      }
    }

    // 3. Update horizontal TVD reference line from staff to bit
    if (refLine) {
      refLine.visible = true;
      const attr = refLine.geometry.getAttribute('position') as BufferAttribute;
      const arr = attr.array as Float32Array;
      arr[0] = staffPos.x;
      arr[1] = bitY;
      arr[2] = staffPos.z;
      arr[3] = bitPos.x;
      arr[4] = bitY;
      arr[5] = bitPos.z;
      attr.needsUpdate = true;
    }
  });

  return (
    <group name="scale-layer">
      {/* 1. TVD Staff vertical pole */}
      <mesh position={[staffPos.x, -staffLength / 2, staffPos.z]}>
        <cylinderGeometry args={[0.18, 0.18, staffLength, 8]} />
        <meshStandardMaterial color={gridColor} roughness={0.7} />
      </mesh>

      {/* 2. TVD Staff Depth Ticks */}
      {ticks.map((t) => (
        <group key={t.tvdFt} position={[staffPos.x, t.y, staffPos.z]}>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[1.4, 0.1, 0.1]} />
            <meshBasicMaterial color={labelColor} />
          </mesh>
          <Html position={[-0.6, 0, 0]} center={false} className="tvd-tick-label">
            {t.label}
          </Html>
        </group>
      ))}

      {/* 3. Dynamic TVD Staff depth indicator */}
      <group ref={staffBadgeGroup} visible={false}>
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[1.0, 0.22, 0.22]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Html center={false}>
          <span ref={staffBadgeTextRef} className="tvd-staff-badge" />
        </Html>
      </group>

      {/* 4. Dynamic TVD horizontal reference line */}
      <primitive ref={refLineRef} object={refLineObject} />

      {/* 5. Moving Drill-Bit HUD Label */}
      <group ref={bitLabelGroup} visible={false}>
        <Html position={[0, 2.2, 0]} center>
          <div ref={bitLabelTextRef} className="bit-hud-label" />
        </Html>
      </group>

      {/* 6. MD Markers along trajectory */}
      {mdMarkers.map((m) => (
        <group key={m.mdFt} position={[m.position.x, m.position.y, m.position.z]}>
          <mesh>
            <sphereGeometry args={[0.5, 12, 8]} />
            <meshStandardMaterial color={labelColor} roughness={0.35} />
          </mesh>
          <Html position={[0, 1.2, 0]} center className="md-marker-label">
            {m.label}
          </Html>
        </group>
      ))}
    </group>
  );
}
