import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { useDrilling } from '@/features/drilling';
import { computeSleeveSegments, useGeologyStore, type SleeveSegment } from '@/features/geology';
import { stationsReached, type Well } from '@/features/survey';

function splitSegmentAtMd(
  seg: SleeveSegment,
  splitMd: number,
): { drilled: SleeveSegment | null; ahead: SleeveSegment | null } {
  if (seg.endMd <= splitMd) {
    return { drilled: seg, ahead: null };
  }
  if (seg.startMd >= splitMd) {
    return { drilled: null, ahead: seg };
  }

  // Segment crosses splitMd. Split points between drilled and ahead-of-bit.
  const drilledPts = seg.points.filter((p) => p.md <= splitMd);
  const aheadPts = seg.points.filter((p) => p.md >= splitMd);

  const lastDrilled = drilledPts.at(-1);
  const firstAhead = aheadPts[0];

  if (lastDrilled && (!firstAhead || firstAhead.md > splitMd)) {
    aheadPts.unshift(lastDrilled);
  } else if (firstAhead && (!lastDrilled || lastDrilled.md < splitMd)) {
    drilledPts.push(firstAhead);
  }

  const drilled: SleeveSegment | null =
    drilledPts.length >= 2
      ? {
          ...seg,
          id: `${seg.id}-drilled`,
          endMd: splitMd,
          points: drilledPts,
        }
      : null;

  const ahead: SleeveSegment | null =
    aheadPts.length >= 2
      ? {
          ...seg,
          id: `${seg.id}-ahead`,
          startMd: splitMd,
          points: aheadPts,
        }
      : null;

  return { drilled, ahead };
}

function SleeveSegmentMesh({
  segment,
  isDrilled = true,
}: {
  segment: SleeveSegment;
  isDrilled?: boolean;
}) {
  const curve = useMemo(() => {
    if (segment.points.length < 2) return null;
    const pts = segment.points.map((p) => new Vector3(...p.scene));
    return new CatmullRomCurve3(pts, false, 'centripetal');
  }, [segment.points]);

  if (!curve) return null;

  return (
    <mesh name={`sleeve-${segment.id}-${isDrilled ? 'drilled' : 'ahead'}`}>
      {/* Sleeve tube concentric around trajectory (radius 0.58 vs wellbore 0.42) */}
      <tubeGeometry
        args={[curve, Math.min(600, Math.max(3, segment.points.length * 2)), 0.58, 8, false]}
      />
      <meshStandardMaterial
        color={segment.color.hex}
        roughness={isDrilled ? 0.45 : 0.85}
        metalness={0.08}
        transparent
        opacity={isDrilled ? 0.85 : 0.22}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Renders a visually rich lithology sleeve around the wellbore trajectory.
 *
 * Characteristics:
 * - Color-coded by the formation and lithology composition at each depth.
 * - Drilled/actual interval rendered solid (opacity ~0.85); ahead-of-bit/planned faint (opacity ~0.22).
 * - Aligns properly in both PLAN and ACTUAL modes.
 * - Respects formation visibility toggles (hides unmapped/hidden intervals).
 * - Rebuilt only when geology data, well selection, units, theme, or survey station intervals change;
 *   never on every 60 FPS animation frame.
 */
export function SleeveLayer({ well }: { well: Well }) {
  const formations = useGeologyStore((s) => s.formations);
  const geologyVersion = useGeologyStore((s) => s.version);
  const activeWell = useDrilling((s) => s.activeWell);
  const mode = useDrilling((s) => s.mode);

  const points = useMemo(() => {
    if (mode === 'plan') return well.plan;
    return well.actual.length >= 2 ? well.actual : well.plan;
  }, [mode, well.plan, well.actual]);

  // Station count selector ensures re-render occurs only when crossing survey stations,
  // not on every animation frame.
  const bitStation = useDrilling((s) =>
    s.activeWell === well.name ? stationsReached(points, s.md) : points.length,
  );

  const rawSegments = useMemo(() => {
    if (points.length < 2) return [];
    return computeSleeveSegments(points, well.name, formations);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- well.version + geologyVersion + mode are content keys
  }, [well.name, well.version, geologyVersion, formations, points]);

  // Partition into drilled (solid) and ahead-of-bit (faint) intervals based on drilling state
  const { drilledSegments, aheadSegments } = useMemo(() => {
    const isThisActiveWell = activeWell === well.name;
    const splitMd =
      isThisActiveWell && mode === 'actual'
        ? (points[Math.min(bitStation, points.length - 1)]?.md ?? Infinity)
        : mode === 'plan'
          ? 0 // All planned/ahead-of-bit
          : Infinity; // Already drilled

    const drilled: SleeveSegment[] = [];
    const ahead: SleeveSegment[] = [];

    for (const seg of rawSegments) {
      if (!seg.formationId) continue; // Respect visibility: do not render unmapped/hidden intervals
      const { drilled: d, ahead: a } = splitSegmentAtMd(seg, splitMd);
      if (d) drilled.push(d);
      if (a) ahead.push(a);
    }

    return { drilledSegments: drilled, aheadSegments: ahead };
  }, [rawSegments, activeWell, well.name, mode, points, bitStation]);

  return (
    <group name={`sleeve-layer-${well.name}`}>
      {drilledSegments.map((seg) => (
        <SleeveSegmentMesh key={seg.id} segment={seg} isDrilled={true} />
      ))}
      {aheadSegments.map((seg) => (
        <SleeveSegmentMesh key={seg.id} segment={seg} isDrilled={false} />
      ))}
    </group>
  );
}
