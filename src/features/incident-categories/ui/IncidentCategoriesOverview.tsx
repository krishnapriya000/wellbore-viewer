import { useMemo, useState, useEffect } from 'react';
import { useIncidentCategoriesStore } from '../model/incidentCategoriesStore';
import type { IncidentFamilyItem, IncidentSeverity, IncidentTypeItem } from '../model/types';
import { isActiveState } from '../model/defaultTaxonomy';
import {
  calculateLeadTimeHazards,
  calculatePredictedLeadTime,
} from '../model/warningPrediction';
import { WarningPredictionAlert } from './WarningPredictionAlert';
import { ParameterSparkline } from './ParameterSparkline';

interface IncidentCategoriesOverviewProps {
  /** Optional override to force a specific family or sub-issue */
  familyId?: string | null;
  typeId?: string | null;
  onBackToOverview?: () => void;
}

const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; color: string; bg: string; border: string; rank: number }
> = {
  crit: {
    label: 'Critical',
    color: 'var(--crit)',
    bg: 'var(--crit-bg)',
    border: 'var(--crit)',
    rank: 4,
  },
  warn: {
    label: 'Warning',
    color: 'var(--warn)',
    bg: 'var(--warn-bg)',
    border: 'var(--warn)',
    rank: 3,
  },
  adv: {
    label: 'Advisory',
    color: 'var(--adv)',
    bg: 'var(--adv-bg)',
    border: 'var(--adv)',
    rank: 2,
  },
  info: {
    label: 'Clear',
    color: 'var(--ok)',
    bg: 'var(--ok-bg)',
    border: 'var(--ok)',
    rank: 1,
  },
};

const TORQUE_SAMPLE = [21400, 21800, 22100, 22400, 22900, 23100, 23500, 23800];
const SPP_SAMPLE = [3440, 3490, 3520, 3580, 3620, 3680, 3710, 3740];

