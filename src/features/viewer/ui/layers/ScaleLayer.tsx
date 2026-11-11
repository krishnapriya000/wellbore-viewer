import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Box3, Group } from 'three';
import {
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Line,
  LineBasicMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';
import { useDrilling } from '@/features/drilling';
import { atMd, useSurveyStore, type Well } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay, type DepthUnit } from '@/shared/units/units';
import {
  computeLandingPlanes,
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
  getMaxTvd,
  type LandingPlaneDescriptor,
  SCALE,
  tvdToSceneY,
} from '../../lib/scale';
import { toScene } from '../../lib/scene';

const tmpBit = new Vector3();

function LandingTargetMesh({
  plane,
  color,
  unit,
}: {
  plane: LandingPlaneDescriptor;
  color: string;
  unit: DepthUnit;
}) {
  const edges = useMemo(() => {
    const geo = new PlaneGeometry(plane.width, plane.length);
    const edgeGeo = new EdgesGeometry(geo);
    geo.dispose();
    return edgeGeo;
  }, [plane.width, plane.length]);

  useEffect(
    () => () => {
      edges.dispose();
    },
    [edges],
  );

  return (
    <group
      name={`landing-plane-${plane.wellName}`}
      position={[plane.position.x, plane.position.y, plane.position.z]}
    >
      <lineSegments rotation={[-Math.PI / 2, 0, 0]} geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
      <Html position={[0, 0.8, 0]} center className="landing-plane-badge">
        <span>{plane.wellName} Landing Target</span>
        <small>
          TVD {formatNumber(toDisplay(plane.avgTvdFt, unit), 0)} {unit}
        </small>
      </Html>
    </group>
  );
}

