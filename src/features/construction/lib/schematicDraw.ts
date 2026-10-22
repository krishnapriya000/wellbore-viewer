import { formatNumber, toDisplay } from '@/shared/units/units';
import type { ConstructionItem } from '../model/types';
import { checkItem, itemsFor } from './rules';

export interface SchematicTick {
  depthFt: number;
  depthDisplay: number;
  label: string;
  isMajor: boolean;
}

export interface SchematicCallout {
  id: string;
  itemId: string;
  kind: 'hole' | 'casing' | 'cement';
  sizeInches: number;
  fromFt: number;
  toFt: number;
  targetY: number;
  adjustedY: number;
  featureX: number;
  title: string;
  subtitle: string;
  hasWarnings: boolean;
  warnings: string[];
}

export interface SchematicDrawOptions {
  width: number;
  height: number;
  dpr: number;
  items: readonly ConstructionItem[];
  wellName: string;
  unit: 'ft' | 'm';
  theme: 'light' | 'dark';
}

/**
 * Computes appropriate depth ticks for the vertical schematic ruler.
 */
export function computeSchematicTicks(
  minDepthFt: number,
  maxDepthFt: number,
  unit: 'ft' | 'm',
): SchematicTick[] {
  const spanFt = Math.max(100, maxDepthFt - minDepthFt);
  const spanDisplay = toDisplay(spanFt, unit);

  // Choose clean step in display units
  let stepDisplay: number;
  if (spanDisplay <= 500) stepDisplay = 100;
  else if (spanDisplay <= 1500) stepDisplay = 250;
  else if (spanDisplay <= 4000) stepDisplay = 500;
  else if (spanDisplay <= 10000) stepDisplay = 1000;
  else stepDisplay = 2000;

  const minDisplay = toDisplay(minDepthFt, unit);
  const maxDisplay = toDisplay(maxDepthFt, unit);

  const startTick = Math.ceil(minDisplay / stepDisplay) * stepDisplay;
  const ticks: SchematicTick[] = [];

  for (let d = startTick; d <= maxDisplay; d += stepDisplay) {
    const depthFt = unit === 'm' ? d / 0.3048 : d;
    ticks.push({
      depthFt,
      depthDisplay: d,
      label: formatNumber(d, 0),
      isMajor: d % (stepDisplay * 2) === 0 || d === 0,
    });
  }

  return ticks;
}

/**
 * Maps diameter in inches to a balanced visual half-width in canvas pixels.
 * Monotonic: larger sizes strictly produce larger half-widths.
 */
export function computeHalfWidthPx(sizeInches: number): number {
  const clamped = Math.max(1, Math.min(48, sizeInches));
  // 1" -> 11px, 7" -> 16.5px, 9.625" -> 19px, 13.375" -> 22.5px, 17.5" -> 26.5px, 30" -> 38px
  return 10 + (clamped / 36) * 34;
}

/**
 * Calculates collision-free vertical positions for callout labels.
 */
export function layoutCallouts(
  callouts: SchematicCallout[],
  minY: number,
  maxY: number,
  minSpacing = 28,
): SchematicCallout[] {
  if (callouts.length === 0) return [];

  // Sort by natural target depth
  const sorted = [...callouts].sort((a, b) => a.targetY - b.targetY);

  // Forward relaxation push-down
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i]!;
    if (i === 0) {
      curr.adjustedY = Math.max(minY, curr.targetY);
    } else {
      const prev = sorted[i - 1]!;
      curr.adjustedY = Math.max(curr.targetY, prev.adjustedY + minSpacing);
    }
  }

  // Backward compression if exceeding bottom
  const last = sorted.at(-1)!;
  if (last.adjustedY > maxY) {
    last.adjustedY = maxY;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const curr = sorted[i]!;
      const next = sorted[i + 1]!;
      if (curr.adjustedY > next.adjustedY - minSpacing) {
        curr.adjustedY = next.adjustedY - minSpacing;
      }
    }
  }

  return sorted;
}

