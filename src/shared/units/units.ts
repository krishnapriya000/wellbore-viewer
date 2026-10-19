/**
 * Depths are stored in feet everywhere in the app. Convert only at the UI edge with these helpers.
 * Branded types stop a metre value being passed where feet are expected.
 */
export type Feet = number & { readonly __unit: 'ft' };
export type DepthUnit = 'ft' | 'm';

export const M_PER_FT = 0.3048;

export const feet = (v: number) => v as Feet;

/** Internal feet → display unit. */
export const toDisplay = (ft: number, unit: DepthUnit): number => (unit === 'm' ? ft * M_PER_FT : ft);

/** Display unit → internal feet. */
export const toFeet = (value: number, unit: DepthUnit): Feet => feet(unit === 'm' ? value / M_PER_FT : value);

/** Dogleg severity: °/100 ft ↔ °/30 m. */
export const dlsToDisplay = (dlsPer100ft: number, unit: DepthUnit): number =>
  unit === 'm' ? (dlsPer100ft * 30) / 30.48 : dlsPer100ft;

export const dlsLabel = (unit: DepthUnit) => (unit === 'm' ? '°/30 m' : '°/100 ft');

export function formatNumber(x: number, digits = 1): string {
  return Number.isFinite(x)
    ? x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '—';
}

export const formatDepth = (ft: number, unit: DepthUnit, digits = 1) =>
  `${formatNumber(toDisplay(ft, unit), digits)} ${unit}`;
