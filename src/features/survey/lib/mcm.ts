/**
 * Minimum curvature method — ported from the reference viewer, typed and with an explicit tie-in.
 * Pure functions: no React, no three.js. Every function here has a unit test.
 *
 *   β    = acos[cos(I₂−I₁) − sin I₁·sin I₂·(1−cos(A₂−A₁))]
 *   RF   = (2/β)·tan(β/2)            (RF = 1 when β = 0)
 *   ΔN   = ΔMD/2·(sin I₁ cos A₁ + sin I₂ cos A₂)·RF
 *   ΔE   = ΔMD/2·(sin I₁ sin A₁ + sin I₂ sin A₂)·RF
 *   ΔTVD = ΔMD/2·(cos I₁ + cos I₂)·RF
 *   DLS  = β(°)·100 / ΔMD            (°/100 ft)
 */
import { SURFACE_TIE_IN, type Station, type SurveyPoint, type TieIn } from './types';

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

const clamp = (x: number, lo = -1, hi = 1) => Math.min(hi, Math.max(lo, x));
const normAzi = (a: number) => ((a % 360) + 360) % 360;

/** Unit tangent (north, east, down) for an inclination/azimuth pair. */
export function tangent(inc: number, azi: number): [number, number, number] {
  const I = inc * D2R;
  const A = azi * D2R;
  return [Math.sin(I) * Math.cos(A), Math.sin(I) * Math.sin(A), Math.cos(I)];
}

export function mcmStep(p: SurveyPoint, c: Station): SurveyPoint {
  const I1 = p.inc * D2R;
  const I2 = c.inc * D2R;
  const A1 = p.azi * D2R;
  const A2 = c.azi * D2R;
  const dmd = c.md - p.md;
  const beta = Math.acos(clamp(Math.cos(I2 - I1) - Math.sin(I1) * Math.sin(I2) * (1 - Math.cos(A2 - A1))));
  const rf = beta < 1e-9 ? 1 : (2 / beta) * Math.tan(beta / 2);
  const h = (dmd / 2) * rf;
  return {
    md: c.md,
    inc: c.inc,
    azi: c.azi,
    n: p.n + h * (Math.sin(I1) * Math.cos(A1) + Math.sin(I2) * Math.cos(A2)),
    e: p.e + h * (Math.sin(I1) * Math.sin(A1) + Math.sin(I2) * Math.sin(A2)),
    tvd: p.tvd + h * (Math.cos(I1) + Math.cos(I2)),
    dls: dmd > 0 ? (beta * R2D * 100) / dmd : 0,
    beta,
  };
}

/**
 * Computes positions for a list of stations sorted by MD.
 * With the default surface tie-in a station at MD 0 sits at TVD 0. For a sidetrack, pass the
 * parent bore's position at the first station's MD.
 */
export function computeSurvey(stations: readonly Station[], tieIn: TieIn = SURFACE_TIE_IN): SurveyPoint[] {
  const out: SurveyPoint[] = [];
  stations.forEach((s, i) => {
    if (i === 0) {
      // A surface tie-in assumes vertical hole above the first station.
      const tvd = tieIn === SURFACE_TIE_IN ? s.md : tieIn.tvd;
      out.push({ ...s, azi: normAzi(s.azi), n: tieIn.n, e: tieIn.e, tvd, dls: 0, beta: 0 });
    } else {
      out.push(mcmStep(out[i - 1]!, { ...s, azi: normAzi(s.azi) }));
    }
  });
  return out;
}

/** Point a fraction f (0..1) of the way along the circular arc between two computed stations. */
export function arcPoint(s0: SurveyPoint, s1: SurveyPoint, f: number): SurveyPoint {
  if (f <= 0) return s0;
  if (f >= 1) return s1;
  const t0 = tangent(s0.inc, s0.azi);
  const t1 = tangent(s1.inc, s1.azi);
  const b = Math.acos(clamp(t0[0] * t1[0] + t0[1] * t1[1] + t0[2] * t1[2]));
  let t = t0;
  if (b > 1e-7) {
    const a = Math.sin((1 - f) * b) / Math.sin(b);
    const c = Math.sin(f * b) / Math.sin(b);
    t = [a * t0[0] + c * t1[0], a * t0[1] + c * t1[1], a * t0[2] + c * t1[2]];
  }
  const inc = Math.acos(clamp(t[2])) * R2D;
  const azi = inc < 1e-6 ? s0.azi : normAzi(Math.atan2(t[1], t[0]) * R2D);
  return mcmStep(s0, { md: s0.md + f * (s1.md - s0.md), inc, azi });
}

/** Interpolated point at any MD, following the minimum-curvature arc. Clamps to the ends. */
export function atMd(points: readonly SurveyPoint[], md: number): SurveyPoint | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;
  if (md <= first.md) return first;
  if (md >= last.md) return last;
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.md < md) lo = mid;
    else hi = mid;
  }
  const a = points[lo]!;
  const b = points[hi]!;
  return arcPoint(a, b, (md - a.md) / (b.md - a.md));
}

/** Number of stations at or above `md` — the index of the next station the bit will reach. */
export function stationsReached(points: readonly SurveyPoint[], md: number): number {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid]!.md <= md + 1e-9) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Densifies a survey so a drawn curve follows each arc: one sample per ~0.6° of dogleg, max 10 per span.
 */
export function densify(points: readonly SurveyPoint[], maxStepDeg = 0.6): SurveyPoint[] {
  const first = points[0];
  if (!first) return [];
  const out: SurveyPoint[] = [first];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const n = Math.max(1, Math.min(10, Math.ceil((b.beta * R2D) / maxStepDeg)));
    for (let k = 1; k <= n; k++) out.push(k === n ? b : arcPoint(a, b, k / n));
  }
  return out;
}

/** MD where a lateral leaves the motherbore: the station before inclination first reaches 1°. */
export function junctionMd(points: readonly SurveyPoint[]): number {
  const i = points.findIndex((s) => s.inc >= 1);
  return i > 0 ? points[i - 1]!.md : 0;
}
