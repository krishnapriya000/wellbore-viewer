import type { DepthUnit } from '@/shared/units/units';
import { formatNumber, toDisplay } from '@/shared/units/units';
import type { Lithology } from '../model/types';
import { LITHOLOGY_COLORS } from './lithologyColors';
import type { DepthTick, StripLogInterval } from './stripLogLayout';

export interface StripLogDrawOptions {
  width: number;
  height: number;
  dpr: number;
  intervals: readonly StripLogInterval[];
  ticks: readonly DepthTick[];
  minDepthFt: number;
  maxDepthFt: number;
  unit: DepthUnit;
  theme: 'light' | 'dark';
  modeTitle: string;
}

/** Draws standard geological hatch patterns on a rectangle */
function drawLithologyHatch(
  ctx: CanvasRenderingContext2D,
  lith: Lithology,
  x: number,
  y: number,
  w: number,
  h: number,
  strokeColor: string,
) {
  if (w <= 0 || h <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 1;

  switch (lith) {
    case 'sandstone': {
      // Stippling dot pattern
      const spacing = 10;
      for (let px = x + 4; px < x + w; px += spacing) {
        for (let py = y + 4; py < y + h; py += spacing) {
          const jitterX = ((py * 13) % 4) - 2;
          const jitterY = ((px * 17) % 4) - 2;
          ctx.beginPath();
          ctx.arc(px + jitterX, py + jitterY, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'shale': {
      // Horizontal dashed lines
      const stepY = 8;
      for (let py = y + 4; py < y + h; py += stepY) {
        ctx.beginPath();
        ctx.setLineDash([8, 6]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      break;
    }
    case 'limestone': {
      // Brick pattern
      const rowH = 10;
      const colW = 20;
      let row = 0;
      for (let py = y; py < y + h; py += rowH) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();

        const offset = (row % 2) * (colW / 2);
        for (let px = x + offset; px < x + w; px += colW) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, Math.min(y + h, py + rowH));
          ctx.stroke();
        }
        row++;
      }
      break;
    }
    case 'dolomite': {
      // Slanted / diagonal brick pattern
      const rowH = 10;
      const colW = 20;
      let row = 0;
      for (let py = y; py < y + h; py += rowH) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();

        const offset = (row % 2) * (colW / 2);
        for (let px = x + offset; px < x + w; px += colW) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + 4, Math.min(y + h, py + rowH));
          ctx.stroke();
        }
        row++;
      }
      break;
    }
    case 'siltstone': {
      // Alternating fine dots and short dashes
      const stepY = 7;
      for (let py = y + 3; py < y + h; py += stepY) {
        ctx.beginPath();
        ctx.setLineDash([4, 4, 1, 4]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      break;
    }
    case 'coal': {
      // Dense horizontal lines
      const stepY = 5;
      for (let py = y + 2; py < y + h; py += stepY) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      break;
    }
    case 'anhydrite': {
      // Diagonal diamond / peg pattern
      const step = 12;
      for (let px = x - h; px < x + w; px += step) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(px, y);
        ctx.lineTo(px + h, y + h);
        ctx.stroke();
      }
      break;
    }
    case 'conglomerate': {
      // Pebble / circle shapes
      const spacing = 14;
      for (let px = x + 7; px < x + w; px += spacing) {
        for (let py = y + 7; py < y + h; py += spacing) {
          ctx.beginPath();
          ctx.ellipse(px, py, 4, 3, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;
    }
    default: {
      // Default subtle crosshatch
      const step = 14;
      for (let px = x - h; px < x + w; px += step) {
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(px, y);
        ctx.lineTo(px + h, y + h);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws the 2D Geological Strip Log onto a canvas.
 *
 * Layout tracks:
 * - [0 .. colScaleEnd]: Depth scale track with ticks and values in active unit.
 * - [colScaleEnd .. colLithoEnd]: Lithology strip column with proportional multi-fraction bars & patterns.
 * - [colLithoEnd .. width]: Formation name, depth interval, and composition details.
 */
export function drawStripLog(ctx: CanvasRenderingContext2D, options: StripLogDrawOptions): void {
  const {
    width,
    height,
    dpr,
    intervals,
    ticks,
    minDepthFt,
    maxDepthFt,
    unit,
    theme,
    modeTitle,
  } = options;

  ctx.save();
  ctx.scale(dpr, dpr);

  // Palette based on theme
  const isDark = theme === 'dark';
  const cBg = isDark ? '#141820' : '#f8fafc';
  const cLine = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
  const cTextPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const cTextMuted = isDark ? '#94a3b8' : '#64748b';
  const cHeaderBg = isDark ? 'rgba(30, 41, 59, 0.75)' : 'rgba(241, 245, 249, 0.9)';
  const cHatch = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
  const cOverrideBorder = '#f59e0b';

  // Clear canvas
  ctx.fillStyle = cBg;
  ctx.fillRect(0, 0, width, height);

  // Top header layout
  const headerH = 34;
  const colScaleW = 60;
  const colLithoW = Math.min(120, Math.max(70, Math.round(width * 0.28)));
  const xScale = colScaleW;
  const xLitho = xScale + colLithoW;

  const plotTop = headerH;
  const plotBottom = height - 12;
  const plotH = Math.max(10, plotBottom - plotTop);

  const depthSpan = Math.max(1, maxDepthFt - minDepthFt);
  const depthToY = (depthFt: number) => {
    const fraction = (depthFt - minDepthFt) / depthSpan;
    return plotTop + fraction * plotH;
  };

  // 1. Draw Track Headers
  ctx.fillStyle = cHeaderBg;
  ctx.fillRect(0, 0, width, headerH);
  ctx.fillStyle = cLine;
  ctx.fillRect(0, headerH - 1, width, 1);

  ctx.font = '600 9px monospace';
  ctx.fillStyle = cTextMuted;
  ctx.textAlign = 'center';
  ctx.fillText(`DEPTH (${unit})`, xScale / 2, 14);

  ctx.fillText('LITHOLOGY', xScale + colLithoW / 2, 14);

  ctx.textAlign = 'left';
  ctx.fillText('FORMATION & STRATA', xLitho + 12, 14);

  ctx.font = '400 8px monospace';
  ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
  ctx.fillText(modeTitle, xLitho + 12, 26);

  // 2. Draw Vertical Column Dividers
  ctx.fillStyle = cLine;
  ctx.fillRect(xScale, 0, 1, height);
  ctx.fillRect(xLitho, 0, 1, height);

  // 3. Draw Depth Scale Track (Left)
  for (const t of ticks) {
    const y = depthToY(t.depthFt);
    if (y < plotTop || y > plotBottom) continue;

    // Major tick line
    ctx.fillStyle = cLine;
    ctx.fillRect(xScale - 8, y, 8, 1);

    // Depth label
    ctx.font = '500 9px monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText(t.label, xScale - 11, y + 3);
  }

  // 4. Draw Lithology Intervals (Center) & Information (Right)
  if (!intervals.length) {
    ctx.font = '400 11px sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('No formations defined in current range', width / 2, height / 2);
    ctx.restore();
    return;
  }

  let lastLabelBottomY = plotTop - 10;

  for (const interval of intervals) {
    const y1 = Math.max(plotTop, depthToY(interval.fromFt));
    const y2 = Math.min(plotBottom, depthToY(interval.toFt));
    const intervalH = y2 - y1;
    if (intervalH <= 0.5) continue;

    // Draw proportional multi-fraction lithology columns
    const components = interval.comp.length > 0 ? interval.comp : [{ lith: 'shale' as Lithology, pct: 100 }];
    let curX = xScale + 1;
    const availableW = colLithoW - 2;

    for (let cIdx = 0; cIdx < components.length; cIdx++) {
      const comp = components[cIdx]!;
      const fracW = (comp.pct / 100) * availableW;
      const subW = cIdx === components.length - 1 ? availableW - (curX - (xScale + 1)) : fracW;

      // Fill sub-column background with component color
      const baseColor = LITHOLOGY_COLORS[comp.lith]?.hex ?? interval.color.hex;
      ctx.fillStyle = baseColor;
      ctx.fillRect(curX, y1, subW, intervalH);

      // Draw standard geological hatch pattern on top
      drawLithologyHatch(ctx, comp.lith, curX, y1, subW, intervalH, cHatch);

      curX += subW;
    }

    // Boundary border lines
    ctx.fillStyle = cLine;
    ctx.fillRect(xScale, y2, width - xScale, 1);

    // If MD override, draw highlighting border
    if (interval.isOverride) {
      ctx.strokeStyle = cOverrideBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xScale + 1, y1, colLithoW - 2, intervalH);
    }

    // 5. Draw Formation Information (Right Track)
    const labelX = xLitho + 10;
    const midY = (y1 + y2) / 2;

    // Boundary depth pills
    const fromStr = `${formatNumber(toDisplay(interval.fromFt, unit), 0)} ${unit}`;
    const toStr = `${formatNumber(toDisplay(interval.toFt, unit), 0)} ${unit}`;

    if (intervalH >= 34) {
      // Full 3-line format: Name, Depth Range, Composition
      ctx.font = '600 11px sans-serif';
      ctx.fillStyle = interval.isOverride ? cOverrideBorder : cTextPrimary;
      ctx.textAlign = 'left';
      ctx.fillText(interval.name, labelX, midY - 6);

      ctx.font = '500 9px monospace';
      ctx.fillStyle = cTextMuted;
      ctx.fillText(`${fromStr} – ${toStr}`, labelX, midY + 6);

      ctx.font = '400 8.5px monospace';
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.fillText(interval.compSummary, labelX, midY + 16);

      lastLabelBottomY = midY + 18;
    } else if (intervalH >= 18) {
      // Compact 2-line format
      ctx.font = '600 10px sans-serif';
      ctx.fillStyle = interval.isOverride ? cOverrideBorder : cTextPrimary;
      ctx.textAlign = 'left';
      ctx.fillText(interval.name, labelX, midY - 1);

      ctx.font = '500 8.5px monospace';
      ctx.fillStyle = cTextMuted;
      ctx.fillText(`${fromStr} – ${toStr}`, labelX, midY + 10);

      lastLabelBottomY = midY + 12;
    } else {
      // Ultra-thin interval callout: adjust Y if crowded
      let calloutY = midY + 3;
      if (calloutY - lastLabelBottomY < 12) {
        calloutY = lastLabelBottomY + 12;
      }
      if (calloutY < plotBottom - 4) {
        ctx.font = '600 9px sans-serif';
        ctx.fillStyle = interval.isOverride ? cOverrideBorder : cTextPrimary;
        ctx.textAlign = 'left';
        ctx.fillText(`${interval.name} (${fromStr}–${toStr})`, labelX, calloutY);
        lastLabelBottomY = calloutY;
      }
    }
  }

  // Draw bottom boundary line
  ctx.fillStyle = cLine;
  ctx.fillRect(0, plotBottom, width, 1);

  ctx.restore();
}
