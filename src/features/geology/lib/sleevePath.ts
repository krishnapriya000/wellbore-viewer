import type { SurveyPoint } from '@/features/survey';
import { atMd } from '@/features/survey';
import type { Formation } from '../model/types';
import { formationAt } from './formationAt';
import {
  blendLithologyColor,
  DEFAULT_LITHOLOGY_COLOR,
  formatCompSummary,
  type ColorRgb,
} from './lithologyColors';

export interface SleevePoint {
  md: number;
  tvd: number;
  n: number;
  e: number;
  scene: [number, number, number];
}

export interface SleeveSegment {
  id: string;
  formationId: string | null;
  formationName: string;
  ref: 'TVD' | 'MD' | 'none';
  color: ColorRgb;
  compSummary: string;
  startMd: number;
  endMd: number;
  startTvd: number;
  endTvd: number;
  points: SleevePoint[];
}

/** 1 scene unit = 100 ft. North is −z, east is +x, depth is −y. */
export const GEOLOGY_SCALE = 0.01;

/** Converts a survey point to 3D scene coordinates [x, y, z] (E, -TVD, -N). */
export function pointToScene(
  p: Pick<SurveyPoint, 'e' | 'tvd' | 'n'>,
  scale = GEOLOGY_SCALE,
): [number, number, number] {
  return [p.e * scale, -p.tvd * scale, -p.n * scale];
}

/**
 * Finds the exact MD where TVD equals targetTvd within a span [mdA, mdB].
 * Uses bisection search over atMd for sub-foot boundary accuracy.
 */
function findTvdCrossingMd(
  points: readonly SurveyPoint[],
  targetTvd: number,
  mdA: number,
  mdB: number,
  iterations = 10,
): number {
  let lo = mdA;
  let hi = mdB;
  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const p = atMd(points, mid);
    if (!p) break;
    const diff = p.tvd - targetTvd;
    if (Math.abs(diff) < 0.05) return mid;

    const pLo = atMd(points, lo);
    if (!pLo) break;
    if ((pLo.tvd - targetTvd) * diff <= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Partitions a trajectory into lithology sleeve segments according to configured formations.
 *
 * Pure function:
 * - Supports vertical, inclined/build, horizontal, and multilateral well trajectories.
 * - Handles TVD formation intervals and well-specific MD overrides seamlessly.
 * - Ensures adjacent segments share their boundary transition point for gapless 3D tubes.
 * - Accurately incorporates multiple lithology fractions via blended RGB colors.
 */
export function computeSleeveSegments(
  points: readonly SurveyPoint[],
  wellName: string,
  formations: readonly Formation[],
  stepFt = 30,
): SleeveSegment[] {
  if (points.length < 2) return [];

  const minMd = points[0]!.md;
  const maxMd = points.at(-1)!.md;
  if (maxMd <= minMd) return [];

  // 1. Collect critical MD sample points: survey stations, step intervals, and formation boundaries
  const mdSet = new Set<number>();
  mdSet.add(minMd);
  mdSet.add(maxMd);

  // Existing survey stations
  for (const p of points) {
    if (p.md >= minMd && p.md <= maxMd) mdSet.add(p.md);
  }

  // Regular step sampling along the trajectory
  for (let md = minMd + stepFt; md < maxMd; md += stepFt) {
    mdSet.add(md);
  }

  // Boundary crossings for all formations
  for (const f of formations) {
    if (f.ref === 'MD' && f.well === wellName) {
      if (f.from > minMd && f.from < maxMd) mdSet.add(f.from);
      if (f.to > minMd && f.to < maxMd) mdSet.add(f.to);
    } else if (f.ref === 'TVD') {
      const targets = [f.from, f.to];
      for (const targetTvd of targets) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i]!;
          const p2 = points[i + 1]!;
          const minT = Math.min(p1.tvd, p2.tvd);
          const maxT = Math.max(p1.tvd, p2.tvd);
          if (targetTvd >= minT && targetTvd <= maxT && maxT - minT > 0.01) {
            const crossingMd = findTvdCrossingMd(points, targetTvd, p1.md, p2.md);
            if (crossingMd > minMd && crossingMd < maxMd) {
              mdSet.add(crossingMd);
            }
          }
        }
      }
    }
  }

  // Sort and deduplicate MDs
  const sortedMds = Array.from(mdSet).sort((a, b) => a - b);
  const cleanMds: number[] = [];
  for (let i = 0; i < sortedMds.length; i++) {
    const cur = sortedMds[i]!;
    const prev = cleanMds.at(-1);
    if (prev === undefined || Math.abs(cur - prev) > 0.1) {
      cleanMds.push(cur);
    }
  }

  // 2. Sample survey points and evaluate formationAt at each point
  interface Sample {
    point: SleevePoint;
    formation: Formation | null;
  }

  const samples: Sample[] = [];
  for (const md of cleanMds) {
    const p = atMd(points, md);
    if (!p) continue;
    const f = formationAt(formations, wellName, p.md, p.tvd);
    samples.push({
      point: {
        md: p.md,
        tvd: p.tvd,
        n: p.n,
        e: p.e,
        scene: pointToScene(p),
      },
      formation: f,
    });
  }

  if (samples.length < 2) return [];

  // 3. Group contiguous samples into distinct formation segments
  const segments: SleeveSegment[] = [];
  let currentGroup: Sample[] = [samples[0]!];
  let currentF = samples[0]!.formation;

  const pushCurrentGroup = () => {
    if (currentGroup.length < 1) return;
    const first = currentGroup[0]!;
    const last = currentGroup.at(-1)!;
    const f = currentF;

    segments.push({
      id: `${wellName}-${segments.length}-${f ? f.id : 'unmapped'}`,
      formationId: f ? f.id : null,
      formationName: f ? f.name : 'Unmapped',
      ref: f ? f.ref : 'none',
      color: f ? blendLithologyColor(f.comp) : DEFAULT_LITHOLOGY_COLOR,
      compSummary: f ? formatCompSummary(f) : 'Undifferentiated',
      startMd: first.point.md,
      endMd: last.point.md,
      startTvd: first.point.tvd,
      endTvd: last.point.tvd,
      points: currentGroup.map((s) => s.point),
    });
  };

  for (let i = 1; i < samples.length; i++) {
    const cur = samples[i]!;
    const f = cur.formation;

    // Check if the formation changed
    const changed = (f?.id ?? null) !== (currentF?.id ?? null);
    if (changed) {
      // Include the boundary point in the ending group for continuity
      currentGroup.push(cur);
      pushCurrentGroup();

      // Start the new group, also starting with the boundary point
      currentGroup = [cur];
      currentF = f;
    } else {
      currentGroup.push(cur);
    }
  }

  // Final group
  pushCurrentGroup();

  return segments;
}
