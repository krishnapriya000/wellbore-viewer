import { Html } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
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
import { cssToken } from '../../lib/scene';

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
  hexColor: string,
  height: number,
  labelColor: string,
): Sprite | null {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // jsdom (test env) and some headless environments return null for getContext('2d').
  if (!ctx) return null;

  const fontSize = 52;
  const font = `600 ${fontSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;

  // Measure text so the canvas is exactly wide enough
  ctx.font = font;
  const textW = Math.ceil(ctx.measureText(name).width) + 24;
  canvas.width = textW;
  canvas.height = 72;

  // Re-set font after resize (canvas resize clears state)
  ctx.font = font;

  // Translucent formation-color pill background
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = hexColor;
  const r = 10;
  ctx.beginPath();
  ctx.roundRect(2, 8, canvas.width - 4, canvas.height - 16, r);
  ctx.fill();

  // Opaque left accent bar in the formation color
  ctx.globalAlpha = 1;
  ctx.fillStyle = hexColor;
  ctx.beginPath();
  ctx.roundRect(2, 8, 6, canvas.height - 16, [r, 0, 0, r]);
  ctx.fill();

  // Formation name text
  ctx.font = font;
  ctx.fillStyle = labelColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 18, canvas.height / 2);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;

  const sprite = new Sprite(
    new SpriteMaterial({ map: texture, transparent: true, depthTest: false }),
  );

  // Scale sprite in scene units: height = `height`, preserve canvas aspect
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(height * aspect, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

// ---------------------------------------------------------------------------
// FormationLabelSprite — React component wrapping a THREE.Sprite
// ---------------------------------------------------------------------------
function FormationLabelSprite({
  name,
  hexColor,
  position,
}: {
  name: string;
  hexColor: string;
  position: [number, number, number];
}) {
  // 3 scene units ≈ 300 ft — visible but not overwhelming
  const SPRITE_HEIGHT = 3;

  const sprite = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const labelColor = cssToken('--scene-label', hexColor);
    return makeFormationSprite(name, hexColor, SPRITE_HEIGHT, labelColor);
  }, [name, hexColor]);

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

      {/* 6. Formation name — canvas-texture THREE.Sprite placed at the label position.
              A sprite is a genuine 3D scene object. It stays on the formation surface
              as the camera rotates/pans/zooms, unlike a <Html> DOM overlay card.
              billboard (faces camera) keeps text readable from any angle. */}
      <FormationLabelSprite
        name={wall.name}
        hexColor={wall.color.hex}
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
