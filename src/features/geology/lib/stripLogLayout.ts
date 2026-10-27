import type { SurveyPoint } from '@/features/survey';
import type { DepthUnit } from '@/shared/units/units';
import { formatNumber, toDisplay } from '@/shared/units/units';
import type { Formation, Lithology } from '../model/types';
import {
  blendLithologyColor,
  formatCompSummary,
  type ColorRgb,
} from './lithologyColors';
import { computeSleeveSegments } from './sleevePath';

export interface StripLogInterval {
  id: string;
  name: string;
  ref: 'TVD' | 'MD';
  well: string;
  fromFt: number;
  toFt: number;
  thicknessFt: number;
  color: ColorRgb;
  comp: readonly { lith: Lithology; pct: number }[];
  compSummary: string;
  isOverride: boolean;
}

export interface DepthTick {
  depthFt: number;
  depthDisplay: number;
  label: string;
}

/**
 * Computes TVD stratigraphic intervals for the field-wide strip log.
 * Formations are sorted by depth. Invalid intervals (to <= from) are skipped.
 */
export function computeTvdIntervals(formations: readonly Formation[]): StripLogInterval[] {
  const tvdFormations = formations
    .filter((f) => f.ref === 'TVD' && f.to > f.from && f.visible !== false)
    .sort((a, b) => a.from - b.from);

  return tvdFormations.map((f) => ({
    id: f.id,
    name: f.name,
    ref: 'TVD',
    well: f.well,
    fromFt: f.from,
    toFt: f.to,
    thicknessFt: f.to - f.from,
    color: blendLithologyColor(f.comp),
    comp: f.comp,
    compSummary: formatCompSummary(f),
    isOverride: false,
  }));
}

/**
 * Computes Measured Depth (MD) intervals along a specific wellbore trajectory.
 * Incorporates both regional TVD stratigraphy and well-specific MD overrides via formationAt.
 */
export function computeMdIntervals(
  formations: readonly Formation[],
  wellName: string,
  points: readonly SurveyPoint[],
): StripLogInterval[] {
  if (points.length < 2) {
    // Fallback: If no survey points are loaded yet, display MD formations configured for this well
    const wellMdFormations = formations
      .filter((f) => f.ref === 'MD' && f.well === wellName && f.to > f.from && f.visible !== false)
      .sort((a, b) => a.from - b.from);

    return wellMdFormations.map((f) => ({
      id: f.id,
      name: f.name,
      ref: 'MD',
      well: f.well,
      fromFt: f.from,
      toFt: f.to,
      thicknessFt: f.to - f.from,
      color: blendLithologyColor(f.comp),
      comp: f.comp,
      compSummary: formatCompSummary(f),
      isOverride: true,
    }));
  }

  // Segment trajectory along MD using pure domain sleevePath calculator
  const segments = computeSleeveSegments(points, wellName, formations);

  return segments.map((seg) => ({
    id: seg.id,
    name: seg.formationName,
    ref: seg.ref === 'MD' ? 'MD' : 'TVD',
    well: wellName,
    fromFt: seg.startMd,
    toFt: seg.endMd,
    thicknessFt: Math.max(0, seg.endMd - seg.startMd),
    color: seg.color,
    comp: seg.formationId ? (formations.find((f) => f.id === seg.formationId)?.comp ?? []) : [],
    compSummary: seg.compSummary,
    isOverride: seg.ref === 'MD',
  }));
}

/**
 * Computes nice rounded depth ticks for the strip log scale axis.
 * Ticks are calculated based on the active unit (ft or m).
 */
export function computeStripLogTicks(
  minDepthFt: number,
  maxDepthFt: number,
  unit: DepthUnit,
): DepthTick[] {
  if (maxDepthFt <= minDepthFt) return [];

  const minDisplay = toDisplay(minDepthFt, unit);
  const maxDisplay = toDisplay(maxDepthFt, unit);
  const rangeDisplay = maxDisplay - minDisplay;

  // Pick sensible tick intervals in display units
  const candidateSteps = unit === 'm' ? [50, 100, 200, 500, 1000] : [100, 250, 500, 1000, 2000];
  let step = candidateSteps[0]!;
  for (const s of candidateSteps) {
    if (rangeDisplay / s <= 8) {
      step = s;
      break;
    }
  }

  const firstTick = Math.ceil(minDisplay / step) * step;
  const ticks: DepthTick[] = [];

  for (let d = firstTick; d <= maxDisplay; d += step) {
    // Convert display value back to feet for positioning
    const depthFt = unit === 'm' ? d / 0.3048 : d;
    ticks.push({
      depthFt,
      depthDisplay: d,
      label: formatNumber(d, 0),
    });
  }

  return ticks;
}

/**
 * Derives overall min and max depth for a set of intervals.
 */
export function getIntervalsDepthRange(intervals: readonly StripLogInterval[]): {
  minDepthFt: number;
  maxDepthFt: number;
} {
  if (!intervals.length) return { minDepthFt: 0, maxDepthFt: 5000 };

  let min = intervals[0]!.fromFt;
  let max = intervals[0]!.toFt;

  for (const item of intervals) {
    if (item.fromFt < min) min = item.fromFt;
    if (item.toFt > max) max = item.toFt;
  }

  return { minDepthFt: Math.min(0, min), maxDepthFt: Math.max(1000, max) };
}