export function IncidentCategoriesOverview({
  familyId,
  typeId,
  onBackToOverview,
}: IncidentCategoriesOverviewProps) {
  const families = useIncidentCategoriesStore((s) => s.families);
  const isLoading = useIncidentCategoriesStore((s) => s.isLoading);
  const error = useIncidentCategoriesStore((s) => s.error);
  const fetchFamilies = useIncidentCategoriesStore((s) => s.fetchFamilies);
  const storeSelectedFamilyId = useIncidentCategoriesStore((s) => s.selectedFamilyId);
  const storeSelectedTypeId = useIncidentCategoriesStore((s) => s.selectedTypeId);
  const selectFamily = useIncidentCategoriesStore((s) => s.selectFamily);
  const selectType = useIncidentCategoriesStore((s) => s.selectType);
  const acknowledgedCodes = useIncidentCategoriesStore((s) => s.acknowledgedCodes);
  const acknowledgeIncident = useIncidentCategoriesStore((s) => s.acknowledgeIncident);
  const updateIncidentConfidence = useIncidentCategoriesStore((s) => s.updateIncidentConfidence);

  // Search filter for overview and sub-issue view
  const [searchTerm, setSearchTerm] = useState('');

  // 3-level Navigation State: 'overview' | 'family' | 'incident'
  const [currentView, setCurrentView] = useState<'overview' | 'family' | 'incident'>(() => {
    if (typeId || storeSelectedTypeId) return 'incident';
    if (familyId || storeSelectedFamilyId) return 'family';
    return 'overview';
  });
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(
    () => familyId || storeSelectedFamilyId || null,
  );
  const [activeTypeId, setActiveTypeId] = useState<string | null>(
    () => typeId || storeSelectedTypeId || null,
  );

  useEffect(() => {
    void fetchFamilies();
  }, [fetchFamilies]);

  // Respond to external prop overrides
  useEffect(() => {
    if (typeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTypeId(typeId);
      if (familyId) setActiveFamilyId(familyId);
      setCurrentView('incident');
    } else if (familyId) {
      setActiveFamilyId(familyId);
      setActiveTypeId(null);
      setCurrentView('family');
    }
  }, [familyId, typeId]);

  // Respond to store selection changes (e.g. from sidebar clicks or alert banner)
  useEffect(() => {
    if (storeSelectedTypeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTypeId(storeSelectedTypeId);
      if (storeSelectedFamilyId) setActiveFamilyId(storeSelectedFamilyId);
      setCurrentView('incident');
    }
  }, [storeSelectedFamilyId, storeSelectedTypeId]);

  // Calculate stats for a given family
  const getFamilyStats = (f: IncidentFamilyItem) => {
    const types = f.incidentTypes ?? [];
    let crit = 0;
    let warn = 0;
    let adv = 0;
    let info = 0;
    let openCount = 0;

    let worstItem: IncidentTypeItem | null = null;
    let worstRank = 0;

    for (const t of types) {
      const rec = t.record;
      const state = rec?.state || 'Clear';
      const isOpen = isActiveState(state);
      const sev: IncidentSeverity = rec?.severity || 'info';

      if (isOpen) {
        openCount++;
        if (sev === 'crit') crit++;
        else if (sev === 'warn') warn++;
        else if (sev === 'adv') adv++;
        else if (sev === 'info') info++;
      } else {
        info++;
      }

      const rank = SEVERITY_CONFIG[sev]?.rank || 1;
      if (rank > worstRank || (rank === worstRank && isOpen)) {
        worstRank = rank;
        worstItem = t;
      }
    }

    let worstSeverity: IncidentSeverity = 'info';
    if (crit > 0) worstSeverity = 'crit';
    else if (warn > 0) worstSeverity = 'warn';
    else if (adv > 0) worstSeverity = 'adv';
    else if (openCount > 0) worstSeverity = 'info';

    return {
      total: types.length,
      openCount,
      crit,
      warn,
      adv,
      info,
      worstSeverity,
      worstItem,
    };
  };

  // Active family object
  const activeFamily = useMemo(() => {
    if (!activeFamilyId) return null;
    return families.find((f) => f.id === activeFamilyId || f.slug === activeFamilyId) || null;
  }, [families, activeFamilyId]);

  // Active incident record object
  const activeIncident = useMemo(() => {
    if (!activeFamily || !activeTypeId) return null;
    const item = activeFamily.incidentTypes.find(
      (t) => t.id === activeTypeId || t.code?.toLowerCase() === activeTypeId.toLowerCase(),
    );
    return item?.record || null;
  }, [activeFamily, activeTypeId]);

  // Lead-Time Warning Hazard Predictions (Monotone Exponential Process matching drillwise-edge-hmi.html)
  const hazardPredictions = useMemo(() => {
    if (!activeIncident) return [];
    return calculateLeadTimeHazards(activeIncident.confidence);
  }, [activeIncident]);

  const predictedLeadTime = useMemo(() => {
    if (!hazardPredictions.length) return '>60 min';
    return calculatePredictedLeadTime(hazardPredictions);
  }, [hazardPredictions]);

  // Global KPI totals
  const globalSummary = useMemo(() => {
    let totalTypes = 0;
    let openIncidents = 0;
    let crit = 0;
    let warn = 0;
    let adv = 0;
    let clear = 0;

    for (const f of families) {
      const stats = getFamilyStats(f);
      totalTypes += stats.total;
      openIncidents += stats.openCount;
      crit += stats.crit;
      warn += stats.warn;
      adv += stats.adv;
      clear += stats.info;
    }

    return { totalTypes, openIncidents, crit, warn, adv, clear };
  }, [families]);

  // Filtered families for search
  const filteredFamilies = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return families;
    return families.filter((f) => {
      const matchName = f.name.toLowerCase().includes(q);
      const matchDesc = f.description?.toLowerCase().includes(q);
      const matchTypes = f.incidentTypes?.some(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code?.toLowerCase().includes(q) ||
          t.record?.evidence.some((e) => e.toLowerCase().includes(q)),
      );
      return matchName || matchDesc || matchTypes;
    });
  }, [families, searchTerm]);

  // Navigation handlers
  const handleTileClick = (fam: IncidentFamilyItem) => {
    setActiveFamilyId(fam.id);
    setActiveTypeId(null);
    setCurrentView('family');
    selectFamily(fam.id);
  };

  const handleSubIssueClick = (famId: string, type: IncidentTypeItem) => {
    setActiveFamilyId(famId);
    setActiveTypeId(type.id);
    setCurrentView('incident');
    selectType(type.id, type.code);
  };

  const handleBack = () => {
    if (currentView === 'incident') {
      selectType(null);
      setActiveTypeId(null);
      setCurrentView('family');
    } else if (currentView === 'family') {
      selectType(null);
      setActiveTypeId(null);
      setActiveFamilyId(null);
      setCurrentView('overview');
      if (onBackToOverview) onBackToOverview();
    }
  };

  const handleGoToOverview = () => {
    selectType(null);
    setActiveTypeId(null);
    setActiveFamilyId(null);
    setCurrentView('overview');
    if (onBackToOverview) onBackToOverview();
  };

  return (
    <div
      className="incident-categories-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg)',
        color: 'var(--ink)',
        padding: '16px 20px',
        gap: '14px',
      }}
    >
      {/* DrillWise Top Alert Banner with Warning Prediction Lead Time (#banner in reference HTML) */}
      <WarningPredictionAlert onNavigateToIncident={handleSubIssueClick} />

      {/* 1. DrillWise HMI Standard Breadcrumb Bar */}
      <div
        className="drillwise-crumbbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {currentView !== 'overview' && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              title="Go back"
              className="btn small"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--accent)',
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <span>← Back</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGoToOverview}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentView === 'overview' ? 'var(--ink)' : 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: currentView === 'overview' ? 700 : 600,
              cursor: currentView === 'overview' ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 4px',
              borderRadius: '4px',
            }}
          >
            <span>⌂ Categories Overview</span>
          </button>

          {activeFamily && (
            <>
              <span style={{ color: 'var(--ink-4)', opacity: 0.8 }}>/</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('family');
                  setActiveTypeId(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentView === 'family' ? 'var(--ink)' : 'var(--accent)',
                  fontSize: '0.85rem',
                  fontWeight: currentView === 'family' ? 700 : 600,
                  cursor: currentView === 'family' ? 'default' : 'pointer',
                  padding: '2px 4px',
                  borderRadius: '4px',
                }}
              >
                {activeFamily.name.replace(/ incidents$/i, '')}
              </button>
            </>
          )}

          {activeIncident && (
            <>
              <span style={{ color: 'var(--ink-4)', opacity: 0.8 }}>/</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' }}>
                {activeIncident.name}
              </span>
            </>
          )}
        </div>

        {/* Search or Quick Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentView === 'overview' && (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter 14 categories or sub-issues…"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                minWidth: '240px',
              }}
              aria-label="Filter incident families"
            />
          )}

          <button
            type="button"
            className="btn small"
            onClick={() => void fetchFamilies()}
            disabled={isLoading}
            style={{
              background: 'var(--surface-2, #172229)',
              border: '1px solid var(--line)',
              color: 'var(--ink-2)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
            title="Refresh from PostgreSQL database"
          >
            {isLoading ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Error state if any */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(255, 92, 120, 0.15)',
            border: '1px solid var(--crit, #ff5c78)',
            color: 'var(--crit, #ff5c78)',
            fontSize: '0.82rem',
          }}
        >
          Failed to fetch incident taxonomy from backend: {error}. Using cached DrillWise dataset.
        </div>
      )}

      {/* =========================================================================
          VIEW 1: CATEGORY TILES OVERVIEW (14 Families)
          ========================================================================= */}
      {currentView === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {/* KPI Strip matching DrillWise Edge HMI */}
          <div
            className="drillwise-kpi-row"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 700 }}>
                Families Monitored
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--f-num, monospace)' }}>
                {families.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>158 Monitored Types</div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 700 }}>
                Active Critical
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--crit)', fontFamily: 'var(--f-num, monospace)' }}>
                {globalSummary.crit}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Immediate Action</div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 700 }}>
                Active Warning
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warn)', fontFamily: 'var(--f-num, monospace)' }}>
                {globalSummary.warn}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Watch & Condition</div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 700 }}>
                Active Advisory
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--adv)', fontFamily: 'var(--f-num, monospace)' }}>
                {globalSummary.adv}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Predictive Trends</div>
            </div>

            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontWeight: 700 }}>
                Acknowledged
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--f-num, monospace)' }}>
                {acknowledgedCodes.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>Operator Logged</div>
            </div>
          </div>

          {/* 14 Family Tiles Grid */}
          <div
            className="drillwise-tiles-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
              gap: '12px',
              alignContent: 'start',
            }}
          >
            {filteredFamilies.map((family, idx) => {
              const stats = getFamilyStats(family);
              const sevConf = SEVERITY_CONFIG[stats.worstSeverity];
              const familyNumber = family.no || idx + 1;
              const familyDisplayName = family.name.replace(/^\d+\.\s*/, '').replace(/ incidents$/i, '');

              return (
                <div
                  key={family.id}
                  className="drillwise-tile-card"
                  onClick={() => handleTileClick(family)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTileClick(family);
                    }
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: `1px solid ${sevConf.border}`,
                    background: `linear-gradient(158deg, ${sevConf.bg} 0%, var(--surface) 70%)`,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '170px',
                  }}
                  title={`View all sub-issues in ${familyDisplayName}`}
                >
                  {/* Left severity accent bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: sevConf.color,
                    }}
                  />

                  {/* Top: Family No + Title + Severity Pill */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--f-num, monospace)',
                          fontSize: '0.68rem',
                          color: 'var(--ink-3)',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          fontWeight: 700,
                        }}
                      >
                        {String(familyNumber).padStart(2, '0')}
                      </span>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '0.94rem',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          flex: 1,
                          lineHeight: 1.3,
                        }}
                      >
                        {familyDisplayName}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: sevConf.color,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: `1px solid ${sevConf.color}`,
                          background: sevConf.bg,
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sevConf.label}
                      </span>
                    </div>

                    {/* Middle: Open Count + Monitored Total */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--f-num, monospace)',
                          fontSize: '2rem',
                          fontWeight: 800,
                          lineHeight: 0.9,
                          color: sevConf.color,
                        }}
                      >
                        {stats.openCount}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>
                        open of {stats.total} monitored
                      </span>
                    </div>

                    {/* Worst Incident State or Status Text */}
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--ink-2)',
                        marginTop: '10px',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {stats.worstItem?.record ? (
                        <span>
                          <strong style={{ color: 'var(--ink)' }}>{stats.worstItem.name}</strong>
                          {' — '}
                          <span style={{ color: sevConf.color }}>{stats.worstItem.record.state}</span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ok, #43e59d)' }}>All monitored issues nominal</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Severity Pip Progress Bar */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '3px',
                      marginTop: '14px',
                      height: '5px',
                    }}
                  >
                    {stats.crit > 0 && (
                      <div
                        style={{
                          flex: stats.crit,
                          borderRadius: '99px',
                          background: SEVERITY_CONFIG.crit.color,
                        }}
                        title={`${stats.crit} critical`}
                      />
                    )}
                    {stats.warn > 0 && (
                      <div
                        style={{
                          flex: stats.warn,
                          borderRadius: '99px',
                          background: SEVERITY_CONFIG.warn.color,
                        }}
                        title={`${stats.warn} warning`}
                      />
                    )}
                    {stats.adv > 0 && (
                      <div
                        style={{
                          flex: stats.adv,
                          borderRadius: '99px',
                          background: SEVERITY_CONFIG.adv.color,
                        }}
                        title={`${stats.adv} advisory`}
                      />
                    )}
                    <div
                      style={{
                        flex: Math.max(1, stats.info),
                        borderRadius: '99px',
                        background: stats.openCount === 0 ? SEVERITY_CONFIG.info.color : 'var(--surface-3)',
                        opacity: stats.openCount === 0 ? 1 : 0.4,
                      }}
                      title={`${stats.info} clear`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SUB-ISSUES LIST (Category Details / Monitored Types)
          ========================================================================= */}
      {currentView === 'family' && activeFamily && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {/* Header Description for the selected Category */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--f-num, monospace)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-4)',
                    border: '1px solid var(--line)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  CATEGORY {String(activeFamily.no || 1).padStart(2, '0')}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ink)' }}>
                  {activeFamily.name}
                </h2>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--ink-3)' }}>
                {activeFamily.description || `Monitored sub-issues and detection algorithms for ${activeFamily.name}.`}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  background: 'var(--surface-2)',
                  color: 'var(--ink-2)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontFamily: 'var(--f-num, monospace)',
                  border: '1px solid var(--line)',
                }}
              >
                {activeFamily.incidentTypes.length} sub-issues monitored
              </span>
              <button
                type="button"
                className="btn small"
                onClick={handleBack}
                aria-label="Back to Overview"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                }}
              >
                Back to Overview
              </button>
            </div>
          </div>

          {/* Sub-issues Cards Grid matching drillwise-edge-hmi.html (.inc-c) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: '12px',
              alignContent: 'start',
            }}
          >
            {activeFamily.incidentTypes.map((type) => {
              const rec = type.record;
              const sev: IncidentSeverity = rec?.severity || 'info';
              const sevConf = SEVERITY_CONFIG[sev];
              const confPct = Math.round((rec?.confidence || 0.65) * 100);
              const isAck = rec ? acknowledgedCodes.includes(rec.code) : false;

              return (
                <div
                  key={type.id}
                  className="drillwise-subissue-card"
                  onClick={() => handleSubIssueClick(activeFamily.id, type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSubIssueClick(activeFamily.id, type);
                    }
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: `1px solid ${sevConf.border}`,
                    background: `linear-gradient(158deg, ${sevConf.bg} 0%, var(--surface) 72%)`,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                  }}
                  title={`Open incident detail for ${type.name}`}
                >
                  {/* Left severity indicator border */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: sevConf.color,
                    }}
                  />

                  {/* Header: Title + State Tag */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.35, flex: 1 }}>
                        {type.name}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: sevConf.color,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          border: `1px solid ${sevConf.color}`,
                          background: sevConf.bg,
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {rec?.state || 'Monitoring'}
                      </span>
                    </div>

                    {/* Evidence summary preview */}
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--ink-2)',
                        marginTop: '8px',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {rec?.evidence[0] || type.description || 'Active baseline telemetry correlation.'}
                    </div>
                  </div>

                  {/* Footer: Confidence + Owner + Code */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--line-soft)',
                      fontSize: '0.72rem',
                      color: 'var(--ink-3)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--f-num, monospace)',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        color: sevConf.color,
                      }}
                    >
                      {confPct}%
                    </span>
                    <span style={{ fontSize: '0.68rem' }}>confidence</span>

                    {isAck && (
                      <span
                        style={{
                          background: 'rgba(67, 229, 157, 0.15)',
                          color: 'var(--ok, #43e59d)',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Ack'd
                      </span>
                    )}

                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--f-num, monospace)', color: 'var(--ink-2)' }}>
                      {rec?.owner || 'Driller'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: INCIDENT DETAIL VIEW (Advisory, Evidence, Likely Causes, Actions)
          ========================================================================= */}
      {currentView === 'incident' && activeIncident && (
        <div
          className="drillwise-detail-view"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.4fr) minmax(300px, 1.1fr)',
            gap: '14px',
            flex: 1,
            alignItems: 'start',
          }}
        >
          {/* Column 1: Confidence Gauge & Real-time Evidence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Confidence Circle Widget */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '18px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 10px' }}>
                <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    fill="none"
                    stroke="var(--line)"
                    strokeWidth="11"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="65"
                    fill="none"
                    stroke={SEVERITY_CONFIG[activeIncident.severity].color}
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 65}
                    strokeDashoffset={2 * Math.PI * 65 * (1 - activeIncident.confidence)}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--f-num, monospace)',
                      fontSize: '2.4rem',
                      fontWeight: 800,
                      color: SEVERITY_CONFIG[activeIncident.severity].color,
                      lineHeight: 1,
                    }}
                  >
                    {Math.round(activeIncident.confidence * 100)}
                    <span style={{ fontSize: '1.1rem', opacity: 0.7, verticalAlign: 'super' }}>%</span>
                  </div>
                  <div style={{ fontSize: '0.66rem', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 700, marginTop: '4px' }}>
                    CONFIDENCE
                  </div>
                </div>
              </div>

              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--ink)' }}>
                {activeIncident.name}
              </h2>
              <div style={{ fontSize: '0.76rem', color: 'var(--ink-3)' }}>
                Code: <strong style={{ color: 'var(--accent)' }}>{activeIncident.code}</strong> · Owner: {activeIncident.owner}
              </div>

              {/* Status and Acknowledge Bar */}
              <div style={{ marginTop: '14px', width: '100%' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => acknowledgeIncident(activeIncident.code)}
                  disabled={acknowledgedCodes.includes(activeIncident.code)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: acknowledgedCodes.includes(activeIncident.code) ? 'default' : 'pointer',
                    background: acknowledgedCodes.includes(activeIncident.code)
                      ? 'var(--surface-3)'
                      : 'var(--accent)',
                    color: acknowledgedCodes.includes(activeIncident.code)
                      ? 'var(--ink-3)'
                      : 'var(--accent-ink)',
                    border: 'none',
                  }}
                >
                  {acknowledgedCodes.includes(activeIncident.code)
                    ? '✓ Advisory Acknowledged'
                    : 'Acknowledge Advisory'}
                </button>
              </div>
            </div>

            {/* Real-time Evidence Box */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  borderBottom: '1px solid var(--line)',
                  paddingBottom: '8px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)' }}>
                  Real-time Evidence
                </h3>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontFamily: 'var(--f-num, monospace)',
                    color: 'var(--adv)',
                    border: '1px solid currentColor',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  PHYS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeIncident.evidence.map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      fontSize: '0.8rem',
                      lineHeight: 1.4,
                      color: 'var(--ink)',
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '2px',
                        background: 'var(--adv)',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                    <span>{ev}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line-soft)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-4)',
                  lineHeight: 1.35,
                }}
              >
                Conditioned on 2 s rig-edge channel feed. Missing channels are marginalised, never imputed.
              </div>
            </div>
          </div>

          {/* Column 2: Advisory Procedures, Constraints, Escalation, Lead-time Hazard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Recommended Action Card */}
            <div
              style={{
                background: 'rgba(67, 229, 157, 0.08)',
                border: '1px solid rgba(67, 229, 157, 0.3)',
                borderLeft: '4px solid var(--ok, #43e59d)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ok, #43e59d)' }}>
                  Recommended Action
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--adv)',
                    border: '1px solid currentColor',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  {activeIncident.sop}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--ink)' }}>
                {activeIncident.recommendedAction}
              </p>
            </div>

            {/* Operational Constraints Card */}
            <div
              style={{
                background: 'rgba(255, 92, 120, 0.08)',
                border: '1px solid rgba(255, 92, 120, 0.3)',
                borderLeft: '4px solid var(--crit, #ff5c78)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--crit, #ff5c78)' }}>
                  Constraints — Do Not Exceed
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    color: 'var(--ink-3)',
                    border: '1px solid var(--line)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontWeight: 700,
                  }}
                >
                  RULE
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--ink)' }}>
                {activeIncident.constraints}
              </p>
            </div>

            {/* Escalation Trigger Card */}
            <div
              style={{
                background: 'rgba(255, 163, 63, 0.08)',
                border: '1px solid rgba(255, 163, 63, 0.3)',
                borderLeft: '4px solid var(--warn, #ffa33f)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--warn, #ffa33f)' }}>
                  Escalation Trigger
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--ink-4)', fontStyle: 'italic' }}>
                  evaluated every 2 s
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--ink)' }}>
                {activeIncident.escalation}
              </p>
            </div>

            {/* Lead-time Hazard Bar (5, 15, 30, 60 min) - Panel 06 */}
            <div
              className="drillwise-hazard-panel"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--f-num, monospace)',
                      fontSize: '0.64rem',
                      color: 'var(--ink-4)',
                      border: '1px solid var(--line)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontWeight: 700,
                    }}
                  >
                    06
                  </span>
                  <h3 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)', fontWeight: 700 }}>
                    Lead-Time Hazard
                  </h3>
                  <span
                    style={{
                      fontSize: '0.64rem',
                      color: 'var(--adv)',
                      border: '1px solid currentColor',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 700,
                    }}
                    title="Gradient Boosted Tree continuous hazard model"
                  >
                    GBT
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: predictedLeadTime.startsWith('~')
                      ? SEVERITY_CONFIG[activeIncident.severity].bg
                      : 'var(--surface-2)',
                    border: `1px solid ${
                      predictedLeadTime.startsWith('~')
                        ? SEVERITY_CONFIG[activeIncident.severity].color
                        : 'var(--line)'
                    }`,
                    fontSize: '0.72rem',
                    fontFamily: 'var(--f-num, monospace)',
                    fontWeight: 700,
                    color: predictedLeadTime.startsWith('~')
                      ? SEVERITY_CONFIG[activeIncident.severity].color
                      : 'var(--ink-2)',
                  }}
                  title="Earliest prediction horizon where cumulative probability P(event) >= 50%"
                >
                  <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.85 }}>Est. Lead:</span>
                  <span>{predictedLeadTime}</span>
                </div>
              </div>

              {/* Monotone formula guarantee note matching HTML reference */}
              <div
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--ink-4)',
                  lineHeight: 1.35,
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--line-soft)',
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>P(event within horizon)</span> · Monotone by construction — P(5) ≤ P(15) ≤ P(30) ≤ P(60). A per-horizon classifier gives no such guarantee.
              </div>

              {/* 4 Prediction Horizons: 5, 15, 30, 60 min */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {hazardPredictions.map((hp) => (
                  <div
                    key={hp.horizonMinutes}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.76rem',
                    }}
                  >
                    <span style={{ width: '52px', fontFamily: 'var(--f-num, monospace)', color: 'var(--ink-2)', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
                      {hp.horizonMinutes} min
                    </span>

                    {/* Bar with 25%, 50%, 75% quartile reference gridlines */}
                    <div
                      style={{
                        flex: 1,
                        height: '18px',
                        background: 'var(--surface-2)',
                        borderRadius: '5px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid var(--line)',
                      }}
                      title={`P(${hp.horizonMinutes} min) = ${hp.percentageFormatted}`}
                    >
                      {/* Internal quartile gridlines at 25%, 50%, 75% */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          background:
                            'repeating-linear-gradient(90deg, transparent 0 24.9%, var(--line) 24.9% 25%)',
                          opacity: 0.7,
                        }}
                      />

                      {/* Smooth animated fill bar with hazard glow */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: '0 auto 0 0',
                          width: hp.percentageFormatted,
                          height: '100%',
                          background: SEVERITY_CONFIG[activeIncident.severity].color,
                          borderRadius: '4px',
                          transition: 'width 0.6s cubic-bezier(0.3, 1, 0.4, 1)',
                          boxShadow: hp.isHighRisk
                            ? `0 0 10px ${SEVERITY_CONFIG[activeIncident.severity].color}`
                            : 'none',
                        }}
                      />
                    </div>

                    {/* Formatted percentage value: highlighted when P >= 50% */}
                    <span
                      style={{
                        width: '52px',
                        fontFamily: 'var(--f-num, monospace)',
                        fontWeight: 750,
                        textAlign: 'right',
                        color: hp.isHighRisk
                          ? SEVERITY_CONFIG[activeIncident.severity].color
                          : 'var(--ink-2)',
                        flexShrink: 0,
                      }}
                    >
                      {hp.percentageFormatted}
                    </span>
                  </div>
                ))}
              </div>

              {/* Interactive Evidence / Confidence Sensitivity Control (Requirement 7) */}
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  fontSize: '0.72rem',
                  color: 'var(--ink-3)',
                }}
              >
                <span>Simulate Evidence Weight:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '210px' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(activeIncident.confidence * 100)}
                    onChange={(e) => {
                      const val = Number(e.target.value) / 100;
                      updateIncidentConfidence(activeIncident.code, val);
                    }}
                    style={{ flex: 1, cursor: 'pointer' }}
                    aria-label="Adjust incident confidence to test warning prediction hazard response"
                  />
                  <span style={{ fontFamily: 'var(--f-num, monospace)', fontWeight: 700, color: 'var(--ink)', width: '36px', textAlign: 'right' }}>
                    {Math.round(activeIncident.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Likely Causes & Live Parameter Telemetry */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Ranked Likely Causes Box */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)' }}>
                  Likely Causes (Ranked Posterior)
                </h3>
                <span
                  style={{
                    fontSize: '0.64rem',
                    color: 'var(--adv)',
                    border: '1px solid currentColor',
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  BN
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeIncident.causes.map((c, i) => {
                  const pct = Math.round(c.p * 100);
                  const barColor =
                    i === 0
                      ? SEVERITY_CONFIG[activeIncident.severity].color
                      : i === 1
                        ? 'var(--warn)'
                        : 'var(--ink-3)';

                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--ink-2)', lineHeight: 1.35, flex: 1, paddingRight: '8px' }}>
                          {c.t}
                        </span>
                        <span style={{ fontFamily: 'var(--f-num, monospace)', fontWeight: 800, color: barColor }}>
                          {pct}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--surface-3)',
                          borderRadius: '99px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: barColor,
                            borderRadius: '99px',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--line-soft)',
                  fontSize: '0.7rem',
                  color: 'var(--ink-4)',
                  lineHeight: 1.35,
                }}
              >
                Posterior distribution normalized across causes. Evaluated through Bayesian cause network.
              </div>
            </div>

            {/* Parameter Sparklines */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-2)' }}>
                  Real-time Channels · 10-Min Trend
                </h3>
              </div>

              <ParameterSparkline
                title="Surface Torque"
                value="23,800"
                unit="ft-lbf"
                deltaPercent={11.3}
                dataPoints={TORQUE_SAMPLE}
                color="var(--warn)"
                height={75}
              />

              <ParameterSparkline
                title="Standpipe Pressure"
                value="3,740"
                unit="psi"
                deltaPercent={8.7}
                dataPoints={SPP_SAMPLE}
                color="var(--adv)"
                height={75}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
