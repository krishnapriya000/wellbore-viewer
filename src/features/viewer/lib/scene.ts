import { Box3, CanvasTexture, LinearFilter, Sprite, SpriteMaterial, Vector3 } from 'three';
import type { SurveyPoint, Well } from '@/features/survey';

/** 1 scene unit = 100 ft. North is −z, east is +x, depth is −y. */
export const SCALE = 0.01;

export const toScene = (p: Pick<SurveyPoint, 'n' | 'e' | 'tvd'>, out = new Vector3()) =>
  out.set(p.e * SCALE, -p.tvd * SCALE, -p.n * SCALE);

export function wellBounds(wells: readonly Well[]): Box3 {
  const box = new Box3(new Vector3(), new Vector3());
  const v = new Vector3();
  for (const w of wells) for (const p of [...w.plan, ...w.actual]) box.expandByPoint(toScene(p, v));
  return box;
}

/** Reads a CSS custom property so the 3D scene follows the same light/dark tokens as the page. */
export function cssToken(name: string, fallback = '#888888'): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Creates a native THREE.Sprite for clean text billboard rendering in the 3D scene.
 * Matches textSprite() in Multilateral Trajectory Viewer.html (lines 481-491).
 */
export function createTextSprite(
  text: string,
  color: string,
  h = 3.2,
  weight: number | string = 600,
  bg: string | null = null,
): Sprite | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const fs = 56;
  const font = `${weight} ${fs}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.font = font;
  const textWidth = Math.ceil(ctx.measureText(text).width);
  const w = textWidth + (bg ? 36 : 12);
  canvas.width = w;
  canvas.height = 72;

  ctx.font = font;
  if (bg) {
    ctx.fillStyle = bg;
    const r = 14;
    ctx.beginPath();
    ctx.moveTo(r, 4);
    ctx.arcTo(w - 2, 4, w - 2, 68, r);
    ctx.arcTo(w - 2, 68, 2, 68, r);
    ctx.arcTo(2, 68, 2, 4, r);
    ctx.arcTo(2, 4, w - 2, 4, r);
    ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bg ? 18 : 6, 38);

  const tex = new CanvasTexture(canvas);
  tex.minFilter = LinearFilter;
  const mat = new SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new Sprite(mat);
  sprite.scale.set((h * w) / 72, h, 1);
  sprite.renderOrder = 10;
  return sprite;
}

