import { EVENT_TYPES, type EventType } from '../model/types';

export type EventCategory = keyof typeof EVENT_TYPES;

export interface EventIconColors {
  fg: string;
  bg: string;
  border: string;
  category: EventCategory;
}

export interface DrawIconOptions {
  /** If true, draws a rounded/circular badge background behind the icon glyph. Default true. */
  badge?: boolean;
  /** Custom stroke or primary glyph color override. */
  color?: string;
  /** Custom background fill color override. */
  bgColor?: string;
  /** Custom border color override. */
  borderColor?: string;
}

/** Theme-consistent color schemes for the 4 categories and 21 types. */
export const CATEGORY_COLORS: Record<EventCategory, { fg: string; bg: string; border: string }> = {
  Shows: {
    fg: '#2ecc71',
    bg: 'rgba(46, 204, 113, 0.16)',
    border: '#27ae60',
  },
  Hazards: {
    fg: '#e74c3c',
    bg: 'rgba(231, 76, 60, 0.16)',
    border: '#c0392b',
  },
  Geology: {
    fg: '#f39c12',
    bg: 'rgba(243, 156, 18, 0.16)',
    border: '#d68910',
  },
  Operations: {
    fg: '#3498db',
    bg: 'rgba(52, 152, 219, 0.16)',
    border: '#2980b9',
  },
};

/** Specific custom colors for certain iconic event types */
export const EVENT_SPECIFIC_COLORS: Partial<Record<EventType, { fg: string; bg?: string; border?: string }>> = {
  oil_good: { fg: '#f1c40f', bg: 'rgba(241, 196, 15, 0.18)', border: '#d4ac0d' },
  oil_fair: { fg: '#f39c12', bg: 'rgba(243, 156, 18, 0.16)', border: '#b9770e' },
  oil_poor: { fg: '#d35400', bg: 'rgba(211, 84, 0, 0.14)', border: '#a04000' },
  fluor: { fg: '#2ecc71', bg: 'rgba(46, 204, 113, 0.22)', border: '#229954' },
  gas: { fg: '#e67e22', bg: 'rgba(230, 126, 34, 0.18)', border: '#ba4a00' },
  water: { fg: '#3498db', bg: 'rgba(52, 152, 219, 0.18)', border: '#1f618d' },
  h2s: { fg: '#e74c3c', bg: 'rgba(231, 76, 60, 0.22)', border: '#922b21' },
  kick: { fg: '#e74c3c', bg: 'rgba(231, 76, 60, 0.20)', border: '#a93226' },
  fault: { fg: '#e67e22', bg: 'rgba(230, 126, 34, 0.18)', border: '#af601a' },
  fracture: { fg: '#9b59b6', bg: 'rgba(155, 89, 182, 0.18)', border: '#7d3c98' },
  kop: { fg: '#1abc9c', bg: 'rgba(26, 188, 156, 0.18)', border: '#117a65' },
};

export function getEventCategoryFromType(type: string): EventCategory {
  for (const [category, types] of Object.entries(EVENT_TYPES) as [EventCategory, readonly string[]][]) {
    if (types.includes(type)) return category;
  }
  return 'Operations';
}

export function getEventColors(type: string): EventIconColors {
  const category = getEventCategoryFromType(type);
  const base = CATEGORY_COLORS[category];
  const specific = (EVENT_SPECIFIC_COLORS as Record<string, { fg: string; bg?: string; border?: string }>)[type];

  return {
    category,
    fg: specific?.fg ?? base.fg,
    bg: specific?.bg ?? base.bg,
    border: specific?.border ?? base.border,
  };
}

/**
 * Draws an event icon onto a 2D canvas context.
 *
 * @param ctx 2D rendering context
 * @param type EventType or string
 * @param x Center x coordinate
 * @param y Center y coordinate
 * @param size Bounding box size (width = height = size)
 * @param options Styling options
 * @returns boolean true if drawn successfully, false on invalid inputs
 */
