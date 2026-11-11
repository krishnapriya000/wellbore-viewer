import type { DepthUnit } from '@/shared/units/units';
import { formatNumber, toDisplay } from '@/shared/units/units';
import type { Lithology } from '../model/types';
import { formatLithologyPercentageText, LITHOLOGY_COLORS } from './lithologyColors';
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

/** Wraps text into multiple lines if it exceeds maxWidth. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  font: string,
): string[] {
  if (maxWidth <= 0) return [text];
  ctx.save();
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.restore();
    return [text];
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  ctx.restore();
  return lines.length ? lines : [text];
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
      // Pebble / circle shapes (USGS 607)
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
    case 'marl': {
      // Alternating dashed shale lines with vertical tick marks (calcareous shale / marl - USGS 628)
      const stepY = 9;
      for (let py = y + 4; py < y + h; py += stepY) {
        ctx.beginPath();
        ctx.setLineDash([7, 5]);
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([]);
        for (let px = x + 6; px < x + w; px += 16) {
          ctx.moveTo(px, py - 3);
          ctx.lineTo(px, py + 3);
        }
        ctx.stroke();
      }
      break;
    }
    case 'salt': {
      // Isometric halite cross/plus lattice grid (USGS 664)
      const spacing = 12;
      for (let px = x + 6; px < x + w; px += spacing) {
        for (let py = y + 6; py < y + h; py += spacing) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(px - 3, py);
          ctx.lineTo(px + 3, py);
          ctx.moveTo(px, py - 3);
          ctx.lineTo(px, py + 3);
          ctx.stroke();
        }
      }
      break;
    }
    case 'chert': {
      // Sharp angular wedge/arrowhead triangles (USGS 657)
      const spacing = 16;
      for (let px = x + 8; px < x + w; px += spacing) {
        for (let py = y + 8; py < y + h; py += spacing) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(px - 4, py + 3);
          ctx.lineTo(px, py - 4);
          ctx.lineTo(px + 4, py + 3);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }
    case 'basement': {
      // Crystalline interlocking chevrons / herringbone 'v' ticks (USGS 701)
      const spacing = 14;
      for (let px = x + 7; px < x + w; px += spacing) {
        for (let py = y + 7; py < y + h; py += spacing) {
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(px - 3, py - 3);
          ctx.lineTo(px, py + 2);
          ctx.lineTo(px + 3, py - 3);
          ctx.stroke();
        }
      }
      break;
    }
    default: {
      // Fallback subtle diagonal crosshatch
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
  const colLithoW = Math.min(110, Math.max(68, Math.round(width * 0.25)));
  const xScale = colScaleW;
  const xLitho = xScale + colLithoW;
  const padX = xLitho + 12;
  const availableTextW = Math.max(80, width - padX - 12);

  const plotTop = headerH;
  const plotBottom = Math.max(plotTop + 10, height - 12);
  const plotH = plotBottom - plotTop;

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

  // 3. Early return if no intervals
  if (!intervals.length) {
    ctx.font = '400 11px sans-serif';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'center';
    ctx.fillText('No formations defined in current range', width / 2, height / 2);
    ctx.restore();
    return;
  }

  // 4. Calculate layout for each formation interval
  // Each entry displays 3 distinct pieces of information with generous spacing:
  // 1. Formation Name (Bold)
  // 2. Depth Range (From – To)
  // 3. Lithology Name – Percentage (%)
  interface ProcessedInterval {
    interval: StripLogInterval;
    nameLines: string[];
    depthRangeText: string;
    lithologyLines: string[];
    requiredH: number;
    allocatedH: number;
    yTop: number;
    yBottom: number;
  }

  const processed: ProcessedInterval[] = intervals.map((interval) => {
    const fromStr = `${formatNumber(toDisplay(interval.fromFt, unit), 0)} ${unit}`;
    const toStr = `${formatNumber(toDisplay(interval.toFt, unit), 0)} ${unit}`;
    const depthRangeText = `${fromStr} – ${toStr}`;

    const displayName = interval.isOverride ? `${interval.name} (Override)` : interval.name;
    const nameLines = wrapText(ctx, displayName, availableTextW, '700 12px sans-serif');

    const lithText = formatLithologyPercentageText(interval.comp);
    const lithologyLines = wrapText(ctx, lithText, availableTextW, '600 10px sans-serif');

    // Height required for comfortable padding and clear vertical separation
    const requiredH =
      10 + // top padding
      nameLines.length * 16 +
      4 + // gap
      14 + // depth interval line
      4 + // gap
      lithologyLines.length * 14 +
      10; // bottom padding

    return {
      interval,
      nameLines,
      depthRangeText,
      lithologyLines,
      requiredH,
      allocatedH: requiredH,
      yTop: 0,
      yBottom: 0,
    };
  });

  const totalRequiredH = processed.reduce((sum, p) => sum + p.requiredH, 0);
  const totalThickness = intervals.reduce((sum, p) => sum + Math.max(1, p.thicknessFt), 0);

  if (plotH >= totalRequiredH) {
    // Distribute remaining canvas height proportionally based on formation thickness
    const extraBudget = plotH - totalRequiredH;
    for (const p of processed) {
      const extra = totalThickness > 0 ? (Math.max(1, p.interval.thicknessFt) / totalThickness) * extraBudget : 0;
      p.allocatedH = p.requiredH + extra;
    }
  } else {
    // Graceful fallback for constrained heights
    const scale = plotH / Math.max(1, totalRequiredH);
    for (const p of processed) {
      p.allocatedH = Math.max(32, p.requiredH * scale);
    }
  }

  // Position interval rows sequentially from plotTop
  let curY = plotTop;
  for (let i = 0; i < processed.length; i++) {
    const p = processed[i]!;
    p.yTop = curY;
    p.yBottom = i === processed.length - 1 && plotH >= totalRequiredH ? plotBottom : curY + p.allocatedH;
    curY = p.yBottom;
  }

  // Monotonic, continuous depth-to-Y mapping
  const depthToY = (depthFt: number): number => {
    if (!processed.length) return plotTop;
    if (depthFt <= processed[0]!.interval.fromFt) return processed[0]!.yTop;
    const last = processed[processed.length - 1]!;
    if (depthFt >= last.interval.toFt) return last.yBottom;

    for (const p of processed) {
      if (depthFt >= p.interval.fromFt && depthFt <= p.interval.toFt) {
        const span = p.interval.toFt - p.interval.fromFt;
        if (span <= 0) return p.yTop;
        const frac = (depthFt - p.interval.fromFt) / span;
        return p.yTop + frac * (p.yBottom - p.yTop);
      }
    }
    return plotTop;
  };

  // 5. Draw Depth Scale Track (Column 1 - Left)
  // 5a. Formation boundary depth ticks
  for (const p of processed) {
    ctx.fillStyle = cLine;
    ctx.fillRect(xScale - 8, p.yTop, 8, 1);

    ctx.font = '600 9px monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    const topLabel = formatNumber(toDisplay(p.interval.fromFt, unit), 0);
    ctx.fillText(topLabel, xScale - 11, p.yTop + 3);
  }
  if (processed.length) {
    const last = processed[processed.length - 1]!;
    ctx.fillStyle = cLine;
    ctx.fillRect(xScale - 8, last.yBottom, 8, 1);
    ctx.font = '600 9px monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    const bottomLabel = formatNumber(toDisplay(last.interval.toFt, unit), 0);
    ctx.fillText(bottomLabel, xScale - 11, last.yBottom + 3);
  }

  // 5b. Intermediate rounded scale ticks (where spacing permits)
  for (const t of ticks) {
    const y = depthToY(t.depthFt);
    if (y < plotTop + 10 || y > plotBottom - 10) continue;

    // Skip if tick is too close to a formation boundary tick to avoid collision
    const nearBoundary = processed.some(
      (p) => Math.abs(y - p.yTop) < 13 || Math.abs(y - p.yBottom) < 13,
    );
    if (nearBoundary) continue;

    ctx.fillStyle = cLine;
    ctx.fillRect(xScale - 5, y, 5, 1);

    ctx.font = '400 8.5px monospace';
    ctx.fillStyle = cTextMuted;
    ctx.textAlign = 'right';
    ctx.fillText(t.label, xScale - 8, y + 3);
  }

  // 6. Draw Lithology Strip (Column 2 - Middle) & Formation Information (Column 3 - Right)
  for (const p of processed) {
    const intervalH = p.yBottom - p.yTop;
    if (intervalH <= 0.5) continue;

    // Column 2: Proportional multi-fraction lithology patterns
    const components =
      p.interval.comp.length > 0 ? p.interval.comp : [{ lith: 'shale' as Lithology, pct: 100 }];
    let curBarX = xScale + 1;
    const availableW = colLithoW - 2;

    for (let cIdx = 0; cIdx < components.length; cIdx++) {
      const comp = components[cIdx]!;
      const fracW = (comp.pct / 100) * availableW;
      const subW = cIdx === components.length - 1 ? availableW - (curBarX - (xScale + 1)) : fracW;

      // Fill component color
      const baseColor = LITHOLOGY_COLORS[comp.lith]?.hex ?? p.interval.color.hex;
      ctx.fillStyle = baseColor;
      ctx.fillRect(curBarX, p.yTop, subW, intervalH);

      // Draw standard geological hatch pattern on top
      drawLithologyHatch(ctx, comp.lith, curBarX, p.yTop, subW, intervalH, cHatch);

      curBarX += subW;
    }

    // Boundary divider line across both Column 2 and Column 3
    ctx.fillStyle = cLine;
    ctx.fillRect(xScale, p.yBottom, width - xScale, 1);

    // If MD override, draw highlighting border around the lithology box
    if (p.interval.isOverride) {
      ctx.strokeStyle = cOverrideBorder;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xScale + 1, p.yTop, colLithoW - 2, intervalH);
    }

    // Column 3: Formation & Strata Details
    // Clip strictly to interval bounds so text stays completely within its interval
    ctx.save();
    ctx.beginPath();
    ctx.rect(xLitho + 1, p.yTop, width - xLitho - 1, intervalH);
    ctx.clip();

    const contentH =
      p.nameLines.length * 16 + 4 + 14 + 4 + p.lithologyLines.length * 14;
    let textY = p.yTop + Math.max(12, Math.round((intervalH - contentH) / 2) + 12);

    // Line 1: Formation Name (Bold)
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = p.interval.isOverride ? cOverrideBorder : cTextPrimary;
    ctx.textAlign = 'left';
    for (const line of p.nameLines) {
      ctx.fillText(line, padX, textY);
      textY += 16;
    }

    // Line 2: Depth Range (From – To)
    textY += 2;
    ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillStyle = cTextMuted;
    ctx.fillText(p.depthRangeText, padX, textY);
    textY += 15;

    // Line 3: Lithology Name – Percentage (%)
    textY += 2;
    ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
    for (const line of p.lithologyLines) {
      ctx.fillText(line, padX, textY);
      textY += 14;
    }

    ctx.restore();
  }

  // Draw bottom boundary line
  ctx.fillStyle = cLine;
  ctx.fillRect(0, plotBottom, width, 1);

  ctx.restore();
}