export function ScaleLayer({
  bounds,
  well,
  wells,
  color,
  labelColor,
  gridColor: _gridColor,
  wellColors,
  visible = true,
}: {
  bounds: Box3;
  well?: Well;
  wells?: readonly Well[];
  color: string;
  labelColor: string;
  gridColor: string;
  wellColors?: readonly string[];
  visible?: boolean;
}) {
  const unit = useSettings((s) => s.unit);
  const drillMode = useDrilling((s) => s.mode);

  // TVD staff at the south-west corner of the 3D block: ticks every 500 ft, labels every 1,000 ft
  // Matches original HTML line 515: const x0 = gx - half, z0 = gz + half
  const staffPos = useMemo(() => {
    if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.max.x)) {
      return computeStaffPosition(bounds, 10, 'sw');
    }
    const c = bounds.getCenter(new Vector3());
    const s = bounds.getSize(new Vector3());
    const size = Math.ceil((Math.max(s.x, s.z) + 40) / 20) * 20;
    const gx = Math.round(c.x / 10) * 10;
    const gz = Math.round(c.z / 10) * 10;
    const half = size / 2;
    return { x: gx - half, z: gz + half };
  }, [bounds]);

  // True maximum TVD across bounds, active lateral, and all multilateral wells
  const maxTvdFt = useMemo(() => {
    const depthFromBounds = Math.abs(bounds.min.y) / SCALE;
    const depthFromWells = wells ? getMaxTvd(wells) : getMaxTvd(well);
    return Math.max(1000, depthFromBounds, depthFromWells);
  }, [bounds, well, wells]);

  const ticks = useMemo(() => computeTvdTicks(maxTvdFt, unit), [maxTvdFt, unit]);

  // Staff pole reaches at least to the deepest depth tick
  const lastTickY = Math.abs(ticks.at(-1)?.y ?? 0);
  const staffLength = Math.max(10, maxTvdFt * SCALE, lastTickY);

  // Landing-zone target reference planes beneath horizontal sections (inc >= 85°)
  const landingPlanes = useMemo(() => {
    const targetWells = wells ?? (well ? [well] : []);
    return computeLandingPlanes(targetWells);
  }, [wells, well]);

  // MD markers along active trajectory, updated on lateral, version, mode, or unit change
  const mdMarkers = useMemo(() => {
    if (!well) return [];
    const points = drillMode === 'plan' || well.actual.length < 2 ? well.plan : well.actual;
    if (points.length < 2) return [];
    const totalMd = points.at(-1)!.md;
    return computeMdMarkers(totalMd, (md) => atMd(points, md), unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- well.version + well.name + drillMode + unit are content key
  }, [well?.name, well?.version, drillMode, unit]);

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
    if (!visible) return;
    const drill = useDrilling.getState();
    const activeWell = drill.activeWell ? useSurveyStore.getState().wells[drill.activeWell] : undefined;
    const refLine = refLineRef.current;

    if (!activeWell || !bitLabelGroup.current) {
      if (bitLabelGroup.current) bitLabelGroup.current.visible = false;
      if (staffBadgeGroup.current) staffBadgeGroup.current.visible = false;
      if (refLine) refLine.visible = false;
      return;
    }

    const points =
      drill.mode === 'plan' || activeWell.actual.length < 2
        ? activeWell.plan
        : activeWell.actual;

    if (points.length < 2) {
      bitLabelGroup.current.visible = false;
      if (staffBadgeGroup.current) staffBadgeGroup.current.visible = false;
      if (refLine) refLine.visible = false;
      return;
    }

    const tip = atMd(points, drill.md);
    if (!tip) {
      bitLabelGroup.current.visible = false;
      if (staffBadgeGroup.current) staffBadgeGroup.current.visible = false;
      if (refLine) refLine.visible = false;
      return;
    }

    const currentUnit = useSettings.getState().unit;
    const bitPos = toScene(tip, tmpBit);
    const bitY = tvdToSceneY(tip.tvd);

    // 1. Bit label is cleanly owned and rendered by BitLayer to avoid visual duplication
    bitLabelGroup.current.visible = false;

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

  const staffGeometry = useMemo(() => {
    const pts: Vector3[] = [
      new Vector3(staffPos.x, 0, staffPos.z),
      new Vector3(staffPos.x, -staffLength, staffPos.z),
    ];
    for (let d = 5; d <= staffLength; d += 5) {
      pts.push(
        new Vector3(staffPos.x, -d, staffPos.z),
        new Vector3(staffPos.x + (Math.round(d) % 10 !== 0 ? 1.5 : 3.2), -d, staffPos.z),
      );
    }
    return new BufferGeometry().setFromPoints(pts);
  }, [staffPos.x, staffPos.z, staffLength]);

  useEffect(() => {
    return () => {
      staffGeometry.dispose();
    };
  }, [staffGeometry]);

  if (!visible) return null;

  return (
    <group name="scale-layer">
      {/* 1. TVD Staff LineSegments pole and ticks matching reference HTML line 518 */}
      <lineSegments geometry={staffGeometry}>
        <lineBasicMaterial color={labelColor} />
      </lineSegments>

      {/* 2. Top TVD Axis Header Badge */}
      <group position={[staffPos.x, 4, staffPos.z]}>
        <Html center className="tvd-header-badge">
          TVD ({unit})
        </Html>
      </group>

      {/* 3. TVD Staff Depth Ticks: Major ticks every 1,000 ft show labels matching reference HTML line 519 */}
      {ticks.map((t) => {
        const isMajor = Math.round(t.tvdFt / 100) % 10 === 0;
        if (!isMajor) return null;
        return (
          <group key={t.tvdFt} position={[staffPos.x, t.y, staffPos.z]}>
            <Html position={[-1.2, 0, 0]} center={false} className="tvd-tick-label">
              {t.label}
            </Html>
          </group>
        );
      })}

      {/* 4. Dynamic TVD Staff depth indicator */}
      <group ref={staffBadgeGroup} visible={false}>
        <mesh position={[0.5, 0, 0]}>
          <boxGeometry args={[1.0, 0.22, 0.22]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <Html center={false}>
          <span ref={staffBadgeTextRef} className="tvd-staff-badge" />
        </Html>
      </group>

      {/* 6. Dynamic TVD horizontal reference line */}
      <primitive ref={refLineRef} object={refLineObject} />

      {/* 7. Moving Drill-Bit HUD Label */}
      <group ref={bitLabelGroup} visible={false}>
        <Html position={[0, 2.2, 0]} center>
          <div ref={bitLabelTextRef} className="bit-hud-label" />
        </Html>
      </group>

      {/* 8. MD Markers along trajectory */}
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

      {/* 9. Target Landing-Zone Reference Planes */}
      {landingPlanes.map((lp) => (
        <LandingTargetMesh
          key={`landing-plane-${lp.wellName}`}
          plane={lp}
          color={wellColors?.[lp.slot] ?? color}
          unit={unit}
        />
      ))}
    </group>
  );
}

