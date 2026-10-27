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
 * Default corner is 'nw' to preserve backward compatibility with existing tests.
 */
export function computeStaffPosition(
  bounds: { min: { x: number; z: number }; max: { x: number; z: number } },
  offset = 8,
  corner: 'nw' | 'sw' = 'nw',
): StaffPosition {
  if (!Number.isFinite(bounds.min.x) || !Number.isFinite(bounds.min.z)) {
    return { x: -offset, z: -offset };
  }
  if (corner === 'sw' && Number.isFinite(bounds.max.z)) {
    return {
      x: Math.floor(bounds.min.x - offset),
      z: Math.ceil(bounds.max.z + offset),
    };
  }
  return {
    x: Math.floor(bounds.min.x - offset),
    z: Math.floor(bounds.min.z - offset),
  };
}

/**
 * Returns the true maximum TVD in feet across all survey stations in the given well or wells.
 */
export function getMaxTvd(
  wellOrWells?:
    | { plan?: { tvd: number }[]; actual?: { tvd: number }[] }
    | readonly { plan?: { tvd: number }[]; actual?: { tvd: number }[] }[],
): number {
  if (!wellOrWells) return 0;
  const list = Array.isArray(wellOrWells) ? wellOrWells : [wellOrWells];
  let maxTvd = 0;
  for (const w of list) {
    if (w.plan) {
      for (const p of w.plan) {
        if (p.tvd > maxTvd) maxTvd = p.tvd;
      }
    }
    if (w.actual) {
      for (const p of w.actual) {
        if (p.tvd > maxTvd) maxTvd = p.tvd;
      }
    }
  }
  return maxTvd;
}

export interface LandingPlaneDescriptor {
  wellName: string;
  slot: number;
  avgTvdFt: number;
  width: number;
  length: number;
  position: Point3D;
}

export interface TrajectoryPointLike {
  md: number;
  inc: number;
  azi: number;
  tvd: number;
  n: number;
  e: number;
}

export interface WellLike {
  name: string;
  slot: number;
  plan: TrajectoryPointLike[];
  actual: TrajectoryPointLike[];
}

/**
 * Computes landing-zone target reference planes beneath horizontal sections (inc >= 85°).
 * Matches original Multilateral Trajectory Viewer reference planes.
 */
export function computeLandingPlanes(
  wells: readonly WellLike[],
  pad = 350,
): LandingPlaneDescriptor[] {
  const planes: LandingPlaneDescriptor[] = [];
  for (const w of wells) {
    const src = w.plan.length >= 2 ? w.plan : w.actual;
    const hz = src.filter((s) => s.inc >= 85);
    if (hz.length < 2) continue;

    let minN = Infinity;
    let maxN = -Infinity;
    let minE = Infinity;
    let maxE = -Infinity;
    let sumTvd = 0;

    for (const s of hz) {
      if (s.n < minN) minN = s.n;
      if (s.n > maxN) maxN = s.n;
      if (s.e < minE) minE = s.e;
      if (s.e > maxE) maxE = s.e;
      sumTvd += s.tvd;
    }

    const avgTvdFt = sumTvd / hz.length;
    const width = Math.max(10, (maxE - minE + 2 * pad) * SCALE);
    const length = Math.max(10, (maxN - minN + 2 * pad) * SCALE);

    planes.push({
      wellName: w.name,
      slot: w.slot,
      avgTvdFt,
      width,
      length,
      position: {
        x: ((minE + maxE) / 2) * SCALE,
        y: -avgTvdFt * SCALE - 0.9,
        z: -((minN + maxN) / 2) * SCALE,
      },
    });
  }
  return planes;
}

export interface DepthGuideLine {
  tvdFt: number;
  y: number;
  xStart: number;
  xEnd: number;
  zStart: number;
  zEnd: number;
}

/**
 * Computes horizontal depth guide lines extending from the staff corner along the envelope boundaries.
 */
export function computeDepthGuideLines(
  staffPos: StaffPosition,
  bounds: { min: { x: number; z: number }; max: { x: number; z: number } },
  ticks: DepthTick[],
): DepthGuideLine[] {
  const xSpan = Number.isFinite(bounds.max.x) ? Math.max(15, (bounds.max.x - staffPos.x) * 0.35) : 20;
  const zSpan = Number.isFinite(bounds.max.z) ? Math.max(15, (bounds.max.z - staffPos.z) * 0.35) : 20;

  return ticks
    .filter((t) => t.tvdFt > 0)
    .map((t) => ({
      tvdFt: t.tvdFt,
      y: t.y,
      xStart: staffPos.x,
      xEnd: staffPos.x + xSpan,
      zStart: staffPos.z,
      zEnd: staffPos.z + zSpan,
    }));
}
