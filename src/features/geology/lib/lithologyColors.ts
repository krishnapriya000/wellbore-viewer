import type { Formation, Lithology } from '../model/types';

export interface ColorRgb {
  hex: string;
  r: number;
  g: number;
  b: number;
}

/** Standard palette for the 12 supported lithologies from the reference viewer. */
export const LITHOLOGY_COLORS: Record<Lithology, ColorRgb> = {
  sandstone: { hex: '#f1d36e', r: 0.945, g: 0.827, b: 0.431 }, // warm sandstone yellow
  shale: { hex: '#97a596', r: 0.592, g: 0.647, b: 0.588 }, // grey-green shale
  siltstone: { hex: '#d8bc8f', r: 0.847, g: 0.737, b: 0.561 }, // beige siltstone
  limestone: { hex: '#86b6dc', r: 0.525, g: 0.714, b: 0.863 }, // marine limestone blue
  dolomite: { hex: '#b9a3dc', r: 0.725, g: 0.639, b: 0.863 }, // purple dolomite
  marl: { hex: '#c5d39b', r: 0.773, g: 0.827, b: 0.608 }, // pale green calcareous marl
  coal: { hex: '#2f2f2f', r: 0.184, g: 0.184, b: 0.184 }, // dark carbonaceous coal
  anhydrite: { hex: '#e9b9d2', r: 0.914, g: 0.725, b: 0.824 }, // crystalline lilac anhydrite
  salt: { hex: '#dfe8f4', r: 0.875, g: 0.91, b: 0.957 }, // light halite salt
  conglomerate: { hex: '#eaa65e', r: 0.918, g: 0.651, b: 0.369 }, // orange conglomerate
  chert: { hex: '#e7e1c6', r: 0.906, g: 0.882, b: 0.776 }, // pale chert
  basement: { hex: '#e1907f', r: 0.882, g: 0.565, b: 0.498 }, // salmon-coloured granite/basement
};

export const DEFAULT_LITHOLOGY_COLOR: ColorRgb = {
  hex: '#85929e',
  r: 0.522,
  g: 0.573,
  b: 0.62,
};

/**
 * Calculates a blended RGB color proportional to the percentages of the formation components.
 * Accurately represents multi-fraction lithology mixes.
 */
export function blendLithologyColor(comp: readonly { lith: Lithology; pct: number }[]): ColorRgb {
  if (!comp.length) return DEFAULT_LITHOLOGY_COLOR;

  let r = 0;
  let g = 0;
  let b = 0;
  let totalPct = 0;

  for (const c of comp) {
    const base = LITHOLOGY_COLORS[c.lith] ?? DEFAULT_LITHOLOGY_COLOR;
    const fraction = c.pct / 100;
    r += base.r * fraction;
    g += base.g * fraction;
    b += base.b * fraction;
    totalPct += c.pct;
  }

  if (totalPct <= 0) return DEFAULT_LITHOLOGY_COLOR;

  if (Math.abs(totalPct - 100) > 0.01) {
    const scale = 100 / totalPct;
    r *= scale;
    g *= scale;
    b *= scale;
  }

  const ir = Math.min(255, Math.max(0, Math.round(r * 255)));
  const ig = Math.min(255, Math.max(0, Math.round(g * 255)));
  const ib = Math.min(255, Math.max(0, Math.round(b * 255)));
  const hex = `#${((1 << 24) + (ir << 16) + (ig << 8) + ib).toString(16).slice(1)}`;

  return { hex, r, g, b };
}

/** Returns the dominant lithology in a formation (component with the largest percentage). */
export function dominantLithology(comp: readonly { lith: Lithology; pct: number }[]): Lithology {
  if (!comp.length) return 'shale';
  let best = comp[0]!;
  for (let i = 1; i < comp.length; i++) {
    if (comp[i]!.pct > best.pct) {
      best = comp[i]!;
    }
  }
  return best.lith;
}

/** Formats a human-readable composition summary, e.g. "shale 70%, sandstone 30%". */
export function formatCompSummary(formation: Pick<Formation, 'comp'>): string {
  return formation.comp.map((c) => `${c.lith} ${Math.round(c.pct)}%`).join(', ');
}

export interface LithologyMeta {
  lith: Lithology;
  name: string;
  color: ColorRgb;
  patternName: string;
  patternDescription: string;
}

export const LITHOLOGY_METAS: Record<Lithology, LithologyMeta> = {
  sandstone: {
    lith: 'sandstone',
    name: 'Sandstone',
    color: LITHOLOGY_COLORS.sandstone,
    patternName: 'Stippled Dots',
    patternDescription: 'Uniform granular dot stippling representing clastic sand grains',
  },
  shale: {
    lith: 'shale',
    name: 'Shale',
    color: LITHOLOGY_COLORS.shale,
    patternName: 'Horizontal Dashes',
    patternDescription: 'Parallel horizontal dashed lamination representing clay bedding',
  },
  siltstone: {
    lith: 'siltstone',
    name: 'Siltstone',
    color: LITHOLOGY_COLORS.siltstone,
    patternName: 'Dotted Dashes',
    patternDescription: 'Alternating micro-dots and short dashes',
  },
  limestone: {
    lith: 'limestone',
    name: 'Limestone',
    color: LITHOLOGY_COLORS.limestone,
    patternName: 'Brick Pattern',
    patternDescription: 'Standard masonry staggered brick blocks',
  },
  dolomite: {
    lith: 'dolomite',
    name: 'Dolomite',
    color: LITHOLOGY_COLORS.dolomite,
    patternName: 'Slanted Bricks',
    patternDescription: 'Diagonally inclined rhombohedral brick blocks',
  },
  marl: {
    lith: 'marl',
    name: 'Marl',
    color: LITHOLOGY_COLORS.marl,
    patternName: 'Dash & Tick Marks',
    patternDescription: 'Horizontal shale bedding dashes interrupted by calcareous vertical ticks',
  },
  coal: {
    lith: 'coal',
    name: 'Coal',
    color: LITHOLOGY_COLORS.coal,
    patternName: 'Dense Solid Bands',
    patternDescription: 'Closely-spaced solid horizontal carbonaceous seams',
  },
  anhydrite: {
    lith: 'anhydrite',
    name: 'Anhydrite',
    color: LITHOLOGY_COLORS.anhydrite,
    patternName: 'Diagonal Hatch',
    patternDescription: 'Evenly-spaced 45° diagonal crystalline hatching',
  },
  salt: {
    lith: 'salt',
    name: 'Salt (Halite)',
    color: LITHOLOGY_COLORS.salt,
    patternName: 'Isometric Crosses',
    patternDescription: 'Interlocking cubic plus / cross grid representing halite crystal lattice',
  },
  conglomerate: {
    lith: 'conglomerate',
    name: 'Conglomerate',
    color: LITHOLOGY_COLORS.conglomerate,
    patternName: 'Pebble Clasts',
    patternDescription: 'Scattered coarse gravel and elliptical pebble clasts',
  },
  chert: {
    lith: 'chert',
    name: 'Chert',
    color: LITHOLOGY_COLORS.chert,
    patternName: 'Angular Wedges',
    patternDescription: 'Sharp siliceous conchoidal triangles and fracture wedges',
  },
  basement: {
    lith: 'basement',
    name: 'Basement',
    color: LITHOLOGY_COLORS.basement,
    patternName: 'Crystalline Chevrons',
    patternDescription: 'Interlocking angled igneous/metamorphic v-shaped herringbone ticks',
  },
};

export const LITHOLOGY_META_LIST: LithologyMeta[] = Object.values(LITHOLOGY_METAS);
