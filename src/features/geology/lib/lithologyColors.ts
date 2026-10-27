import type { Formation, Lithology } from '../model/types';

export interface ColorRgb {
  hex: string;
  r: number;
  g: number;
  b: number;
}

/** Standard USGS / industry palette for the 12 supported lithologies. */
export const LITHOLOGY_COLORS: Record<Lithology, ColorRgb> = {
  sandstone: { hex: '#f4d03f', r: 0.957, g: 0.816, b: 0.247 }, // warm golden yellow
  shale: { hex: '#707b7c', r: 0.439, g: 0.482, b: 0.486 }, // cool mineral slate grey
  siltstone: { hex: '#b7950b', r: 0.718, g: 0.584, b: 0.043 }, // earthy mustard amber
  limestone: { hex: '#3498db', r: 0.204, g: 0.596, b: 0.859 }, // marine sky blue
  dolomite: { hex: '#16a085', r: 0.086, g: 0.627, b: 0.522 }, // deep teal turquoise
  marl: { hex: '#82e0aa', r: 0.51, g: 0.878, b: 0.667 }, // calcareous greenish marl
  coal: { hex: '#212f3d', r: 0.129, g: 0.184, b: 0.239 }, // deep charcoal black
  anhydrite: { hex: '#af7ac5', r: 0.686, g: 0.478, b: 0.773 }, // crystalline purple lilac
  salt: { hex: '#e8daef', r: 0.91, g: 0.855, b: 0.937 }, // halite pale violet white
  conglomerate: { hex: '#e67e22', r: 0.902, g: 0.494, b: 0.133 }, // pebbly burnt orange
  chert: { hex: '#a04000', r: 0.627, g: 0.251, b: 0.0 }, // siliceous terracotta
  basement: { hex: '#922b21', r: 0.573, g: 0.169, b: 0.129 }, // crystalline deep crimson
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

