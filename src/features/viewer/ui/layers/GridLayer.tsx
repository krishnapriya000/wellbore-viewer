import { Html } from '@react-three/drei';
import { useMemo } from 'react';
import { Vector3, type Box3 } from 'three';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';

/** Surface grid sized to the wells, compass letters and a surface marker. Rebuilt only when bounds change. */
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
      {/* key forces a fresh helper (and disposal of the old one) when colours or size change */}
      <gridHelper
        key={`${size}${colors.grid}`}
        args={[size, size / 10, colors.grid, colors.grid2]}
        position={[cx, 0, cz]}
      />
      {(
        [
          ['N', 0, -1, 'North (-Z)'],
          ['S', 0, 1, 'South (+Z)'],
          ['E', 1, 0, 'East (+X)'],
          ['W', -1, 0, 'West (-X)'],
        ] as const
      ).map(([t, dx, dz, fullLabel]) => (
        <Html
          key={t}
          position={[cx + dx * (half + 6), 0.5, cz + dz * (half + 6)]}
          center
          className="compass"
        >
          <span className="compass-dir">{t}</span>
          <span className="compass-axis">{fullLabel}</span>
        </Html>
      ))}

      {/* Surface grid scale badge */}
      <Html position={[cx + half - 4, 0.5, cz + half - 4]} center className="grid-scale-badge">
        Grid: 1 sq = {gridCellDisplay} {unit}
      </Html>

      {/* Drilling rig cone at surface location */}
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[2.4, 9, 4, 1, true]} />
        <meshBasicMaterial color={colors.label} wireframe />
      </mesh>
      <Html position={[0, 10.5, 0]} center className="surface-label">
        Surface location (0, 0)
      </Html>
    </group>
  );
}

