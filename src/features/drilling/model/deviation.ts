import { atMd, type SurveyPoint } from '@/features/survey';

/** Centre-to-centre thresholds, ft. Move to a per-well design table when the API exists. */
export const DEVIATION_BANDS = { onPlan: 30, watch: 100 } as const;

export interface Deviation {
  /** + below plan, − above. */
  below: number;
  /** + right of plan (looking along the plan azimuth), − left. */
  right: number;
  /** 3D centre-to-centre distance. */
  ctc: number;
}

/** Actual vs plan at the same MD, as the reference viewer computes it. */
export function deviationFromPlan(tip: SurveyPoint, plan: readonly SurveyPoint[]): Deviation | null {
  const p = atMd(plan, tip.md);
  if (!p) return null;
  const dN = tip.n - p.n;
  const dE = tip.e - p.e;
  const dT = tip.tvd - p.tvd;
  const az = (p.azi * Math.PI) / 180;
  return { below: dT, right: -dN * Math.sin(az) + dE * Math.cos(az), ctc: Math.hypot(dN, dE, dT) };
}
