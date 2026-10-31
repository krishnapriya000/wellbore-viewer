import { useMemo } from 'react';
import { CatmullRomCurve3 } from 'three';
import { densify, stationsReached, type Well } from '@/features/survey';
import { useDrilling } from '@/features/drilling';
import { toScene } from '../../lib/scene';

/**
 * The drilled path up to the last station the bit has passed.
 * The selector returns a station COUNT, so this component re-renders only when the bit
 * crosses a station (a few times a second at most), not every frame.
 */
export function ActualLayer({
  well,
  color,
  mode = 'actual',
  visible = true,
}: {
  well: Well;
  color: string;
  mode?: 'actual' | 'plan';
  visible?: boolean;
}) {
  const reached = useDrilling((s) => stationsReached(well.actual, s.md));

  const curve = useMemo(() => {
    const pts = densify(well.actual.slice(0, reached)).map((p) => toScene(p));
    return pts.length > 1 ? new CatmullRomCurve3(pts, false, 'centripetal') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version + count are the content key
  }, [well.version, reached]);

  if (!visible || !curve) return null;
  const isPlanMode = mode === 'plan';

  return (
    <mesh name={`actual-${well.name}`}>
      <tubeGeometry
        args={[
          curve,
          Math.min(1400, curve.points.length * 3),
          isPlanMode ? 0.36 : 0.44,
          10,
          false,
        ]}
      />
      {isPlanMode ? (
        <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
      )}
    </mesh>
  );
}