export function drawEventIcon(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number,
  y: number,
  size: number = 32,
  options: DrawIconOptions = {},
): boolean {
  if (!ctx || size <= 0 || !Number.isFinite(size) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }

  const { badge = true } = options;
  const colors = getEventColors(type);
  const fg = options.color ?? colors.fg;
  const bg = options.bgColor ?? colors.bg;
  const border = options.borderColor ?? colors.border;
  const r = size / 2;

  ctx.save();
  ctx.translate(x, y);

  // 1. Draw badge background if requested
  if (badge) {
    ctx.beginPath();
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.strokeStyle = border;
    ctx.stroke();
  }

  // 2. Draw glyph inside inner bounds (scale factor ~0.55 of radius)
  const g = r * 0.58;
  ctx.lineWidth = Math.max(1.2, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;

  switch (type) {
    // --- SHOWS (6) ---
    case 'oil_good': {
      // Solid golden droplet with inner specular gleam
      drawDroplet(ctx, g);
      ctx.fill();
      // Highlight shine arc
      ctx.beginPath();
      ctx.arc(-g * 0.28, g * 0.15, g * 0.22, Math.PI * 0.9, Math.PI * 1.6);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1, size * 0.05);
      ctx.stroke();
      break;
    }

    case 'oil_fair': {
      // Half-filled oil droplet
      drawDroplet(ctx, g);
      ctx.stroke();
      ctx.save();
      ctx.clip();
      ctx.fillRect(-g, 0, g * 2, g * 1.5);
      ctx.restore();
      break;
    }

    case 'oil_poor': {
      // Outline oil droplet with single central dot
      drawDroplet(ctx, g);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, g * 0.35, g * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'fluor': {
      // 8-point fluorescence sparkle / starburst
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const dist = i % 2 === 0 ? g : g * 0.42;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'gas': {
      // Gas flame silhouette
      ctx.beginPath();
      ctx.moveTo(0, -g);
      ctx.bezierCurveTo(g * 0.6, -g * 0.3, g * 0.8, g * 0.3, g * 0.45, g * 0.8);
      ctx.bezierCurveTo(g * 0.2, g * 0.95, -g * 0.2, g * 0.95, -g * 0.45, g * 0.8);
      ctx.bezierCurveTo(-g * 0.8, g * 0.3, -g * 0.6, -g * 0.3, 0, -g);
      ctx.closePath();
      ctx.fill();
      // Inner flame cutout / highlight
      ctx.beginPath();
      ctx.moveTo(0, -g * 0.2);
      ctx.bezierCurveTo(g * 0.3, g * 0.1, g * 0.3, g * 0.5, 0, g * 0.75);
      ctx.bezierCurveTo(-g * 0.3, g * 0.5, -g * 0.3, g * 0.1, 0, -g * 0.2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }

    case 'water': {
      // Dual wave ripples
      ctx.beginPath();
      // Top wave
      ctx.moveTo(-g, -g * 0.2);
      ctx.bezierCurveTo(-g * 0.5, -g * 0.6, 0, 0.1 * g, g * 0.5, -g * 0.3);
      ctx.lineTo(g, -g * 0.1);
      // Bottom wave
      ctx.moveTo(-g, g * 0.35);
      ctx.bezierCurveTo(-g * 0.5, 0, 0, g * 0.65, g * 0.5, g * 0.25);
      ctx.lineTo(g, g * 0.45);
      ctx.stroke();
      break;
    }

    // --- HAZARDS (6) ---
    case 'h2s': {
      // Toxic diamond hazard emblem with 'H2S' inscription
      ctx.beginPath();
      ctx.moveTo(0, -g);
      ctx.lineTo(g, 0);
      ctx.lineTo(0, g);
      ctx.lineTo(-g, 0);
      ctx.closePath();
      ctx.fill();
      // 'H2S' text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(7, Math.round(size * 0.24))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H2S', 0, 0);
      break;
    }

    case 'kick': {
      // Surge burst upward arrow
      ctx.beginPath();
      ctx.moveTo(0, -g);
      ctx.lineTo(g * 0.6, -g * 0.2);
      ctx.lineTo(g * 0.25, -g * 0.2);
      ctx.lineTo(g * 0.25, g);
      ctx.lineTo(-g * 0.25, g);
      ctx.lineTo(-g * 0.25, -g * 0.2);
      ctx.lineTo(-g * 0.6, -g * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'lost': {
      // Lost circulation: downward funnel into dotted fracture void
      ctx.beginPath();
      ctx.moveTo(-g * 0.7, -g * 0.7);
      ctx.lineTo(g * 0.7, -g * 0.7);
      ctx.lineTo(g * 0.25, 0);
      ctx.lineTo(g * 0.25, g * 0.6);
      ctx.lineTo(-g * 0.25, g * 0.6);
      ctx.lineTo(-g * 0.25, 0);
      ctx.closePath();
      ctx.stroke();
      // Down arrow in center
      ctx.beginPath();
      ctx.moveTo(0, -g * 0.4);
      ctx.lineTo(0, g * 0.4);
      ctx.moveTo(-g * 0.2, g * 0.2);
      ctx.lineTo(0, g * 0.4);
      ctx.lineTo(g * 0.2, g * 0.2);
      ctx.stroke();
      break;
    }

    case 'stuck': {
      // Stuck pipe: vertical shaft clamped by dual wedge jaws
      ctx.beginPath();
      // Central pipe
      ctx.moveTo(0, -g);
      ctx.lineTo(0, g);
      ctx.stroke();
      // Left wedge
      ctx.beginPath();
      ctx.moveTo(-g * 0.9, -g * 0.45);
      ctx.lineTo(-g * 0.2, 0);
      ctx.lineTo(-g * 0.9, g * 0.45);
      ctx.closePath();
      ctx.fill();
      // Right wedge
      ctx.beginPath();
      ctx.moveTo(g * 0.9, -g * 0.45);
      ctx.lineTo(g * 0.2, 0);
      ctx.lineTo(g * 0.9, g * 0.45);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'tight': {
      // Tight hole: two opposing horizontal arrows constricting borehole
      ctx.beginPath();
      // Borehole boundaries
      ctx.moveTo(-g * 0.2, -g);
      ctx.lineTo(-g * 0.2, g);
      ctx.moveTo(g * 0.2, -g);
      ctx.lineTo(g * 0.2, g);
      ctx.stroke();
      // Left inward arrow
      ctx.beginPath();
      ctx.moveTo(-g * 0.85, 0);
      ctx.lineTo(-g * 0.35, 0);
      ctx.moveTo(-g * 0.55, -g * 0.25);
      ctx.lineTo(-g * 0.35, 0);
      ctx.lineTo(-g * 0.55, g * 0.25);
      // Right inward arrow
      ctx.moveTo(g * 0.85, 0);
      ctx.lineTo(g * 0.35, 0);
      ctx.moveTo(g * 0.55, -g * 0.25);
      ctx.lineTo(g * 0.35, 0);
      ctx.lineTo(g * 0.55, g * 0.25);
      ctx.stroke();
      break;
    }

    case 'washout': {
      // Washout: borehole ballooning outward with outward arrows
      ctx.beginPath();
      // Expanded cavity
      ctx.moveTo(-g * 0.3, -g);
      ctx.bezierCurveTo(-g * 0.9, -g * 0.5, -g * 0.9, g * 0.5, -g * 0.3, g);
      ctx.moveTo(g * 0.3, -g);
      ctx.bezierCurveTo(g * 0.9, -g * 0.5, g * 0.9, g * 0.5, g * 0.3, g);
      ctx.stroke();
      // Outward arrows
      ctx.beginPath();
      ctx.moveTo(-g * 0.1, 0);
      ctx.lineTo(-g * 0.55, 0);
      ctx.moveTo(g * 0.1, 0);
      ctx.lineTo(g * 0.55, 0);
      ctx.stroke();
      break;
    }

    // --- GEOLOGY (2) ---
    case 'fault': {
      // Fault plane: inclined shear line with offset bedding layers
      ctx.beginPath();
      // Inclined fault plane
      ctx.moveTo(-g * 0.7, g * 0.8);
      ctx.lineTo(g * 0.7, -g * 0.8);
      ctx.lineWidth = Math.max(1.8, size * 0.1);
      ctx.stroke();
      // Left block stratum
      ctx.lineWidth = Math.max(1.2, size * 0.07);
      ctx.beginPath();
      ctx.moveTo(-g * 0.8, -g * 0.1);
      ctx.lineTo(-g * 0.1, -g * 0.1);
      // Right block down-thrown stratum
      ctx.moveTo(0.1 * g, g * 0.25);
      ctx.lineTo(g * 0.8, g * 0.25);
      ctx.stroke();
      break;
    }

    case 'fracture': {
      // Jagged vertical fracture crack
      ctx.beginPath();
      ctx.moveTo(0, -g);
      ctx.lineTo(-g * 0.35, -g * 0.45);
      ctx.lineTo(g * 0.3, -g * 0.05);
      ctx.lineTo(-g * 0.25, g * 0.4);
      ctx.lineTo(g * 0.15, g * 0.75);
      ctx.lineTo(0, g);
      // Branch fissure
      ctx.moveTo(g * 0.3, -g * 0.05);
      ctx.lineTo(g * 0.65, g * 0.15);
      ctx.stroke();
      break;
    }

    // --- OPERATIONS (7) ---
    case 'casing': {
      // Casing shoe collar with guide bevel
      ctx.beginPath();
      ctx.moveTo(-g * 0.6, -g * 0.75);
      ctx.lineTo(g * 0.6, -g * 0.75);
      ctx.lineTo(g * 0.6, g * 0.3);
      ctx.lineTo(g * 0.35, g * 0.75);
      ctx.lineTo(-g * 0.35, g * 0.75);
      ctx.lineTo(-g * 0.6, g * 0.3);
      ctx.closePath();
      ctx.stroke();
      // Horizontal shoe shoulder line
      ctx.beginPath();
      ctx.moveTo(-g * 0.6, g * 0.25);
      ctx.lineTo(g * 0.6, g * 0.25);
      ctx.stroke();
      break;
    }

    case 'kop': {
      // Kick-off point: vertical path with 45° deflection branch and target circle
      ctx.beginPath();
      ctx.moveTo(-g * 0.4, -g * 0.85);
      ctx.lineTo(-g * 0.4, 0);
      ctx.arcTo(-g * 0.4, g * 0.6, g * 0.6, g * 0.6, g * 0.5);
      ctx.lineTo(g * 0.6, g * 0.6);
      ctx.stroke();
      // Deflection target node
      ctx.beginPath();
      ctx.arc(-g * 0.4, 0, g * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bit': {
      // Drill bit: tricone cutter face with conical teeth
      ctx.beginPath();
      // Bit body shank
      ctx.moveTo(-g * 0.3, -g * 0.85);
      ctx.lineTo(g * 0.3, -g * 0.85);
      ctx.lineTo(g * 0.55, -g * 0.1);
      ctx.lineTo(g * 0.4, g * 0.65);
      ctx.lineTo(0, g * 0.85);
      ctx.lineTo(-g * 0.4, g * 0.65);
      ctx.lineTo(-g * 0.55, -g * 0.1);
      ctx.closePath();
      ctx.stroke();
      // Cutter blades
      ctx.beginPath();
      ctx.moveTo(0, -g * 0.1);
      ctx.lineTo(0, g * 0.75);
      ctx.moveTo(-g * 0.35, g * 0.2);
      ctx.lineTo(0, g * 0.45);
      ctx.lineTo(g * 0.35, g * 0.2);
      ctx.stroke();
      break;
    }

    case 'core': {
      // Cylindrical rock core barrel
      ctx.beginPath();
      ctx.rect(-g * 0.4, -g * 0.75, g * 0.8, g * 1.5);
      ctx.stroke();
      // Internal geological core bedding laminations
      ctx.beginPath();
      ctx.moveTo(-g * 0.4, -g * 0.25);
      ctx.lineTo(g * 0.4, -g * 0.25);
      ctx.moveTo(-g * 0.4, g * 0.25);
      ctx.lineTo(g * 0.4, g * 0.25);
      ctx.stroke();
      break;
    }

    case 'dst': {
      // Drill stem test: pressure gauge dial
      ctx.beginPath();
      ctx.arc(0, 0, g * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      // Needle pointing upward at ~45 degrees
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(g * 0.45, -g * 0.45);
      ctx.stroke();
      // Center pivot pin
      ctx.beginPath();
      ctx.arc(0, 0, g * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'mw': {
      // Mud weight hydrometer / beaker
      ctx.beginPath();
      ctx.moveTo(-g * 0.3, -g * 0.8);
      ctx.lineTo(-g * 0.3, -g * 0.2);
      ctx.lineTo(-g * 0.6, g * 0.7);
      ctx.lineTo(g * 0.6, g * 0.7);
      ctx.lineTo(g * 0.3, -g * 0.2);
      ctx.lineTo(g * 0.3, -g * 0.8);
      ctx.stroke();
      // Fluid level meniscus
      ctx.beginPath();
      ctx.moveTo(-g * 0.45, g * 0.3);
      ctx.lineTo(g * 0.45, g * 0.3);
      ctx.stroke();
      break;
    }

    case 'td': {
      // Total depth anchor: base plate with dual boundary line and 'TD' marker
      ctx.beginPath();
      // Vertical wellbore termination
      ctx.moveTo(0, -g * 0.8);
      ctx.lineTo(0, g * 0.3);
      // Double baseline bar
      ctx.moveTo(-g * 0.75, g * 0.3);
      ctx.lineTo(g * 0.75, g * 0.3);
      ctx.moveTo(-g * 0.6, g * 0.6);
      ctx.lineTo(g * 0.6, g * 0.6);
      ctx.stroke();
      break;
    }

    default: {
      // Unknown / fallback marker
      ctx.beginPath();
      ctx.arc(0, 0, g * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = `bold ${Math.max(8, Math.round(size * 0.32))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, 0);
      break;
    }
  }

  ctx.restore();
  return true;
}

/** Draws standard droplet path shape. */
function drawDroplet(ctx: CanvasRenderingContext2D, g: number) {
  ctx.beginPath();
  ctx.moveTo(0, -g);
  ctx.bezierCurveTo(g * 0.65, -g * 0.15, g * 0.7, g * 0.55, 0, g * 0.9);
  ctx.bezierCurveTo(-g * 0.7, g * 0.55, -g * 0.65, -g * 0.15, 0, -g);
  ctx.closePath();
}

/**
 * Renders an event icon to a data URL (PNG) if browser DOM is available.
 */
export function createEventIconDataUrl(type: string, size: number = 32): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawEventIcon(ctx, type, size / 2, size / 2, size);
  return canvas.toDataURL();
}
