import { M_PER_FT, type DepthUnit } from '@/shared/units/units';

export const SCALE = 0.01;

export const tvdToSceneY = (tvdFt: number): number => {
  const y = -tvdFt * SCALE;
  return y === 0 ? 0 : y;
};

export interface DepthTick {
  tvdFt: number;
  y: number;
  label: string;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface MdMarker {
  mdFt: number;
  label: string;
  position: Point3D;
}

export interface StaffPosition {
  x: number;
  z: number;
}

/**
 * Chooses a round, readable TVD tick interval in feet.
 */
export function pickTvdInterval(maxTvdFt: number, unit: DepthUnit): number {
  if (unit === 'm') {
    const maxM = maxTvdFt * M_PER_FT;
    if (maxM <= 600) return 200 / M_PER_FT;
    if (maxM <= 2000) return 500 / M_PER_FT;
    if (maxM <= 4000) return 1000 / M_PER_FT;
    return 2000 / M_PER_FT;
  }
  if (maxTvdFt <= 2000) return 500;
  if (maxTvdFt <= 6000) return 1000;
  if (maxTvdFt <= 12000) return 2000;
  return 5000;
}

/**
 * Computes evenly spaced TVD scale ticks from surface (0) down to the max depth.
 */
export function computeTvdTicks(maxTvdFt: number, unit: DepthUnit): DepthTick[] {
  if (!Number.isFinite(maxTvdFt) || maxTvdFt <= 0) {
    return [{ tvdFt: 0, y: 0, label: `0 ${unit}` }];
  }

  const intervalFt = pickTvdInterval(maxTvdFt, unit);
  const count = Math.max(1, Math.ceil(maxTvdFt / intervalFt));
  const ticks: DepthTick[] = [];

  for (let k = 0; k <= count; k++) {
    if (unit === 'm') {
      const intervalM = Math.round(intervalFt * M_PER_FT);
      const tvdM = k * intervalM;
      const tvdFt = tvdM / M_PER_FT;
      ticks.push({
        tvdFt,
        y: tvdToSceneY(tvdFt),
        label: `${tvdM.toLocaleString('en-US')} m`,
      });
    } else {
      const tvdFt = k * intervalFt;
      ticks.push({
        tvdFt,
        y: tvdToSceneY(tvdFt),
        label: `${tvdFt.toLocaleString('en-US')} ft`,
      });
    }
  }

  return ticks;
}

/**
 * Chooses a readable MD marker interval along the wellbore trajectory in feet.
 */
export function pickMdInterval(totalMdFt: number, unit: DepthUnit): number {
  if (unit === 'm') {
    const totalM = totalMdFt * M_PER_FT;
    if (totalM <= 1000) return 250 / M_PER_FT;
    if (totalM <= 2500) return 500 / M_PER_FT;
    if (totalM <= 5000) return 1000 / M_PER_FT;
    return 2000 / M_PER_FT;
  }
  if (totalMdFt <= 3000) return 500;
  if (totalMdFt <= 8000) return 1000;
  if (totalMdFt <= 16000) return 2000;
  return 5000;
}

/**
 * Computes measured-depth markers along a wellbore curve at regular intervals.
 */
export function computeMdMarkers(
  totalMdFt: number,
  atMdFn: (md: number) => { n: number; e: number; tvd: number } | null,
  unit: DepthUnit,
): MdMarker[] {
  if (!Number.isFinite(totalMdFt) || totalMdFt <= 0) return [];

  const intervalFt = pickMdInterval(totalMdFt, unit);
  const markers: MdMarker[] = [];

  for (let mdFt = intervalFt; mdFt < totalMdFt - 1; mdFt += intervalFt) {
    const pt = atMdFn(mdFt);
    if (!pt) continue;

    const label =
      unit === 'm'
        ? `${Math.round(mdFt * M_PER_FT).toLocaleString('en-US')} m`
        : `${Math.round(mdFt).toLocaleString('en-US')} ft`;

    markers.push({
      mdFt,
      label,
      position: {
        x: pt.e * SCALE,
        y: -pt.tvd * SCALE,
        z: -pt.n * SCALE,
      },
    });
  }

  return markers;
}

/**
 * Determines an offset position for the vertical TVD staff based on the well envelope bounds.
 */
export function computeStaffPosition(
  bounds: { min: { x: number; z: number }; max: { x: number; z: number } },
  offset = 8,
): StaffPosition {
  if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.min.z)) {
    return { x: -offset, z: -offset };
  }
  return {
    x: Math.floor(bounds.min.x - offset),
    z: Math.floor(bounds.min.z - offset),
  };
}
