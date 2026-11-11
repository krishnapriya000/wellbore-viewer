import { Html } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Line,
  LinearFilter,
  LineBasicMaterial,
  type Material,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Box3,
} from 'three';
import { LithologySwatch, useGeologyStore } from '@/features/geology';
import type { Well } from '@/features/survey';
import {
  computeGeologyWalls,
  type MdOverrideDescriptor,
  type TvdWallDescriptor,
} from '../../lib/geologyWalls';
import { createLithologyTexture } from '../../lib/lithologyTexture';
import { useSceneColors } from '../useSceneColors';

const TILE_FT = 400; // 400 ft per pattern tile repeat, matching reference viewer

// ---------------------------------------------------------------------------
// Canvas-texture formation label sprite
// ---------------------------------------------------------------------------
// This replicates the original HTML viewer's textSprite() approach:
// a THREE.Sprite is a true 3D scene object that stays attached to the geometry
// as the camera rotates, pans, and zooms — unlike an <Html> DOM overlay.
//
// THREE.Sprite is always billboard (faces the camera) so the text remains
// readable from any angle, exactly as in the original HTML.
//
// Returns null when canvas.getContext('2d') is unavailable (e.g. jsdom in tests).
// ---------------------------------------------------------------------------
function makeFormationSprite(
  name: string,
  height = 2.6,
  weight = 600,
  color = '#42514d',
): Sprite | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // jsdom (test env) and some headless environments return null for getContext('2d').
  if (!ctx) return null;

  const fs = 56;
  const font = `${weight} ${fs}px "Barlow Condensed", "Arial Narrow", sans-serif`;

  // Measure text so canvas is exactly wide enough
  ctx.font = font;
  const textW = Math.ceil(ctx.measureText(name).width) + 12;
  canvas.width = textW;
  canvas.height = 72;

  // Re-set font after resize (canvas resize clears state)
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 6, 38);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;

  const sprite = new Sprite(
    new SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  );

  // Left-anchored vertically-centered text sprite matching original HTML: s.center.set(0, 0.5)
  sprite.center.set(0, 0.5);
  sprite.scale.set((height * textW) / 72, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// ---------------------------------------------------------------------------
// FormationLabelSprite — React component wrapping a THREE.Sprite
// ---------------------------------------------------------------------------
function FormationLabelSprite({
  name,
  position,
}: {
  name: string;
  position: [number, number, number];
}) {
  const colors = useSceneColors();
  const labelColor = colors.label || '#42514d';
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    }
  }, []);

  const sprite = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return makeFormationSprite(name, 2.6, 600, labelColor);
  }, [name, labelColor, fontsLoaded]);

  // Clean up GPU resources when the sprite changes or the component unmounts
  useEffect(() => {
    return () => {
      if (!sprite) return;
      (sprite.material as SpriteMaterial).map?.dispose();
      (sprite.material as SpriteMaterial).dispose();
    };
  }, [sprite]);

  if (!sprite) return null;

  sprite.position.set(...position);
  return <primitive object={sprite} />;
}

// ---------------------------------------------------------------------------
// TvdWallMesh — lithology wall surfaces for one TVD formation
// ---------------------------------------------------------------------------
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

  // Horizon boundary wireframe loop around the formation top
  const horizonLine = useMemo(() => {
    const pts = wall.horizonLoop.map(([x, y, z]) => new Vector3(x, y, z));
    const geo = new BufferGeometry().setFromPoints(pts);
    const mat = new LineBasicMaterial({
      color: wall.color.hex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    return new Line(geo, mat);
  }, [wall.horizonLoop, wall.color.hex]);

  // Clean GPU disposal when layer changes or unmounts
  useEffect(() => {
    return () => {
      northTexture?.dispose();
      westTexture?.dispose();
      horizonLine.geometry.dispose();
      (horizonLine.material as Material).dispose();
    };
  }, [northTexture, westTexture, horizonLine]);

  return (
    <group name={`tvd-wall-${wall.name}`}>
      {/* 1. North back-wall surface with lithology pattern */}
      <mesh position={wall.northWallPosition}>
        <planeGeometry args={wall.northWallSize} />
        <meshBasicMaterial
          map={northTexture ?? undefined}
          color={northTexture ? 0xffffff : wall.color.hex}
          transparent
          opacity={0.42}
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
          opacity={0.42}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Stratigraphic horizon boundary outline across the field */}
      <primitive object={horizonLine} />

      {/* 4. Formation name — canvas-texture THREE.Sprite placed at the label position */}
      <FormationLabelSprite
        name={wall.name}
        position={wall.labelPosition}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// MdOverrideMesh — localized wellbore-specific formation box
// ---------------------------------------------------------------------------
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

      {/* MD override still uses <Html> — these are localized per-well boxes,
          not on a shared regional wall, and are always positioned above the box. */}
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

// ---------------------------------------------------------------------------
// GeologyWallsLayer — public component
// ---------------------------------------------------------------------------
/**
 * Visualizes 3D Geological Stratigraphic Formations and localized MD overrides.
 *
 * - Back walls (North & West) and top horizon surfaces display lithology-specific patterns.
 * - Slabs are translucent (depthWrite: false) so trajectories inside remain visible.
 * - Rebuilt only when formation store version, wells, or bounds change (never per frame).
 * - Formation name labels are THREE.Sprite canvas-texture objects (not HTML overlays),
 *   so they are genuine 3D scene objects that stay attached to the formation surface.
 * - Full memory hygiene: Three.js textures, geometries, and sprites are disposed on update/unmount.
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

  const layout = useMemo(
    () => computeGeologyWalls(formations, bounds, wells),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- version is the content key for formations
    [formations, version, bounds, wells],
  );

  if (!visible) return null;

  return (
    <group name="geology-walls-layer">
      {/* TVD Regional Formations — label sprite is inside TvdWallMesh group */}
      {layout.tvdWalls.map((wall) => (
        <TvdWallMesh key={wall.id} wall={wall} />
      ))}

      {/* Localized MD Override Envelopes */}
      {layout.mdOverrides.map((override) => (
        <MdOverrideMesh key={override.id} override={override} />
      ))}
    </group>
  );
}
