import { CanvasTexture, RepeatWrapping } from 'three';
import { getLithologyTileCanvas, type Lithology } from '@/features/geology';

/**
 * Three.js procedural texture generator for geological formations.
 * Converts 2D procedural lithology pattern tiles into repeat-wrapped CanvasTextures.
 */

/**
 * Creates a configured Three.js CanvasTexture for the specified lithology.
 * Returns null in headless/server environments where canvas is unavailable.
 */
export function createLithologyTexture(
  lith: Lithology,
  repeatX = 1,
  repeatY = 1,
  baseColor?: string,
): CanvasTexture | null {
  const canvas = getLithologyTileCanvas(lith, 64, baseColor);
  if (!canvas) return null;

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(Math.max(0.05, repeatX), Math.max(0.05, repeatY));
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return texture;
}
