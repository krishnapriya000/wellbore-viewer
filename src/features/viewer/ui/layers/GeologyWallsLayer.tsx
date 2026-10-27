import { Html } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BoxGeometry, EdgesGeometry, type Box3 } from 'three';
import { useGeologyStore } from '@/features/geology';
import type { Well } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { computeGeologyWalls, type TvdWallDescriptor } from '../../lib/geologyWalls';

function TvdWallMesh({ wall }: { wall: TvdWallDescriptor }) {
  const edges = useMemo(() => {
    const box = new BoxGeometry(...wall.size);
    const edgeGeo = new EdgesGeometry(box);
    box.dispose();
    return edgeGeo;
  }, [wall.size]);

  useEffect(() => {
    return () => {
      edges.dispose();
    };
  }, [edges]);

  return (
    <group name={`tvd-wall-${wall.name}`}>
      {/* Translucent stratigraphic slab */}
      <mesh position={wall.position}>
        <boxGeometry args={wall.size} />
        <meshStandardMaterial
          color={wall.color.hex}
          transparent
          opacity={0.12}
          depthWrite={false}
          roughness={0.85}
        />
      </mesh>

      {/* Stratigraphic horizon boundaries / wireframe frame */}
      <lineSegments position={wall.position} geometry={edges}>
        <lineBasicMaterial
          color={wall.color.hex}
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/**
 * Visualizes 3D Geological Stratigraphic Walls and MD override envelopes.
 *
 * Characteristics:
 * - Extents are dynamically sized to the field well envelope with padding.
 * - Slabs are translucent (opacity ~0.12, depthWrite: false) so trajectories inside remain completely visible.
 * - Rebuilt only when formation store version, wells, or bounds change (never per frame).
 */
export function GeologyWallsLayer({
  bounds,
  wells,
}: {
  bounds: Box3;
  wells: readonly Well[];
}) {
  const formations = useGeologyStore((s) => s.formations);
  const version = useGeologyStore((s) => s.version);
  const unit = useSettings((s) => s.unit);

  const layout = useMemo(
    () => computeGeologyWalls(formations, bounds, wells),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for formations
    [formations, version, bounds, wells],
  );

  return (
    <group name="geology-walls-layer">
      {/* TVD Regional Formations */}
      {layout.tvdWalls.map((wall) => (
        <group key={wall.id}>
          <TvdWallMesh wall={wall} />

          {/* Formation label on the perimeter */}
          <Html position={wall.labelPosition} center={false} className="geology-wall-badge">
            <span style={{ fontWeight: 600 }}>{wall.name}</span>
            <small>
              {formatNumber(toDisplay(wall.fromFt, unit), 0)} –{' '}
              {formatNumber(toDisplay(wall.toFt, unit), 0)} {unit} ({wall.compSummary})
            </small>
          </Html>
        </group>
      ))}

      {/* Localized MD Override Envelopes */}
      {layout.mdOverrides.map((override) => (
        <group key={override.id} position={override.position}>
          <mesh>
            <boxGeometry args={override.size} />
            <meshStandardMaterial
              color={override.color.hex}
              transparent
              opacity={0.25}
              depthWrite={false}
              roughness={0.6}
            />
          </mesh>

          <Html position={[0, override.size[1] / 2 + 1.2, 0]} center className="geology-override-badge">
            {override.name} ({override.well} MD Override)
          </Html>
        </group>
      ))}
    </group>
  );
}
