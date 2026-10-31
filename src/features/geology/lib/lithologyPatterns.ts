import type { Lithology } from '../model/types';
import { LITHOLOGY_COLORS } from './lithologyColors';

/**
 * Procedural geological pattern tile generator.
 * Faithfully ports the 12 standard geological lithology symbols from the reference HTML
 * (Multilateral Trajectory Viewer.html).
 */

const tileCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Draws the standard geological pattern for a given lithology onto a CanvasRenderingContext2D.
 * Default coordinate space is a square tile of size `px` (canonical grid 64x64).
 */
export function drawLithologyTile(
  ctx: CanvasRenderingContext2D,
  lith: Lithology,
  px = 64,
  baseColor?: string,
): void {
  const u = px / 64;
  const base = baseColor ?? LITHOLOGY_COLORS[lith]?.hex ?? '#cccccc';

  // Fill base color
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, px, px);

  // Stroke / fill styling matching reference HTML
  const isDarkBase = lith === 'coal';
  ctx.strokeStyle = isDarkBase ? 'rgba(255, 255, 255, 0.45)' : 'rgba(25, 25, 25, 0.82)';
  ctx.fillStyle = isDarkBase ? 'rgba(255, 255, 255, 0.45)' : 'rgba(25, 25, 25, 0.82)';
  ctx.lineWidth = Math.max(1, 1.6 * u);

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1 * u, y1 * u);
    ctx.lineTo(x2 * u, y2 * u);
    ctx.stroke();
  };

  const dot = (x: number, y: number, r = 2.4) => {
    ctx.beginPath();
    ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2);
    ctx.fill();
  };

  switch (lith) {
    case 'sandstone':
      [
        [8, 8],
        [40, 8],
        [24, 24],
        [56, 24],
        [8, 40],
        [40, 40],
        [24, 56],
        [56, 56],
      ].forEach(([x, y]) => dot(x!, y!));
      break;

    case 'shale':
      [
        [4, 10, 26, 10],
        [36, 10, 60, 10],
        [-12, 26, 10, 26],
        [20, 26, 44, 26],
        [54, 26, 76, 26],
        [4, 42, 26, 42],
        [36, 42, 60, 42],
        [-12, 58, 10, 58],
        [20, 58, 44, 58],
        [54, 58, 76, 58],
      ].forEach(([x1, y1, x2, y2]) => line(x1!, y1!, x2!, y2!));
      break;

    case 'siltstone':
      [
        [4, 12, 26, 12],
        [36, 44, 60, 44],
      ].forEach(([x1, y1, x2, y2]) => line(x1!, y1!, x2!, y2!));
      [
        [46, 12],
        [14, 44],
        [30, 28],
        [56, 28],
        [6, 60],
        [38, 60],
      ].forEach(([x, y]) => dot(x!, y!, 1.9));
      break;

    case 'limestone':
      line(0, 0.8, 64, 0.8);
      line(0, 32, 64, 32);
      line(16, 0, 16, 32);
      line(48, 32, 48, 64);
      break;

    case 'dolomite':
      line(0, 0.8, 64, 0.8);
      line(0, 32, 64, 32);
      line(10, 0, 22, 32);
      line(42, 32, 54, 64);
      break;

    case 'marl':
      line(0, 0.8, 64, 0.8);
      line(0, 32, 64, 32);
      line(16, 0, 16, 32);
      line(48, 32, 48, 64);
      line(26, 16, 40, 16);
      line(6, 48, 20, 48);
      break;

    case 'coal':
      line(0, 16, 64, 16);
      line(0, 48, 64, 48);
      break;

    case 'anhydrite':
      for (let k = -64; k < 128; k += 16) {
        line(k, 0, k + 64, 64);
        line(k + 64, 0, k, 64);
      }
      break;

    case 'salt':
      [
        [16, 16],
        [48, 48],
      ].forEach(([x, y]) => {
        line(x! - 7, y!, x! + 7, y!);
        line(x!, y! - 7, x!, y! + 7);
      });
      line(0, 32, 64, 32);
      break;

    case 'conglomerate':
      [
        [14, 14, 7],
        [46, 18, 5],
        [28, 44, 8],
        [56, 50, 4],
        [6, 54, 4],
      ].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x! * u, y! * u, r! * u, 0, Math.PI * 2);
        ctx.stroke();
      });
      break;

    case 'chert':
      [
        [16, 16],
        [48, 48],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo((x! - 8) * u, (y! + 6) * u);
        ctx.lineTo(x! * u, (y! - 8) * u);
        ctx.lineTo((x! + 8) * u, (y! + 6) * u);
        ctx.closePath();
        ctx.stroke();
      });
      break;

    case 'basement':
      [
        [16, 16],
        [48, 48],
        [48, 16],
        [16, 48],
      ].forEach(([x, y], i) => {
        if (i % 2) {
          line(x! - 6, y! - 6, x! + 6, y! + 6);
          line(x! + 6, y! - 6, x! - 6, y! + 6);
        } else {
          line(x! - 7, y!, x! + 7, y!);
          line(x!, y! - 7, x!, y! + 7);
        }
      });
      break;
  }
}

/**
 * Returns a cached HTMLCanvasElement rendering the lithology pattern tile.
 * Returns null in non-DOM (Node) environments without throwing.
 */
export function getLithologyTileCanvas(
  lith: Lithology,
  px = 64,
  baseColor?: string,
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;

  const key = `${lith}_${px}_${baseColor ?? ''}`;
  if (tileCanvasCache.has(key)) {
    return tileCanvasCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    tileCanvasCache.set(key, canvas);
    return canvas;
  }

  drawLithologyTile(ctx, lith, px, baseColor);
  tileCanvasCache.set(key, canvas);
  return canvas;
}

/**
 * Draws a repeated lithology pattern swatch directly onto an arbitrary canvas element.
 */
export function drawLithologySwatch(canvas: HTMLCanvasElement, lith: Lithology, baseColor?: string): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const tile = getLithologyTileCanvas(lith, 32, baseColor);
  if (!tile) return;

  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = baseColor ?? LITHOLOGY_COLORS[lith]?.hex ?? '#cccccc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

/** Clears cached tile canvases (useful for tests or memory hygiene) */
export function clearLithologyTileCache(): void {
  tileCanvasCache.clear();
}
