import { useMemo } from 'react';
import { Vector3, type Box3 } from 'three';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { TextSprite } from '../TextSprite';

/**
 * Surface grid sized to the wells, compass text sprites, and surface drilling rig marker.
 * Matches Multilateral Trajectory Viewer.html (lines 504-513).
 */
export function GridLayer({
  bounds,
  colors,
}: {
  bounds: Box3;
  colors: { grid: string; grid2: string; label: string };
}) {
  const unit = useSettings((s) => s.unit);
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
  const gridCellDisplay = formatNumber(toDisplay(1000, unit), 0);

  return (
    <group name="grid">
      {/* Surface grid helper */}
      <gridHelper
        key={`${size}${colors.grid}`}
        args={[size, size / 10, colors.grid, colors.grid2]}
        position={[cx, 0, cz]}
      />

      {/* Compass direction letters ('N', 'S', 'E', 'W') billboard sprites */}
      {(
        [
          ['N', 0, -1],
          ['S', 0, 1],
          ['E', 1, 0],
          ['W', -1, 0],
        ] as const
      ).map(([t, dx, dz]) => (
        <TextSprite
          key={t}
          text={t}
          color={colors.label}
          height={5}
          weight={700}
          position={[cx + dx * (half + 5), 0.5, cz + dz * (half + 5)]}
        />
      ))}

      {/* Surface grid scale */}
      <TextSprite
        text={`Grid ${gridCellDisplay} ${unit}`}
        color={colors.label}
        height={2.4}
        weight={500}
        position={[cx - half + 1, 0.4, cz + half + 3]}
        center={[0, 0.5]}
      />

      {/* Drilling rig cone at surface location */}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[2.4, 9, 4, 1, true]} />
        <meshBasicMaterial color={colors.label} wireframe />
      </mesh>
      <TextSprite
        text="Surface location"
        color={colors.label}
        height={2.6}
        weight={500}
        position={[0, 11, 0]}
      />
    </group>
  );
}
