import { describe, expect, it } from 'vitest';
import {
  calculateHazardLambda,
  calculateLeadTimeHazards,
  calculatePredictedLeadTime,
  clamp,
  deriveSeverityFromConfidence,
  deriveStateFromConfidence,
  getTopPredictedWarning,
  PREDICTION_HORIZONS,
} from './warningPrediction';
import type { IncidentFamilyItem } from './types';

describe('warningPrediction model', () => {
  it('clamps values correctly', () => {
    expect(clamp(-0.5, 0, 1)).toBe(0);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(0.42, 0, 1)).toBe(0.42);
  });

  it('calculates lambda matching drillwise-edge-hmi.html formula', () => {
    // For conf = 0, lambda = 0
    expect(calculateHazardLambda(0)).toBe(0);

    // For conf = 1.0, lambda = 1^2.4 * 0.05 = 0.05
    expect(calculateHazardLambda(1.0)).toBeCloseTo(0.05, 5);

    // For conf = 0.72 (Potential kick / influx sample in HTML reference)
    // 0.72^2.4 * 0.05 = 0.454226 * 0.05 = 0.0227113
    expect(calculateHazardLambda(0.72)).toBeCloseTo(0.022711, 4);
  });

  it('computes monotonic hazard probabilities across horizons [5, 15, 30, 60]', () => {
    const testConfidences = [0.1, 0.35, 0.55, 0.72, 0.88, 1.0];

    for (const conf of testConfidences) {
      const hazards = calculateLeadTimeHazards(conf);
      expect(hazards).toHaveLength(4);

      // Verify horizons are [5, 15, 30, 60]
      expect(hazards.map((h) => h.horizonMinutes)).toEqual([...PREDICTION_HORIZONS]);

      // Verify probabilities increase monotonically: P(5) <= P(15) <= P(30) <= P(60)
      for (let i = 0; i < hazards.length - 1; i++) {
        expect(hazards[i]!.probability).toBeLessThanOrEqual(hazards[i + 1]!.probability);
        expect(hazards[i]!.percentageValue).toBeLessThanOrEqual(hazards[i + 1]!.percentageValue);
      }

      // Verify all probabilities are bounded in [0, 1]
      for (const h of hazards) {
        expect(h.probability).toBeGreaterThanOrEqual(0);
        expect(h.probability).toBeLessThanOrEqual(1);
      }
    }
  });

  it('produces exact numerical probabilities matching HTML reference for Potential kick / influx (conf = 0.72)', () => {
    const hazards = calculateLeadTimeHazards(0.72);

    // Expected values from HTML formula:
    // P(5) = 1 - exp(-0.022711 * 5) = 10.7%
    // P(15) = 1 - exp(-0.022711 * 15) = 28.9%
    // P(30) = 1 - exp(-0.022711 * 30) = 49.4%
    // P(60) = 1 - exp(-0.022711 * 60) = 74.4%
    expect(hazards[0]!.percentageFormatted).toBe('10.7%');
    expect(hazards[1]!.percentageFormatted).toBe('28.9%');
    expect(hazards[2]!.percentageFormatted).toBe('49.4%');
    expect(hazards[3]!.percentageFormatted).toBe('74.4%');

    expect(hazards[0]!.isHighRisk).toBe(false);
    expect(hazards[1]!.isHighRisk).toBe(false);
    expect(hazards[2]!.isHighRisk).toBe(false);
    expect(hazards[3]!.isHighRisk).toBe(true);
  });

  it('determines the earliest horizon with P >= 50% for lead time estimation', () => {
    // For conf = 0.72, only 60m reaches >= 50%
    const hazards72 = calculateLeadTimeHazards(0.72);
    expect(calculatePredictedLeadTime(hazards72)).toBe('~60 min');

    // For conf = 0.85, 30m reaches >= 50%
    const hazards85 = calculateLeadTimeHazards(0.85);
    expect(calculatePredictedLeadTime(hazards85)).toBe('~30 min');

    // For conf = 0.98, 15m reaches >= 50%
    const hazards98 = calculateLeadTimeHazards(0.98);
    expect(calculatePredictedLeadTime(hazards98)).toBe('~15 min');

    // For low confidence (e.g. 0.40), none reach 50% within 60 min
    const hazards40 = calculateLeadTimeHazards(0.4);
    expect(calculatePredictedLeadTime(hazards40)).toBe('>60 min');
  });

  it('dynamically responds to confidence changes', () => {
    const lowHazards = calculateLeadTimeHazards(0.3);
    const highHazards = calculateLeadTimeHazards(0.9);

    for (let i = 0; i < 4; i++) {
      expect(lowHazards[i]!.probability).toBeLessThan(highHazards[i]!.probability);
    }
  });

  it('derives severity dynamically based on prediction confidence', () => {
    expect(deriveSeverityFromConfidence(0.95)).toBe('crit');
    expect(deriveSeverityFromConfidence(0.85)).toBe('crit');
    expect(deriveSeverityFromConfidence(0.84)).toBe('warn');
    expect(deriveSeverityFromConfidence(0.70)).toBe('warn');
    expect(deriveSeverityFromConfidence(0.69)).toBe('adv');
    expect(deriveSeverityFromConfidence(0.50)).toBe('adv');
    expect(deriveSeverityFromConfidence(0.49)).toBe('info');
    expect(deriveSeverityFromConfidence(0.10)).toBe('info');
  });

  it('derives operational state dynamically based on prediction confidence', () => {
    expect(deriveStateFromConfidence(0.9)).toBe('Suspected — critical');
    expect(deriveStateFromConfidence(0.75)).toBe('Active — trending');
    expect(deriveStateFromConfidence(0.55)).toBe('Monitoring');
    expect(deriveStateFromConfidence(0.35)).toBe('Clear');
  });

  it('selects the single top predicted warning matching HTML reference ranking (crit > warn > adv > info)', () => {
    const mockFamilies: IncidentFamilyItem[] = [
      {
        id: 'wc',
        name: 'Well-control',
        typesCount: 2,
        incidentTypes: [
          {
            id: 'wc-kick',
            familyId: 'wc',
            name: 'Potential kick / influx',
            code: 'DW-WC-01',
            createdAt: '',
            updatedAt: '',
            record: {
              id: 'wc-kick',
              familyId: 'wc',
              code: 'DW-WC-01',
              name: 'Potential kick / influx',
              state: 'Monitoring',
              severity: 'warn',
              confidence: 0.72,
              evidence: ['Flow-out 4.1% above flow-in'],
              causes: [{ t: 'Influx', p: 0.5 }],
              recommendedAction: 'Flow-check for 10 min',
              constraints: 'MW <= 12.6 ppg',
              escalation: 'Pit gain > 5 bbl -> shut in',
              sop: 'WC-01',
              owner: 'Driller',
              status: 'Open',
            },
          },
          {
            id: 'wc-gas',
            familyId: 'wc',
            name: 'Gas influx',
            code: 'DW-WC-02',
            createdAt: '',
            updatedAt: '',
            record: {
              id: 'wc-gas',
              familyId: 'wc',
              code: 'DW-WC-02',
              name: 'Gas influx',
              state: 'Clear',
              severity: 'info',
              confidence: 0.45,
              evidence: [],
              causes: [],
              recommendedAction: 'Continue drilling',
              constraints: 'Gas alarm 250 units',
              escalation: 'Total gas > 250 units -> flow-check',
              sop: 'WC-04',
              owner: 'Mud Engineer',
              status: 'Resolved',
            },
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'hc',
        name: 'Hole cleaning & stuck-pipe',
        typesCount: 1,
        incidentTypes: [
          {
            id: 'hc-diff',
            familyId: 'hc',
            name: 'Differential sticking',
            code: 'DW-HC-06',
            createdAt: '',
            updatedAt: '',
            record: {
              id: 'hc-diff',
              familyId: 'hc',
              code: 'DW-HC-06',
              name: 'Differential sticking',
              state: 'Suspected — critical',
              severity: 'crit',
              confidence: 0.88,
              evidence: ['Pick-up overpull 31% above model'],
              causes: [{ t: 'Differential sticking across sand', p: 0.72 }],
              recommendedAction: 'Maintain circulation, apply torque',
              constraints: 'Max overpull 60 klbf',
              escalation: 'No movement after 60 min -> fish',
              sop: 'SP-02',
              owner: 'Supervisor',
              status: 'Open',
            },
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
    ];

    const top = getTopPredictedWarning(mockFamilies);
    expect(top).not.toBeNull();
    expect(top!.type.name).toBe('Differential sticking');
    expect(top!.severity).toBe('crit');
    expect(top!.severityLabel).toBe('Critical');
    expect(top!.confidence).toBe(0.88);
    expect(top!.confidencePercentFormatted).toBe('88%');
    expect(top!.estimatedLeadTime).toBe('~30 min');
    expect(top!.owner).toBe('Supervisor');
    expect(top!.hazards).toHaveLength(4);
  });

  it('suppresses alert when all incidents are Clear (severity rank < 2)', () => {
    const clearFamilies: IncidentFamilyItem[] = [
      {
        id: 'wc',
        name: 'Well-control',
        typesCount: 1,
        incidentTypes: [
          {
            id: 'wc-gas',
            familyId: 'wc',
            name: 'Gas influx',
            code: 'DW-WC-02',
            createdAt: '',
            updatedAt: '',
            record: {
              id: 'wc-gas',
              familyId: 'wc',
              code: 'DW-WC-02',
              name: 'Gas influx',
              state: 'Clear',
              severity: 'info',
              confidence: 0.35,
              evidence: [],
              causes: [],
              recommendedAction: '',
              constraints: '',
              escalation: '',
              sop: '',
              owner: '',
              status: 'Resolved',
            },
          },
        ],
        createdAt: '',
        updatedAt: '',
      },
    ];

    expect(getTopPredictedWarning(clearFamilies)).toBeNull();
  });
});
