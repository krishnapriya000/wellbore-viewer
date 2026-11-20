/**
 * Warning Prediction / Lead-Time Hazard Model
 * Ported verbatim from the DrillWise Edge HMI reference (drillwise-edge-hmi.html).
 *
 * Mathematical formulation:
 * Continuous-time Poisson/exponential hazard process:
 *   P(h) = 1 - exp(-lambda * h)
 * where lambda = clamp(conf, 0, 1)^2.4 * 0.05
 *
 * This formulation guarantees strict monotonicity across prediction horizons:
 *   P(5) <= P(15) <= P(30) <= P(60)
 * Unlike separate per-horizon classifiers, this analytical model cannot produce inverted probabilities.
 */

export const PREDICTION_HORIZONS = [5, 15, 30, 60] as const;
export type PredictionHorizon = (typeof PREDICTION_HORIZONS)[number];

export interface HazardPrediction {
  horizonMinutes: PredictionHorizon;
  probability: number; // 0 to 1
  percentageValue: number; // 0 to 100
  percentageFormatted: string; // e.g. "49.4%" (1 decimal place matching HTML reference)
  isHighRisk: boolean; // probability >= 0.5 (threshold in HTML reference)
}

/**
 * Clamps numeric value between lower and upper bounds.
 * Matches: const clamp=(v,a,b)=>v<a?a:v>b?b:v; from drillwise-edge-hmi.html
 */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/**
 * Calculates continuous cumulative hazard rate lambda from incident confidence.
 * Matches: const l = Math.pow(clamp(conf, 0, 1), 2.4) * 0.05;
 */
export function calculateHazardLambda(confidence: number): number {
  const c = clamp(confidence, 0, 1);
  return Math.pow(c, 2.4) * 0.05;
}

/**
 * Computes monotonic lead-time hazard probabilities for horizons [5, 15, 30, 60] minutes.
 * Matches:
 * const HZ=[5,15,30,60];
 * const hazards=conf=>{const l=Math.pow(clamp(conf,0,1),2.4)*0.05;return HZ.map(x=>1-Math.exp(-l*x));};
 */
export function calculateLeadTimeHazards(confidence: number): HazardPrediction[] {
  const lambda = calculateHazardLambda(confidence);

  return PREDICTION_HORIZONS.map((horizon) => {
    const probability = 1 - Math.exp(-lambda * horizon);
    const percentageValue = probability * 100;
    return {
      horizonMinutes: horizon,
      probability,
      percentageValue,
      percentageFormatted: `${percentageValue.toFixed(1)}%`,
      isHighRisk: probability >= 0.5,
    };
  });
}

/**
 * Determines estimated time-to-incident lead time based on the earliest horizon
 * where probability reaches or exceeds 50% (P >= 0.5).
 * Matches:
 * let lead=">60";
 * for (let i=0;i<HZ.length;i++) if (hz[i]>=.5){ lead="~"+HZ[i]; break; }
 * returns "~5 min", "~15 min", "~30 min", "~60 min", or ">60 min".
 */
export function calculatePredictedLeadTime(hazards: HazardPrediction[]): string {
  for (const h of hazards) {
    if (h.isHighRisk) {
      return `~${h.horizonMinutes} min`;
    }
  }
  return '>60 min';
}

import type { IncidentFamilyItem, IncidentRecord, IncidentSeverity, IncidentTypeItem } from './types';

/**
 * Derives operational severity dynamically from confidence / hazard probability.
 * Severity mapping:
 *   >= 0.85: 'crit' (Critical)
 *   0.70 - 0.84: 'warn' (Warning)
 *   0.50 - 0.69: 'adv' (Advisory)
 *   < 0.50: 'info' (Clear)
 */
export function deriveSeverityFromConfidence(confidence: number): IncidentSeverity {
  const c = clamp(confidence, 0, 1);
  if (c >= 0.85) return 'crit';
  if (c >= 0.70) return 'warn';
  if (c >= 0.50) return 'adv';
  return 'info';
}

/**
 * Derives operational state string dynamically from confidence / hazard probability.
 */
export function deriveStateFromConfidence(
  confidence: number,
  currentState?: string,
): string {
  const c = clamp(confidence, 0, 1);
  if (c >= 0.85) {
    if (currentState && /critical/i.test(currentState)) return currentState;
    return 'Suspected — critical';
  }
  if (c >= 0.70) {
    if (currentState && /trending|monitoring|watch|active/i.test(currentState)) return currentState;
    return 'Active — trending';
  }
  if (c >= 0.50) {
    if (currentState && /monitoring|watch|active/i.test(currentState)) return currentState;
    return 'Monitoring';
  }
  return 'Clear';
}

export interface PredictedWarningAlertData {
  family: IncidentFamilyItem;
  type: IncidentTypeItem;
  record: IncidentRecord;
  severity: IncidentSeverity;
  severityLabel: string;
  severityRank: number;
  confidence: number;
  confidencePercentFormatted: string;
  hazards: HazardPrediction[];
  estimatedLeadTime: string;
  owner: string;
  state: string;
}

export const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  crit: 4,
  warn: 3,
  adv: 2,
  info: 1,
};

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  crit: 'Critical',
  warn: 'Warning',
  adv: 'Advisory',
  info: 'Clear',
};

/**
 * Determines the single top predicted active warning across all incident families.
 * Matches DrillWise Edge HMI reference:
 * const t = topIncident();
 * function topIncident(){
 *   return ALL.slice().sort((a,b)=>sevR(b.live)-sevR(a.live)||b.lc-a.lc)[0];
 * }
 * const show = sevR(t.live) >= 2;
 */
export function getTopPredictedWarning(families: IncidentFamilyItem[]): PredictedWarningAlertData | null {
  const allIncidents: { family: IncidentFamilyItem; type: IncidentTypeItem; record: IncidentRecord }[] = [];

  for (const f of families) {
    for (const t of f.incidentTypes) {
      if (t.record) {
        allIncidents.push({ family: f, type: t, record: t.record });
      }
    }
  }

  if (allIncidents.length === 0) return null;

  allIncidents.sort((a, b) => {
    const rankA = SEVERITY_RANK[a.record.severity] || 1;
    const rankB = SEVERITY_RANK[b.record.severity] || 1;
    if (rankB !== rankA) return rankB - rankA;
    return b.record.confidence - a.record.confidence;
  });

  const top = allIncidents[0];
  if (!top) return null;

  const rank = SEVERITY_RANK[top.record.severity] || 1;
  // Trigger condition matching HTML reference: sevR >= 2 (Advisory, Warning, Critical)
  if (rank < 2) return null;

  const hazards = calculateLeadTimeHazards(top.record.confidence);
  const estimatedLeadTime = calculatePredictedLeadTime(hazards);

  return {
    family: top.family,
    type: top.type,
    record: top.record,
    severity: top.record.severity,
    severityLabel: SEVERITY_LABELS[top.record.severity] || 'Warning',
    severityRank: rank,
    confidence: top.record.confidence,
    confidencePercentFormatted: `${Math.round(top.record.confidence * 100)}%`,
    hazards,
    estimatedLeadTime,
    owner: top.record.owner,
    state: top.record.state,
  };
}
