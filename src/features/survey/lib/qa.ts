import type { SurveyPoint } from './types';

export interface SurveyLimits {
  /** Max dogleg severity, °/100 ft. */
  maxDls: number;
  /** Largest allowed MD gap between stations, ft. */
  maxStationGap: number;
}

export const DEFAULT_LIMITS: SurveyLimits = { maxDls: 3.0, maxStationGap: 300 };

export interface QaFinding {
  md: number;
  severity: 'warn' | 'crit';
  code: 'DLS_OVER_LIMIT' | 'STATION_GAP' | 'AZI_JUMP_LOW_INC';
  message: string;
}

/** Checks a computed survey against its section limits. Pure; the UI decides how to show findings. */
export function qaSurvey(points: readonly SurveyPoint[], limits: SurveyLimits = DEFAULT_LIMITS): QaFinding[] {
  const out: QaFinding[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    if (b.dls > limits.maxDls + 1e-4) {
      out.push({
        md: b.md,
        severity: b.dls > limits.maxDls * 1.5 ? 'crit' : 'warn',
        code: 'DLS_OVER_LIMIT',
        message: `DLS ${b.dls.toFixed(2)}°/100 ft exceeds ${limits.maxDls.toFixed(2)}`,
      });
    }
    if (b.md - a.md > limits.maxStationGap) {
      out.push({
        md: b.md,
        severity: 'warn',
        code: 'STATION_GAP',
        message: `${(b.md - a.md).toFixed(0)} ft since last station`,
      });
    }
    const dAzi = Math.abs(((b.azi - a.azi + 540) % 360) - 180);
    if (a.inc > 0.5 && a.inc < 5 && dAzi > 45) {
      out.push({
        md: b.md,
        severity: 'warn',
        code: 'AZI_JUMP_LOW_INC',
        message: `Azimuth jump ${dAzi.toFixed(0)}° at low inclination`,
      });
    }
  }
  return out;
}
