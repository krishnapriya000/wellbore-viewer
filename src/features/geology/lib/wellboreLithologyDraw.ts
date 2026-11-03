import { atMd, densify, type SurveyPoint } from '@/features/survey';
import type { DepthUnit } from '@/shared/units/units';
import { formatNumber, toDisplay } from '@/shared/units/units';
import type { Formation, Lithology } from '../model/types';
import { formationAt } from './formationAt';
import { LITHOLOGY_COLORS } from './lithologyColors';
import { getLithologyTileCanvas } from './lithologyPatterns';

export interface WellboreLithologyDrawColors {
  ink?: string;
  muted?: string;
  line?: string;
  actual?: string;
  surface?: string;
  surface2?: string;
}

export interface WellboreLithologyDrawOptions {
  width: number;
  height: number;
  dpr: number;
  wellName: string;
  planPoints: readonly SurveyPoint[];
  actualPoints: readonly SurveyPoint[];
  currentMd: number;
  formations: readonly Formation[];
  unit: DepthUnit;
  theme?: 'light' | 'dark';
  colors?: WellboreLithologyDrawColors;
}

/**
 * Draws the horizontal "Lithology along the wellbore" dual-strip log:
 * - Top band follows the plan trajectory
 * - Bottom band shows what the bit has drilled so far along the actual wellbore
 * - Horizontal MD axis with tick marks and corresponding TVD values beneath
 * - Real-time bit needle indicator with downward triangle marker
 *
 * Faithfully matches the reference HTML implementation.
 */
