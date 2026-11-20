import React, { useMemo } from 'react';
import { useIncidentCategoriesStore } from '../model/incidentCategoriesStore';
import { getTopPredictedWarning, type PredictedWarningAlertData } from '../model/warningPrediction';
import type { IncidentTypeItem } from '../model/types';

export interface WarningPredictionAlertProps {
  /** Optional custom click handler; if omitted, store selection is updated automatically */
  onNavigateToIncident?: (familyId: string, typeItem: IncidentTypeItem) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Predictive Warning Alert Banner (#banner in DrillWise Edge HMI reference)
 *
 * Driven by the existing 5, 15, 30 and 60-minute monotonic Poisson hazard calculations.
 * Activates whenever any monitored incident has severity rank >= 2 (Advisory, Warning, Critical).
 * Displays the predicted incident name, severity/risk level, prediction probability (confidence),
 * and estimated lead time derived from the hazard horizon model.
 */
export function WarningPredictionAlert({
  onNavigateToIncident,
  className = '',
  style,
}: WarningPredictionAlertProps) {
  const families = useIncidentCategoriesStore((s) => s.families);
  const selectFamily = useIncidentCategoriesStore((s) => s.selectFamily);
  const selectType = useIncidentCategoriesStore((s) => s.selectType);

  const topWarning: PredictedWarningAlertData | null = useMemo(() => {
    return getTopPredictedWarning(families);
  }, [families]);

  if (!topWarning) {
    return null;
  }

  const handleClick = () => {
    selectFamily(topWarning.family.id);
    selectType(topWarning.type.id, topWarning.type.code);
    if (onNavigateToIncident) {
      onNavigateToIncident(topWarning.family.id, topWarning.type);
    }
  };

  const familyCleanName = topWarning.family.name
    .replace(/^\d+\.\s*/, '')
    .replace(/ incidents$/i, '');

  return (
    <div
      id="banner"
      role="alert"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`drillwise-alert-banner sev-${topWarning.severity} ${className}`.trim()}
      aria-label={`Predictive Warning Alert: ${topWarning.severityLabel} — ${topWarning.type.name}, Lead Time ${topWarning.estimatedLeadTime}, Confidence ${topWarning.confidencePercentFormatted}`}
      title={`Click to inspect predictive advisory and lead-time hazard analysis for ${topWarning.type.name}`}
      style={{
        flex: '0 0 auto',
        flexShrink: 0,
        width: '100%',
        minHeight: '74px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Icon Badge (.bn-ico) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: '1 1 auto' }}>
        <div
          className="bn-ico"
          aria-hidden="true"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Text Details (.bn-txt) */}
        <div className="bn-txt">
          <div className="bn-lab">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, currentColor 14%, transparent)',
                border: '1px solid currentColor',
                fontSize: '0.67rem',
                fontWeight: 800,
                letterSpacing: '0.07em',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'currentColor',
                }}
              />
              {topWarning.severityLabel.toUpperCase()}
            </span>
            <span style={{ opacity: 0.45 }}>·</span>
            <span style={{ fontWeight: 750 }}>{familyCleanName.toUpperCase()}</span>
            <span style={{ opacity: 0.45 }}>·</span>
            <span style={{ opacity: 0.85, fontWeight: 700 }}>{topWarning.state.toUpperCase()}</span>
          </div>

          <div className="bn-main">
            {topWarning.type.name}
          </div>
        </div>
      </div>

      {/* Predictive Metadata Strip (.bn-meta) */}
      <div className="bn-meta">
        {/* Prediction Probability (Confidence) */}
        <div className="bn-m">
          <div className="k">Probability</div>
          <div className="v">{topWarning.confidencePercentFormatted}</div>
        </div>

        {/* Estimated Lead Time from 5, 15, 30, 60m Poisson Process */}
        <div className="bn-m">
          <div className="k">Est. Lead Time</div>
          <div
            className="v"
            style={{
              color: topWarning.severity === 'crit'
                ? 'var(--crit)'
                : topWarning.severity === 'warn'
                  ? 'var(--warn)'
                  : 'var(--adv)',
              fontWeight: 850,
            }}
          >
            {topWarning.estimatedLeadTime}
          </div>
        </div>

        {/* Responsible Action Owner */}
        <div className="bn-m">
          <div className="k">Owner</div>
          <div className="v" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-2)' }}>
            {topWarning.owner}
          </div>
        </div>

        {/* Action button */}
        <div className="bn-action-btn" aria-hidden="true">
          <span>Inspect Incident</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
