import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { CatmullRomCurve3 } from 'three';
import { atMd, densify, type Well } from '@/features/survey';
import { toScene } from '../../lib/scene';
import { TextSprite } from '../TextSprite';

/**
 * One well's planned path.
 * Renders:
 * 1. Semi-transparent trajectory tube (radius 0.4, opacity 0.55) matching reference.
 * 2. Torus junction ring on multilateral branches at kick-off MD (well.junction).
 * 3. Billboard text sprite at the well TD with well name.
 */
export function PlanLayer({
  well,
  color,
  mode = 'actual',
  isActiveWell = false,
  visible = true,
}: {
  well: Well;
  color: string;
  mode?: 'actual' | 'plan';
  isActiveWell?: boolean;
  visible?: boolean;
}) {
  const curve = useMemo(() => {
    const pts = densify(well.plan).map((p) => toScene(p));
    return pts.length > 1 ? new CatmullRomCurve3(pts, false, 'centripetal') : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for plan
  }, [well.version]);

  const end = well.plan.at(-1) ?? well.actual.at(-1);
  const labelPos = useMemo(() => (end ? toScene(end).setY(toScene(end).y + 3.2) : null), [end]);

  // Multilateral junction ring where the lateral leaves the motherbore
  const junctionPos = useMemo(() => {
    if (well.junction <= 0) return null;
    const points = well.plan.length ? well.plan : well.actual;
    const p = atMd(points, well.junction);
    return p ? toScene(p) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key
  }, [well.junction, well.version, well.plan, well.actual]);

  if (!visible) return null;

  const isPrimaryPlan = isActiveWell && mode === 'plan';

  return (
    <group name={`plan-${well.name}`}>
      {curve && (
        <mesh>
          <tubeGeometry
            args={[
              curve,
              Math.min(1400, curve.points.length * 3),
              0.4,
              8,
              false,
            ]}
          />
          {isPrimaryPlan ? (
            <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} />
          ) : (
            <meshBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} />
          )}
        </mesh>
      )}

      {/* Multilateral junction ring */}
      {junctionPos && (
        <mesh position={junctionPos} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.22, 8, 28]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}

      {/* Well TD billboard text label */}
      {labelPos && (
        <>
          <TextSprite
            text={well.name}
            color={color}
            height={4.4}
            weight={700}
            position={labelPos}
          />
          <Html position={labelPos} center className="well-label" style={{ color }}>
            {well.name}
          </Html>
        </>
      )}
    </group>
  );
}