export function drawWellboreLithology(
  ctx: CanvasRenderingContext2D,
  options: WellboreLithologyDrawOptions,
): void {
  const {
    width,
    height,
    dpr,
    wellName,
    planPoints,
    actualPoints,
    currentMd,
    formations,
    unit,
    theme = 'light',
    colors = {},
  } = options;

  if (width <= 0 || height <= 0) return;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const isDark = theme === 'dark';
  const cInk = colors.ink ?? (isDark ? '#e0e8e5' : '#172220');
  const cMuted = colors.muted ?? (isDark ? '#90a09b' : '#586662');
  const cLine = colors.line ?? (isDark ? '#2b3735' : '#c9d2cf');
  const cActual = colors.actual ?? (isDark ? '#7fa6ff' : '#1f4fd1');
  const cSurface = colors.surface ?? (isDark ? '#162020' : '#f7f9f8');

  const left = 52;
  const right = Math.max(left + 50, width - 24);
  const top1 = 14;
  const bh = 30;
  const top2 = top1 + bh + 10; // 54
  const axisY = top2 + bh + 6; // 90

  // Track labels on the left margin
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = cMuted;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('PLAN', 6, top1 + bh / 2);
  ctx.fillText('ACTUAL', 6, top2 + bh / 2);

  // Background for both horizontal bands
  ctx.fillStyle = cSurface;
  ctx.fillRect(left, top1, right - left, bh);
  ctx.fillRect(left, top2, right - left, bh);

  // Use actual survey stations if available; fall back to planned stations if drilling against plan
  const effectiveActual = actualPoints.length >= 2 ? actualPoints : planPoints;
  const maxPlanMd = planPoints.at(-1)?.md ?? 0;
  const maxActualMd = effectiveActual.at(-1)?.md ?? 0;
  const td = Math.max(maxPlanMd, maxActualMd);

  const X = (md: number): number => {
    if (td <= 0) return left;
    return left + ((right - left) * Math.max(0, md)) / td;
  };

  const patternCache = new Map<string, CanvasPattern | null>();
  const getPattern = (lith: Lithology, baseColor: string): CanvasPattern | null => {
    const key = `${lith}_${baseColor}`;
    if (patternCache.has(key)) return patternCache.get(key) ?? null;
    const tile = getLithologyTileCanvas(lith, 16, baseColor);
    let pat: CanvasPattern | null = null;
    if (tile && typeof ctx.createPattern === 'function') {
      try {
        pat = ctx.createPattern(tile, 'repeat');
      } catch {
        pat = null;
      }
    }
    patternCache.set(key, pat);
    return pat;
  };

  const drawBand = (dense: readonly SurveyPoint[], y: number) => {
    if (dense.length < 2) return;
    for (let i = 1; i < dense.length; i++) {
      const a = dense[i - 1]!;
      const b = dense[i]!;
      const midMd = (a.md + b.md) / 2;
      const midTvd = (a.tvd + b.tvd) / 2;
      const f = formationAt(formations, wellName, midMd, midTvd);
      const x1 = X(a.md);
      const x2 = X(b.md);
      const segW = Math.max(1, x2 - x1 + 0.6);

      if (f && f.comp.length > 0) {
        const lith = f.comp[0]!.lith;
        const baseColor = f.color ?? LITHOLOGY_COLORS[lith]?.hex ?? '#cccccc';
        const pat = getPattern(lith, baseColor);
        ctx.fillStyle = pat ?? baseColor;
      } else {
        ctx.fillStyle = cSurface;
      }
      ctx.fillRect(x1, y, segW, bh);
    }
  };

  // Top band: Plan trajectory
  if (planPoints.length > 1) {
    const densePlan = densify(planPoints);
    drawBand(densePlan, top1);
  }

  // Bottom band: Actual drilled trajectory up to currentMd
  if (effectiveActual.length > 0 && currentMd > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top2, Math.max(0, X(currentMd) - left), bh);
    ctx.clip();

    const tip = atMd(effectiveActual, currentMd);
    const beforeStations = effectiveActual.filter((s) => s.md < currentMd);
    const drilledStations = tip ? [...beforeStations, tip] : [...beforeStations];

    if (drilledStations.length >= 2) {
      const denseActual = densify(drilledStations);
      drawBand(denseActual, top2);
    } else if (drilledStations.length === 1 && tip) {
      // Very start of hole before second survey station
      const startPt: SurveyPoint = {
        md: 0,
        inc: tip.inc,
        azi: tip.azi,
        tvd: 0,
        n: 0,
        e: 0,
        dls: 0,
        beta: 0,
      };
      drawBand([startPt, tip], top2);
    }

    ctx.restore();
  }

  // Band border strokes
  ctx.strokeStyle = cLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top1 + 0.5, right - left - 1, bh - 1);
  ctx.strokeRect(left + 0.5, top2 + 0.5, right - left - 1, bh - 1);

  // MD & TVD scale axis
  ctx.strokeStyle = cMuted;
  ctx.beginPath();
  ctx.moveTo(left, axisY);
  ctx.lineTo(right, axisY);
  ctx.stroke();

  if (td > 0) {
    const span = right - left;
    const rawStep = span < 260 ? 5000 : span < 420 ? 3000 : 2000;
    const step = unit === 'm' ? Math.round((rawStep * 0.3048) / 500) * 500 || 500 : rawStep;
    const stepFt = unit === 'm' ? step / 0.3048 : step;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';

    for (let md = 0; md <= td + 1; md += stepFt) {
      const x = X(md);

      // Tick mark
      ctx.strokeStyle = cMuted;
      ctx.beginPath();
      ctx.moveTo(x, axisY);
      ctx.lineTo(x, axisY + 4);
      ctx.stroke();

      // MD label
      ctx.fillStyle = cInk;
      ctx.fillText(formatNumber(toDisplay(md, unit), 0), x, axisY + 13);

      // TVD label beneath
      const drilled = currentMd > 0 && md <= currentMd;
      const srcPoints =
        drilled && effectiveActual.length >= 2
          ? effectiveActual
          : planPoints.length >= 2
            ? planPoints
            : effectiveActual;
      const p = atMd(srcPoints, md);

      ctx.fillStyle = drilled ? cActual : cMuted;
      ctx.fillText(p ? formatNumber(toDisplay(p.tvd, unit), 0) : '—', x, axisY + 27);
    }
  }

  // Axis legends on the left margin
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = cMuted;
  ctx.font = '600 10px system-ui, -apple-system, sans-serif';
  ctx.fillText(`MD ${unit}`, 6, axisY + 13);
  ctx.fillText(`TVD ${unit}`, 6, axisY + 27);

  // Live Drill Bit Indicator (vertical needle and downward-pointing arrow)
  if (currentMd >= 0 && td > 0) {
    const tipMd = Math.min(Math.max(0, currentMd), td);
    const tipX = X(tipMd);

    ctx.strokeStyle = cActual;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tipX, top1 - 6);
    ctx.lineTo(tipX, top2 + bh + 2);
    ctx.stroke();

    ctx.fillStyle = cActual;
    ctx.beginPath();
    ctx.moveTo(tipX - 5, top1 - 10);
    ctx.lineTo(tipX + 5, top1 - 10);
    ctx.lineTo(tipX, top1 - 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
