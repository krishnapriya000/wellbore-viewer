import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { useGeologyStore } from '@/features/geology';
import { computeSleeveSegments, type SleeveSegment } from '@/features/geology';
import type { Well } from '@/features/survey';

function SleeveSegmentMesh({ segment }: { segment: SleeveSegment }) {
  const curve = useMemo(() => {
    if (segment.points.length < 2) return null;
    const pts = segment.points.map((p) => new Vector3(...p.scene));
    return new CatmullRomCurve3(pts, false, 'centripetal');
  }, [segment.points]);

  if (!curve) return null;

  return (
    <mesh name={`sleeve-${segment.id}`}>
      {/* Sleeve tube concentric around trajectory (radius 0.58 vs wellbore 0.42) */}
      <tubeGeometry
        args={[curve, Math.min(600, Math.max(3, segment.points.length * 2)), 0.58, 8, false]}
      />
      <meshStandardMaterial
        color={segment.color.hex}
        roughness={0.65}
        metalness={0.08}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Renders a visually subtle lithology sleeve around the wellbore trajectory.
 *
 * Characteristics:
 * - Color-coded by the formation and lithology composition at each depth.
 * - Supports vertical, inclined, horizontal, and multilateral well trajectories.
 * - Supports TVD stratigraphy and well-specific MD overrides.
 * - Multi-fraction lithology blends are mathematically represented in the sleeve's RGB hue.
 * - Memoized on `well.version` and `geologyVersion`; never rebuilt on per-frame clock ticks.
 */
export function SleeveLayer({ well }: { well: Well }) {
  const formations = useGeologyStore((s) => s.formations);
  const geologyVersion = useGeologyStore((s) => s.version);

  const segments = useMemo(() => {
    const points = well.actual.length >= 2 ? well.actual : well.plan;
    if (points.length < 2) return [];
    return computeSleeveSegments(points, well.name, formations);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- well.version + geologyVersion are the content keys
  }, [well.name, well.version, geologyVersion, formations]);

  return (
    <group name={`sleeve-layer-${well.name}`}>
      {segments.map((seg) => (
        <SleeveSegmentMesh key={seg.id} segment={seg} />
      ))}
    </group>
  );
}
