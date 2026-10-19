import { Box3, Vector3 } from 'three';
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
