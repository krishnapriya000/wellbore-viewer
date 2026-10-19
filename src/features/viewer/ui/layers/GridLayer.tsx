import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { Vector3, type Box3 } from 'three';

/** Surface grid sized to the wells, compass letters and a surface marker. Rebuilt only when bounds change. */
export function GridLayer({
  bounds,
  colors,
}: {
  bounds: Box3;
  colors: { grid: string; grid2: string; label: string };
}) {
  const { size, cx, cz } = useMemo(() => {
    const c = bounds.getCenter(new Vector3());
    const s = bounds.getSize(new Vector3());
    return {
      size: Math.ceil((Math.max(s.x, s.z) + 40) / 20) * 20,
      cx: Math.round(c.x / 10) * 10,
      cz: Math.round(c.z / 10) * 10,
    };
  }, [bounds]);
  const half = size / 2;

  return (
    <group name="grid">
      {/* key forces a fresh helper (and disposal of the old one) when colours or size change */}
      <gridHelper
        key={`${size}${colors.grid}`}
        args={[size, size / 10, colors.grid, colors.grid2]}
        position={[cx, 0, cz]}
      />
      {(
        [
          ['N', 0, -1],
          ['S', 0, 1],
          ['E', 1, 0],
          ['W', -1, 0],
        ] as const
      ).map(([t, dx, dz]) => (
        <Html key={t} position={[cx + dx * (half + 5), 0.5, cz + dz * (half + 5)]} center className="compass">
          {t}
        </Html>
      ))}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[2.4, 9, 4, 1, true]} />
        <meshBasicMaterial color={colors.label} wireframe />
      </mesh>
    </group>
  );
}
