import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Box3, Group } from 'three';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
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
  computeDepthGuideLines,
  computeLandingPlanes,
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
  getMaxTvd,
  type DepthGuideLine,
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
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[plane.width, plane.length]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.09}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
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

function DepthGuidesMesh({
  guides,
  color,
}: {
  guides: DepthGuideLine[];
  color: string;
}) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (const g of guides) {
      // Line extending in X
      pts.push(g.xStart, g.y, g.zStart, g.xEnd, g.y, g.zStart);
      // Line extending in Z
      pts.push(g.xStart, g.y, g.zStart, g.xStart, g.y, g.zEnd);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
    return geo;
  }, [guides]);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
    </lineSegments>
  );
}

/**
 * ScaleLayer displays:
 * 1. Vertical TVD scale staff with tick lines, depth labels, and top TVD axis header.
 * 2. Horizontal depth guide lines extending from the staff at depth intervals.
 * 3. Moving drill-bit HUD label showing current MD & TVD in both PLAN and ACTUAL modes.
 * 4. Dynamic horizontal TVD reference line tracking the bit's vertical depth against the TVD staff.
 * 5. Measured Depth (MD) markers along the wellbore trajectory.
 * 6. Target landing-zone reference planes beneath horizontal sections.
 */
export function ScaleLayer({
  bounds,
  well,
  wells,
  color,
  labelColor,
  gridColor,
  wellColors,
}: {
  bounds: Box3;
  well?: Well;
  wells?: readonly Well[];
  color: string;
  labelColor: string;
  gridColor: string;
  wellColors?: readonly string[];
}) {
  const unit = useSettings((s) => s.unit);
  const drillMode = useDrilling((s) => s.mode);

  const staffPos = useMemo(() => computeStaffPosition(bounds, 10), [bounds]);

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

  // Depth guide lines extending along envelope boundaries at major TVD levels
  const depthGuides = useMemo(
    () => computeDepthGuideLines(staffPos, bounds, ticks),
    [staffPos, bounds, ticks],
  );

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

    // 1. Position moving bit HUD label
    bitLabelGroup.current.visible = true;
    bitLabelGroup.current.position.copy(bitPos);
    if (bitLabelTextRef.current) {
      const mdStr = formatNumber(toDisplay(tip.md, currentUnit), 1);
      const tvdStr = formatNumber(toDisplay(tip.tvd, currentUnit), 1);
      const modeBadge = drill.mode === 'plan' ? 'PLAN' : 'ACTUAL';
      bitLabelTextRef.current.textContent = `${activeWell.name} · ${mdStr} MD · ${tvdStr} TVD ${currentUnit} [${modeBadge}]`;
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
        <cylinderGeometry args={[0.2, 0.2, staffLength, 12]} />
        <meshStandardMaterial color={gridColor} roughness={0.6} />
      </mesh>

      {/* 2. Top TVD Axis Header Badge */}
      <group position={[staffPos.x, 3.5, staffPos.z]}>
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshBasicMaterial color={gridColor} />
        </mesh>
        <Html center className="tvd-header-badge">
          TVD ({unit})
        </Html>
      </group>

      {/* 3. TVD Staff Depth Ticks */}
      {ticks.map((t) => (
        <group key={t.tvdFt} position={[staffPos.x, t.y, staffPos.z]}>
          <mesh position={[0.7, 0, 0]}>
            <boxGeometry args={[1.4, 0.12, 0.12]} />
            <meshBasicMaterial color={labelColor} />
          </mesh>
          <Html position={[-0.8, 0, 0]} center={false} className="tvd-tick-label">
            {t.label}
          </Html>
        </group>
      ))}

      {/* 4. Horizontal Depth Guide Lines */}
      <DepthGuidesMesh guides={depthGuides} color={gridColor} />

      {/* 5. Dynamic TVD Staff depth indicator */}
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

