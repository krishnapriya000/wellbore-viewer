import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { CatmullRomCurve3 } from 'three';
import { densify, type Well } from '@/features/survey';
import { toScene } from '../../lib/scene';

/**
 * One well's planned path. Geometry depends only on the plan, so it is built once per data change
 * (`well.version`), never per frame. R3F disposes the old geometry when `args` change.
 */
export function PlanLayer({
  well,
  color,
  mode = 'actual',
  isActiveWell = false,
}: {
  well: Well;
  color: string;
  mode?: 'actual' | 'plan';
  isActiveWell?: boolean;
}) {
  const curve = useMemo(() => {
    const pts = densify(well.plan).map((p) => toScene(p));
    return pts.length > 1 ? new CatmullRomCurve3(pts, false, 'centripetal') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for plan
  }, [well.version]);

  const end = well.plan.at(-1) ?? well.actual.at(-1);
  const labelPos = useMemo(() => (end ? toScene(end).setY(toScene(end).y + 3.2) : null), [end]);

  const isPrimaryPlan = isActiveWell && mode === 'plan';

  return (
    <group name={`plan-${well.name}`}>
      {curve && (
        <mesh>
          <tubeGeometry
            args={[
              curve,
              Math.min(1400, curve.points.length * 3),
              isPrimaryPlan ? 0.46 : 0.38,
              isPrimaryPlan ? 10 : 8,
              false,
            ]}
          />
          {isPrimaryPlan ? (
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
          ) : (
            <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} />
          )}
        </mesh>
      )}
      {labelPos && (
        <Html position={labelPos} center className="well-label" style={{ color }}>
          {well.name}
        </Html>
      )}
    </group>
  );
}