/**
 * Draws the 2D Well Construction Schematic onto the provided HTML5 Canvas.
 */
export function drawSchematic(ctx: CanvasRenderingContext2D, options: SchematicDrawOptions): void {
  const { width, height, dpr, items, wellName, unit, theme } = options;

  ctx.save();
  ctx.scale(dpr, dpr);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#141a23' : '#f8fafc';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';
  const mutedTextColor = isDark ? '#94a3b8' : '#64748b';
  const rulerLineColor = isDark ? '#334155' : '#cbd5e1';
  const centerlineColor = isDark ? '#475569' : '#94a3b8';
  const warningColor = '#ef4444';

  // 1. Clear background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Filter applicable items for this well
  const wellItems = itemsFor(items, wellName);

  if (wellItems.length === 0) {
    // Empty state
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = mutedTextColor;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('No construction items defined for this well', width / 2, height / 2 - 10);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(
      'Add hole sections, casing strings, or cement in the editor',
      width / 2,
      height / 2 + 14,
    );
    ctx.restore();
    return;
  }

  // 2. Geometry boundaries and scales
  const maxDepthFt = Math.max(1000, ...wellItems.map((i) => i.to)) * 1.05;
  const minDepthFt = 0;

  const marginTop = 42;
  const marginBottom = 28;
  const marginLeft = 62;
  const plotH = height - marginTop - marginBottom;

  const depthToY = (md: number) =>
    marginTop + ((md - minDepthFt) / (maxDepthFt - minDepthFt)) * plotH;

  // Centerline X positioned to leave room for left depth axis and right callout column
  const wellboreMaxHw = 44;
  const centerlineX = marginLeft + wellboreMaxHw + 24;
  const calloutStartX = centerlineX + wellboreMaxHw + 32;

  // 3. Draw Depth Axis & Ticks
  const ticks = computeSchematicTicks(minDepthFt, maxDepthFt, unit);

  ctx.strokeStyle = rulerLineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(marginLeft, marginTop);
  ctx.lineTo(marginLeft, marginTop + plotH);
  ctx.stroke();

  // Axis Title
  ctx.fillStyle = mutedTextColor;
  ctx.font = '10px var(--font-mono, monospace)';
  ctx.textAlign = 'right';
  ctx.fillText(`MD (${unit})`, marginLeft - 8, marginTop - 12);

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const t of ticks) {
    const y = depthToY(t.depthFt);
    if (y < marginTop || y > marginTop + plotH) continue;

    ctx.strokeStyle = rulerLineColor;
    ctx.beginPath();
    ctx.moveTo(marginLeft - (t.isMajor ? 8 : 4), y);
    ctx.lineTo(marginLeft, y);
    ctx.stroke();

    ctx.fillStyle = t.isMajor ? textColor : mutedTextColor;
    ctx.font = t.isMajor ? '11px var(--font-mono, monospace)' : '10px var(--font-mono, monospace)';
    ctx.fillText(t.label, marginLeft - 12, y);

    // Subtle horizontal depth grid guide
    ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.35)' : 'rgba(203, 213, 225, 0.45)';
    ctx.beginPath();
    ctx.moveTo(marginLeft, y);
    ctx.lineTo(centerlineX - wellboreMaxHw - 12, y);
    ctx.stroke();
  }

  // 4. Centerline
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = centerlineColor;
  ctx.beginPath();
  ctx.moveTo(centerlineX, marginTop);
  ctx.lineTo(centerlineX, marginTop + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // 5. Draw Hole Sections (outermost boundary)
  const holeItems = wellItems.filter((i) => i.kind === 'hole');
  for (const h of holeItems) {
    const y1 = depthToY(h.from);
    const y2 = depthToY(h.to);
    const hw = computeHalfWidthPx(h.size);

    // Drilled borehole fill
    ctx.fillStyle = isDark ? 'rgba(74, 85, 104, 0.22)' : 'rgba(226, 232, 240, 0.5)';
    ctx.fillRect(centerlineX - hw, y1, hw * 2, y2 - y1);

    // Borehole rock walls
    ctx.strokeStyle = isDark ? '#475569' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Left rock wall
    ctx.moveTo(centerlineX - hw, y1);
    ctx.lineTo(centerlineX - hw, y2);
    // Right rock wall
    ctx.moveTo(centerlineX + hw, y1);
    ctx.lineTo(centerlineX + hw, y2);
    // Hole bottom face
    ctx.lineTo(centerlineX - hw, y2);
    ctx.stroke();

    // Subtle geological hatch ticks outside hole wall
    const hatchStep = 18;
    ctx.strokeStyle = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 1;
    for (let hy = y1 + 8; hy < y2; hy += hatchStep) {
      // Left hatch
      ctx.beginPath();
      ctx.moveTo(centerlineX - hw, hy);
      ctx.lineTo(centerlineX - hw - 4, hy - 4);
      ctx.stroke();
      // Right hatch
      ctx.beginPath();
      ctx.moveTo(centerlineX + hw, hy);
      ctx.lineTo(centerlineX + hw + 4, hy - 4);
      ctx.stroke();
    }
  }

  // 6. Draw Cement Annular Coverage
  const cementItems = wellItems.filter((i) => i.kind === 'cement');
  for (const c of cementItems) {
    const y1 = depthToY(c.from);
    const y2 = depthToY(c.to);
    const csgHw = computeHalfWidthPx(c.size);
    const cmtOuterHw = csgHw + 5.5;

    // Left and right annular cement fill
    ctx.fillStyle = isDark ? '#64748b' : '#cbd5e1';
    ctx.fillRect(centerlineX - cmtOuterHw, y1, cmtOuterHw - csgHw, y2 - y1);
    ctx.fillRect(centerlineX + csgHw, y1, cmtOuterHw - csgHw, y2 - y1);

    // Stipple dots representing cured cement aggregate
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    for (let cy = y1 + 6; cy < y2; cy += 12) {
      ctx.fillRect(centerlineX - cmtOuterHw + 2, cy, 1.5, 1.5);
      ctx.fillRect(centerlineX + csgHw + 2, cy + 4, 1.5, 1.5);
    }
  }

  // 7. Draw Casing Strings & Casing Shoes
  const casingItems = wellItems.filter((i) => i.kind === 'casing');
  const rawCallouts: SchematicCallout[] = [];

  for (const c of casingItems) {
    const y1 = depthToY(c.from);
    const y2 = depthToY(c.to);
    const hw = computeHalfWidthPx(c.size);
    const warnings = checkItem(items, c, wellName);
    const hasWarnings = warnings.length > 0;

    const pipeColor = hasWarnings ? warningColor : isDark ? '#e2e8f0' : '#1e293b';

    // Casing pipe walls
    ctx.strokeStyle = pipeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(centerlineX - hw, y1);
    ctx.lineTo(centerlineX - hw, y2);
    ctx.moveTo(centerlineX + hw, y1);
    ctx.lineTo(centerlineX + hw, y2);
    ctx.stroke();

    // Casing Shoe (outward beveled triangular notches)
    const shoeColor = hasWarnings ? warningColor : '#f59e0b';
    const shoeSize = 5;

    ctx.fillStyle = shoeColor;
    ctx.beginPath();
    // Left shoe triangle
    ctx.moveTo(centerlineX - hw, y2);
    ctx.lineTo(centerlineX - hw - shoeSize, y2 - shoeSize);
    ctx.lineTo(centerlineX - hw, y2 - shoeSize);
    ctx.closePath();
    ctx.fill();

    // Right shoe triangle
    ctx.beginPath();
    ctx.moveTo(centerlineX + hw, y2);
    ctx.lineTo(centerlineX + hw + shoeSize, y2 - shoeSize);
    ctx.lineTo(centerlineX + hw, y2 - shoeSize);
    ctx.closePath();
    ctx.fill();

    const depthDisp = formatNumber(toDisplay(c.to, unit), 0);
    const fromDisp = formatNumber(toDisplay(c.from, unit), 0);

    rawCallouts.push({
      id: `csg-${c.id}`,
      itemId: c.id,
      kind: 'casing',
      sizeInches: c.size,
      fromFt: c.from,
      toFt: c.to,
      targetY: y2,
      adjustedY: y2,
      featureX: centerlineX + hw + shoeSize,
      title: `${c.size}" Casing Shoe`,
      subtitle: `@ ${depthDisp} ${unit} (${fromDisp} – ${depthDisp})`,
      hasWarnings,
      warnings,
    });
  }

  // Add callouts for hole section bottoms
  for (const h of holeItems) {
    const y2 = depthToY(h.to);
    const hw = computeHalfWidthPx(h.size);
    const depthDisp = formatNumber(toDisplay(h.to, unit), 0);
    const fromDisp = formatNumber(toDisplay(h.from, unit), 0);

    rawCallouts.push({
      id: `hole-${h.id}`,
      itemId: h.id,
      kind: 'hole',
      sizeInches: h.size,
      fromFt: h.from,
      toFt: h.to,
      targetY: y2,
      adjustedY: y2,
      featureX: centerlineX + hw,
      title: `${h.size}" Hole Section`,
      subtitle: `${fromDisp} – ${depthDisp} ${unit}`,
      hasWarnings: false,
      warnings: [],
    });
  }

  // Add callouts for cement intervals (if not overlapping exactly with casing)
  for (const cmt of cementItems) {
    const yMid = depthToY((cmt.from + cmt.to) / 2);
    const hw = computeHalfWidthPx(cmt.size) + 6;
    const fromDisp = formatNumber(toDisplay(cmt.from, unit), 0);
    const toDisp = formatNumber(toDisplay(cmt.to, unit), 0);
    const warnings = checkItem(items, cmt, wellName);

    rawCallouts.push({
      id: `cmt-${cmt.id}`,
      itemId: cmt.id,
      kind: 'cement',
      sizeInches: cmt.size,
      fromFt: cmt.from,
      toFt: cmt.to,
      targetY: yMid,
      adjustedY: yMid,
      featureX: centerlineX + hw,
      title: `${cmt.size}" Cement Sheath`,
      subtitle: `${fromDisp} – ${toDisp} ${unit}`,
      hasWarnings: warnings.length > 0,
      warnings,
    });
  }

  // 8. Layout and Draw Callout Labels with collision avoidance
  const placedCallouts = layoutCallouts(
    rawCallouts,
    marginTop + 12,
    marginTop + plotH - 12,
    26,
  );

  for (const c of placedCallouts) {
    const targetY = c.targetY;
    const calloutY = c.adjustedY;

    // Leader line with elbow
    ctx.strokeStyle = c.hasWarnings ? warningColor : rulerLineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.featureX, targetY);
    ctx.lineTo(calloutStartX - 10, calloutY);
    ctx.lineTo(calloutStartX - 2, calloutY);
    ctx.stroke();

    // Small leader anchor dot
    ctx.fillStyle = c.hasWarnings ? warningColor : rulerLineColor;
    ctx.beginPath();
    ctx.arc(c.featureX, targetY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Title label
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = c.hasWarnings ? warningColor : textColor;
    ctx.fillText(c.title, calloutStartX, calloutY - 2);

    // Warning emoji indicator
    if (c.hasWarnings) {
      const titleWidth = ctx.measureText(c.title).width;
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(' ⚠️', calloutStartX + titleWidth, calloutY - 2);
    }

    // Subtitle (depth interval)
    ctx.textBaseline = 'top';
    ctx.font = '10px var(--font-mono, monospace)';
    ctx.fillStyle = c.hasWarnings ? '#f87171' : mutedTextColor;
    ctx.fillText(c.subtitle, calloutStartX, calloutY + 2);
  }

  ctx.restore();
}
