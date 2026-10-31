import { Html } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Line,
  LineBasicMaterial,
  type Material,
  Vector3,
  type Box3,
} from 'three';
import { LithologySwatch, useGeologyStore } from '@/features/geology';
import type { Well } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';
import {
  computeGeologyWalls,
  type MdOverrideDescriptor,
  type TvdWallDescriptor,
} from '../../lib/geologyWalls';
import { createLithologyTexture } from '../../lib/lithologyTexture';

const TILE_FT = 400; // 400 ft per pattern tile repeat, matching reference viewer

function TvdWallMesh({ wall }: { wall: TvdWallDescriptor }) {
  // Texture scaling: consistent physical scale across layers
  const repNorthX = (wall.northWallSize[0] * 100) / TILE_FT;
  const repNorthY = (wall.toFt - wall.fromFt) / TILE_FT;
  const northTexture = useMemo(
    () => createLithologyTexture(wall.dominantLith, repNorthX, repNorthY, wall.color.hex),
    [wall.dominantLith, repNorthX, repNorthY, wall.color.hex],
  );

  const repWestX = (wall.westWallSize[0] * 100) / TILE_FT;
  const repWestY = (wall.toFt - wall.fromFt) / TILE_FT;
  const westTexture = useMemo(
    () => createLithologyTexture(wall.dominantLith, repWestX, repWestY, wall.color.hex),
    [wall.dominantLith, repWestX, repWestY, wall.color.hex],
  );

  const repTopX = (wall.topPlaneSize[0] * 100) / TILE_FT;
  const repTopY = (wall.topPlaneSize[1] * 100) / TILE_FT;
  const topTexture = useMemo(
    () => createLithologyTexture(wall.dominantLith, repTopX, repTopY, wall.color.hex),
    [wall.dominantLith, repTopX, repTopY, wall.color.hex],
  );

  // Horizon boundary wireframe loop around the formation top
  const horizonLine = useMemo(() => {
    const pts = wall.horizonLoop.map(([x, y, z]) => new Vector3(x, y, z));
    const geo = new BufferGeometry().setFromPoints(pts);
    const mat = new LineBasicMaterial({
      color: wall.color.hex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    return new Line(geo, mat);
  }, [wall.horizonLoop, wall.color.hex]);

  // Clean GPU disposal when layer changes or unmounts
  useEffect(() => {
    return () => {
      northTexture?.dispose();
      westTexture?.dispose();
      topTexture?.dispose();
      horizonLine.geometry.dispose();
      (horizonLine.material as Material).dispose();
    };
  }, [northTexture, westTexture, topTexture, horizonLine]);

  return (
    <group name={`tvd-wall-${wall.name}`}>
      {/* 1. North back-wall surface with lithology pattern */}
      <mesh position={wall.northWallPosition}>
        <planeGeometry args={wall.northWallSize} />
        <meshBasicMaterial
          map={northTexture ?? undefined}
          color={northTexture ? 0xffffff : wall.color.hex}
          transparent
          opacity={0.52}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. West back-wall surface with lithology pattern */}
      <mesh position={wall.westWallPosition} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={wall.westWallSize} />
        <meshBasicMaterial
          map={westTexture ?? undefined}
          color={westTexture ? 0xffffff : wall.color.hex}
          transparent
          opacity={0.52}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Top horizon surface plane with lithology pattern */}
      <mesh position={wall.topPlanePosition} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={wall.topPlaneSize} />
        <meshBasicMaterial
          map={topTexture ?? undefined}
          color={topTexture ? 0xffffff : wall.color.hex}
          transparent
          opacity={0.25}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 4. Stratigraphic horizon boundary outline across the field */}
      <primitive object={horizonLine} />

      {/* 5. Subtle volumetric 3D slab tint */}
      <mesh position={wall.position}>
        <boxGeometry args={wall.size} />
        <meshBasicMaterial
          color={wall.color.hex}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

function MdOverrideMesh({ override }: { override: MdOverrideDescriptor }) {
  const repX = Math.max(1, (override.size[0] * 100) / TILE_FT);
  const repY = Math.max(1, (override.size[1] * 100) / TILE_FT);
  const texture = useMemo(
    () => createLithologyTexture(override.dominantLith, repX, repY, override.color.hex),
    [override.dominantLith, repX, repY, override.color.hex],
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return (
    <group key={override.id} position={override.position}>
      <mesh>
        <boxGeometry args={override.size} />
        <meshBasicMaterial
          map={texture ?? undefined}
          color={texture ? 0xffffff : override.color.hex}
          transparent
          opacity={0.45}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <Html position={[0, override.size[1] / 2 + 1.2, 0]} center className="geology-override-badge">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <LithologySwatch
            lith={override.dominantLith}
            baseColor={override.color.hex}
            width={16}
            height={12}
          />
          <span>
            {override.name} ({override.well} MD Override)
          </span>
        </span>
      </Html>
    </group>
  );
}

/**
 * Visualizes 3D Geological Stratigraphic Formations and localized MD overrides.
 *
 * Characteristics:
 * - Back walls (North & West) and top horizon surfaces display distinct lithology-specific patterns.
 * - Slabs are translucent (depthWrite: false) so trajectories inside remain completely visible.
 * - Rebuilt only when formation store version, wells, or bounds change (never per frame).
 * - Full memory hygiene: Three.js textures and geometries are disposed upon update/unmount.
 */
export function GeologyWallsLayer({
  bounds,
  wells,
  visible = true,
}: {
  bounds: Box3;
  wells: readonly Well[];
  visible?: boolean;
}) {
  const formations = useGeologyStore((s) => s.formations);
  const version = useGeologyStore((s) => s.version);
  const unit = useSettings((s) => s.unit);

  const layout = useMemo(
    () => computeGeologyWalls(formations, bounds, wells),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for formations
    [formations, version, bounds, wells],
  );

  if (!visible) return null;

  return (
    <group name="geology-walls-layer">
      {/* TVD Regional Formations */}
      {layout.tvdWalls.map((wall) => (
        <group key={wall.id}>
          <TvdWallMesh wall={wall} />

          {/* Formation label on the north wall near the top of each formation.
              distanceFactor keeps the label pixel-size consistent as the camera zooms.
              border-left color matches the formation lithology color for quick identification. */}
          <Html
            position={wall.labelPosition}
            center
            distanceFactor={120}
            className="geology-wall-badge"
          >
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
                borderLeft: `3px solid ${wall.color.hex}`,
                paddingLeft: '4px',
                margin: '-2px -6px',
                padding: '2px 6px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LithologySwatch lith={wall.dominantLith} baseColor={wall.color.hex} width={20} height={14} />
                <span style={{ fontWeight: 600 }}>{wall.name}</span>
              </span>
              <small>
                {formatNumber(toDisplay(wall.fromFt, unit), 0)} – {formatNumber(toDisplay(wall.toFt, unit), 0)}{' '}
                {unit} ({wall.compSummary})
              </small>
            </span>
          </Html>
        </group>
      ))}

      {/* Localized MD Override Envelopes */}
      {layout.mdOverrides.map((override) => (
        <MdOverrideMesh key={override.id} override={override} />
      ))}
    </group>
  );
}
