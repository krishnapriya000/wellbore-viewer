import { atMd, type SurveyPoint, type Well } from '@/features/survey';
import type { ConstructionItem } from '../model/types';
import { checkItem } from './rules';

/** 1 scene unit = 100 ft. North is -z, East is +x, depth is -y. */
const toSceneCoords = (p: Pick<SurveyPoint, 'n' | 'e' | 'tvd'>) => ({
  x: p.e * 0.01,
  y: -p.tvd * 0.01,
  z: -p.n * 0.01,
});

export interface Construction3DSegment {
  id: string;
  itemId: string;
  kind: 'hole' | 'casing' | 'cement';
  wellName: string;
  fromMd: number;
  toMd: number;
  sizeInches: number;
  /** Radius in Three.js scene units (with explicitly documented visual scale) */
  radius: number;
  /** Three.js scene coordinates [x, y, z] along the trajectory */
  points: [number, number, number][];
  /** Position of the casing shoe in scene coordinates, if applicable */
  shoePosition?: [number, number, number];
  hasWarnings: boolean;
  warnings: string[];
}

/**
 * Explicit visual scaling for 3D wellbore construction.
 *
 * Trajectory depths are stored in feet and mapped via SCALE = 0.01 (1 unit = 100 ft).
 * Construction diameters are in inches (4.5" to 36"). Physical diameters in scene units
 * would be 0.003 - 0.03 units, which are sub-pixel needles invisible at field scale.
 *
 * To maintain engineering hierarchy and clarity:
 * - Trajectory core line: radius ~0.42
 * - Casing: concentric tubes from 0.46 to 0.84 depending on casing OD
 * - Cement: annular sheath enveloping casing (casingRadius + 0.08)
 * - Hole: outer borehole rock wall from 0.58 to 1.04 depending on bit size
 *
 * Real entered diameters are preserved in all labels, tooltips, and fit-checks.
 */
export function computeConstructionRadius(kind: 'hole' | 'casing' | 'cement', sizeInches: number): number {
  const clampedSize = Math.max(1, Math.min(60, sizeInches));
  const norm = clampedSize / 36;

  switch (kind) {
    case 'casing':
      return 0.46 + norm * 0.38;
    case 'cement':
      return 0.46 + norm * 0.38 + 0.08;
    case 'hole':
      return 0.58 + norm * 0.46;
  }
}

/**
 * Samples trajectory points along [startMd, endMd] following the minimum-curvature arc.
 */
export function sampleTrajectorySpan(
  surveyPoints: readonly SurveyPoint[],
  startMd: number,
  endMd: number,
  maxStepFt = 150,
): [number, number, number][] {
  if (surveyPoints.length < 2 || endMd <= startMd) return [];

  const startPt = atMd(surveyPoints, startMd);
  const endPt = atMd(surveyPoints, endMd);
  if (!startPt || !endPt) return [];

  // Intermediate survey stations within (startMd, endMd)
  const intermediates: number[] = [];
  for (const s of surveyPoints) {
    if (s.md > startMd + 1e-3 && s.md < endMd - 1e-3) {
      intermediates.push(s.md);
    }
  }

  // Ensure steps between samples don't exceed maxStepFt for smooth curves
  const allMds: number[] = [startMd];
  for (const md of intermediates) {
    let curr = allMds.at(-1)!;
    while (md - curr > maxStepFt) {
      curr += maxStepFt;
      allMds.push(curr);
    }
    allMds.push(md);
  }
  let curr = allMds.at(-1)!;
  while (endMd - curr > maxStepFt) {
    curr += maxStepFt;
    allMds.push(curr);
  }
  allMds.push(endMd);

  // Convert all distinct samples to scene coordinates
  const result: [number, number, number][] = [];
  for (const md of allMds) {
    const pt = atMd(surveyPoints, md);
    if (pt) {
      const v = toSceneCoords(pt);
      const last = result.at(-1);
      if (!last || Math.hypot(v.x - last[0], v.y - last[1], v.z - last[2]) > 1e-4) {
        result.push([v.x, v.y, v.z]);
      }
    }
  }

  return result.length >= 2 ? result : [];
}

/**
 * Computes 3D construction segments for the wellbore scene.
 *
 * Multilateral and well-association rules:
 * - Shared items ('All') are mapped along the primary motherbore well trajectory (wellOrder[0]).
 *   This avoids duplicate overlapping meshes (and z-fighting) across laterals that share the motherbore.
 * - Well-specific items ('L1', 'L2') are mapped ONLY along that specific well's trajectory.
 * - Items with invalid or out-of-range depths are safely omitted.
 * - Items triggering fit-check warnings are flagged for distinct visual presentation.
 */
export function computeConstructionSegments(
  items: readonly ConstructionItem[],
  wells: Record<string, Well>,
  wellOrder: readonly string[],
): Construction3DSegment[] {
  const segments: Construction3DSegment[] = [];
  const motherboreName = wellOrder[0];

  for (const item of items) {
    const targetWellName = item.well === 'All' ? motherboreName : item.well;
    if (!targetWellName) continue;

    const well = wells[targetWellName];
    if (!well) continue;

    const points = well.actual.length >= 2 ? well.actual : well.plan;
    if (points.length < 2) continue;

    const wellTd = points.at(-1)!.md;
    if (item.from >= wellTd) continue;

    const startMd = Math.max(0, item.from);
    const endMd = Math.min(wellTd, item.to);
    if (endMd - startMd < 1) continue;

    const pts = sampleTrajectorySpan(points, startMd, endMd);
    if (pts.length < 2) continue;

    const radius = computeConstructionRadius(item.kind, item.size);
    const warnings = checkItem(items, item, targetWellName);

    let shoePos: [number, number, number] | undefined;
    if (item.kind === 'casing') {
      const shoePt = atMd(points, endMd);
      if (shoePt) {
        const v = toSceneCoords(shoePt);
        shoePos = [v.x, v.y, v.z];
      }
    }

    segments.push({
      id: `${targetWellName}-${item.id}`,
      itemId: item.id,
      kind: item.kind,
      wellName: targetWellName,
      fromMd: item.from,
      toMd: item.to,
      sizeInches: item.size,
      radius,
      points: pts,
      shoePosition: shoePos,
      hasWarnings: warnings.length > 0,
      warnings,
    });
  }

  return segments;
}
