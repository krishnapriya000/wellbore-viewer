import { useEffect, useMemo, useState } from 'react';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import type { IncidentRecord, IncidentSeverity } from '@/features/incident-categories';
import { ParameterSparkline } from '@/features/incident-categories/ui/ParameterSparkline';

const TORQUE_SAMPLE = [21400, 21800, 22100, 22400, 22900, 23100, 23500, 23800];
const SPP_SAMPLE = [3440, 3490, 3520, 3580, 3620, 3680, 3710, 3740];

export function IncidentCenterPage() {
  const families = useIncidentCategoriesStore((s) => s.families);
  const isLoading = useIncidentCategoriesStore((s) => s.isLoading);
  const error = useIncidentCategoriesStore((s) => s.error);
  const fetchFamilies = useIncidentCategoriesStore((s) => s.fetchFamilies);
  const selectedFamilyId = useIncidentCategoriesStore((s) => s.selectedFamilyId);
  const selectedTypeId = useIncidentCategoriesStore((s) => s.selectedTypeId);
  const selectedIncidentCode = useIncidentCategoriesStore((s) => s.selectedIncidentCode);
  const selectIncident = useIncidentCategoriesStore((s) => s.selectIncident);
  const filters = useIncidentCategoriesStore((s) => s.filters);
  const setFilter = useIncidentCategoriesStore((s) => s.setFilter);
  const resetFilters = useIncidentCategoriesStore((s) => s.resetFilters);
  const acknowledgedCodes = useIncidentCategoriesStore((s) => s.acknowledgedCodes);
  const acknowledgeIncident = useIncidentCategoriesStore((s) => s.acknowledgeIncident);

  const [modalIncident, setModalIncident] = useState<IncidentRecord | null>(null);

  useEffect(() => {
    void fetchFamilies();
  }, [fetchFamilies]);

  // Determine active family
  const currentFamily = useMemo(() => {
    if (selectedFamilyId) {
      const found = families.find((f) => f.id === selectedFamilyId);
      if (found) return found;
    }
    return families[0] || null;
  }, [families, selectedFamilyId]);

  // Aggregate global KPI totals
  const globalKpis = useMemo(() => {
    let crit = 0;
    let warn = 0;
    let adv = 0;
    let info = 0;

    for (const f of families) {
      for (const t of f.incidentTypes) {
        const state = t.record?.state || 'Clear';
        const isActive = !/^(Clear|Not applicable|Not active|Cleared|Recovered|Anticipated)/i.test(state);
        if (isActive) {
          const sev = t.record?.severity;
          if (sev === 'crit') crit++;
          else if (sev === 'warn') warn++;
          else if (sev === 'adv') adv++;
          else if (sev === 'info') info++;
        }
      }
    }

    return { crit, warn, adv, info };
  }, [families]);

  // Filter records within current family (or across all families if desired)
  const displayedItems = useMemo(() => {
    if (!currentFamily) return [];

    return currentFamily.incidentTypes.filter((t) => {
      const rec = t.record;
      if (!rec) return true;

      // Severity filter
      if (filters.severity !== 'all' && rec.severity !== filters.severity) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        const isAck = acknowledgedCodes.includes(rec.code);
        const currentStatus = isAck ? 'acknowledged' : rec.status.toLowerCase();
        if (currentStatus !== filters.status.toLowerCase()) {
          return false;
        }
      }

      // Confidence filter
      if (filters.confidence !== 'all') {
        if (filters.confidence === 'hi' && rec.confidence < 0.75) return false;
        if (filters.confidence === 'mid' && (rec.confidence < 0.6 || rec.confidence >= 0.75)) return false;
        if (filters.confidence === 'lo' && rec.confidence >= 0.6) return false;
      }

      return true;
    });
  }, [currentFamily, filters, acknowledgedCodes]);

  // Currently selected incident record for the Context Drawer
  const selectedRecord = useMemo(() => {
    if (selectedIncidentCode) {
      for (const f of families) {
        for (const t of f.incidentTypes) {
          if (t.code?.toLowerCase() === selectedIncidentCode.toLowerCase() && t.record) {
            return t.record;
          }
        }
      }
    }
    if (selectedTypeId) {
      for (const f of families) {
        const t = f.incidentTypes.find((it) => it.id === selectedTypeId);
        if (t?.record) return t.record;
      }
    }
    return displayedItems[0]?.record || null;
  }, [families, selectedIncidentCode, selectedTypeId, displayedItems]);

  const totalMonitoredTypes = families.reduce((acc, f) => acc + (f.typesCount || f.incidentTypes.length), 0);

  // Render severity pill
  const renderSeverityPill = (sev: IncidentSeverity) => {
    switch (sev) {
      case 'crit':
        return (
          <span
            className="sev-pill crit"
            style={{
              background: 'var(--crit-bg, rgba(229,72,77,.13))',
              color: 'var(--crit-ink, #FF8189)',
              border: '1px solid rgba(229,72,77,.35)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
            }}
          >
            <span>▲</span> CRITICAL
          </span>
        );
      case 'warn':
        return (
          <span
            className="sev-pill warn"
            style={{
              background: 'var(--warn-bg, rgba(242,169,59,.13))',
              color: 'var(--warn-ink, #F7BF63)',
              border: '1px solid rgba(242,169,59,.35)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
            }}
          >
            <span>!</span> WARNING
          </span>
        );
      case 'adv':
        return (
          <span
            className="sev-pill adv"
            style={{
              background: 'var(--adv-bg, rgba(121,166,232,.12))',
              color: 'var(--adv-ink, #9CBEF2)',
              border: '1px solid rgba(121,166,232,.35)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
            }}
          >
            <span>ℹ</span> ADVISORY
          </span>
        );
      case 'info':
      default:
        return (
          <span
            className="sev-pill info"
            style={{
              background: 'var(--info-bg, rgba(147,166,179,.11))',
              color: 'var(--info-ink, #AEC0CB)',
              border: '1px solid rgba(147,166,179,.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textTransform: 'uppercase',
            }}
          >
            <span>ℹ</span> INFORMATION
          </span>
        );
    }
  };

  return (
    <div
      className="module-page incident-center-view"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg, #0A1015)',
        color: 'var(--ink, #E4EDF2)',
        padding: '16px 20px',
        gap: '12px',
      }}
    >
      {/* 1. Page Header */}
      <div
        className="pg-head"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '12px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              font: '700 1.5rem var(--f-display)',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Incident Center
            <span
              className="pill ok"
              style={{
                fontSize: '0.7rem',
                background: 'var(--ok-bg, rgba(76,195,138,.12))',
                color: 'var(--ok-ink, #6FD6A4)',
                border: '1px solid rgba(76,195,138,.3)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              ● LIVE
            </span>
          </h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
            {families.length} incident families · {totalMonitoredTypes} monitored incident types ·{' '}
            <strong style={{ color: 'var(--ink)' }}>ARABIAN-DELTA HZ-07</strong> (8½" Production Hole)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn small"
            onClick={() => void fetchFamilies()}
            disabled={isLoading}
            title="Refresh database feed"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
              cursor: 'pointer',
              padding: '5px 12px',
              borderRadius: '4px',
              fontSize: '0.78rem',
            }}
          >
            {isLoading ? 'Refreshing…' : '↻ Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'var(--crit-bg, rgba(229,72,77,.13))',
            border: '1px solid var(--crit, #E5484D)',
            color: 'var(--crit-ink, #FF8189)',
            fontSize: '0.82rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Error communicating with PostgreSQL backend: {error}</span>
          <button
            type="button"
            className="btn small"
            onClick={() => void fetchFamilies()}
            style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* 2. Top KPI Summary Strip */}
      <div
        className="strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '8px',
          background: 'var(--surface, #121A20)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '8px 12px',
        }}
      >
        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Active critical
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--crit-ink, #FF8189)' }}>
            {globalKpis.crit}
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Active warning
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--warn-ink, #F7BF63)' }}>
            {globalKpis.warn}
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Active advisory
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--adv-ink, #9CBEF2)' }}>
            {globalKpis.adv}
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Information
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--ink-2)' }}>
            {globalKpis.info}
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Acknowledged
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--ink)' }}>
            {acknowledgedCodes.length}
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Median ack latency
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--ink)' }}>
            3.2 min
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Alerts last hour
          </div>
          <div style={{ fontSize: '1.25rem', fontFamily: 'var(--f-num)', fontWeight: 700, color: 'var(--ink)' }}>
            14
          </div>
        </div>

        <div className="strip-i">
          <div style={{ fontSize: '0.66rem', textTransform: 'uppercase', color: 'var(--ink-4)', fontFamily: 'var(--f-display)', fontWeight: 600 }}>
            Advisory boundary
          </div>
          <div style={{ fontSize: '0.9rem', fontFamily: 'var(--f-num)', fontWeight: 600, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <span>🔒</span> Read-only
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div
        className="filters-panel"
        style={{
          background: 'var(--surface, #121A20)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.76rem',
        }}
      >
        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Severity</span>
          <select
            value={filters.severity}
            onChange={(e) => setFilter('severity', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option value="all">All</option>
            <option value="crit">Critical</option>
            <option value="warn">Warning</option>
            <option value="adv">Advisory</option>
            <option value="info">Information</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Status</span>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Confidence</span>
          <select
            value={filters.confidence}
            onChange={(e) => setFilter('confidence', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option value="all">All</option>
            <option value="hi">≥ 75%</option>
            <option value="mid">60–74%</option>
            <option value="lo">&lt; 60%</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Well section</span>
          <select
            value={filters.section}
            onChange={(e) => setFilter('section', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>8½" production hole</option>
            <option>12¼" intermediate</option>
            <option>All sections</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Formation</span>
          <select
            value={filters.formation}
            onChange={(e) => setFilter('formation', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Interbedded shale / sand</option>
            <option>Arab sand</option>
            <option>All formations</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Activity</span>
          <select
            value={filters.activity}
            onChange={(e) => setFilter('activity', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Rotary drilling</option>
            <option>Tripping</option>
            <option>Circulating</option>
            <option>Connection</option>
            <option>All activities</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Time range</span>
          <select
            value={filters.timeRange}
            onChange={(e) => setFilter('timeRange', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Last 24 hours</option>
            <option>This section</option>
            <option>Whole well</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Data quality</span>
          <select
            value={filters.dataQuality}
            onChange={(e) => setFilter('dataQuality', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Any</option>
            <option>≥ 90%</option>
            <option>≥ 95%</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Environment</span>
          <select
            value={filters.environment}
            onChange={(e) => setFilter('environment', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Offshore</option>
            <option>Onshore</option>
            <option>Both</option>
          </select>
        </span>

        <span className="fgrp" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--ink-4)', textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 600 }}>Well type</span>
          <select
            value={filters.wellType}
            onChange={(e) => setFilter('wellType', e.target.value)}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '3px 6px', borderRadius: '4px', fontSize: '0.74rem' }}
          >
            <option>Horizontal</option>
            <option>Deviated</option>
            <option>Vertical</option>
            <option>All</option>
          </select>
        </span>

        <span style={{ flex: 1 }} />

        <button
          type="button"
          onClick={resetFilters}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-ink)',
            cursor: 'pointer',
            fontSize: '0.72rem',
            textDecoration: 'underline',
          }}
        >
          Reset
        </button>

        <span style={{ fontFamily: 'var(--f-num)', fontSize: '0.72rem', color: 'var(--ink-3)' }}>
          {displayedItems.length} of {currentFamily?.incidentTypes.length ?? 0} shown
        </span>
      </div>

      {/* 4. Main Split: Incident Center Table + Evidence & Procedure Panel */}
      <div
        className="incident-content-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '12px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left: Incident Center Table Section */}
        <div
          className="panel"
          style={{
            background: 'var(--surface, #121A20)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Table Section Header */}
          <div
            className="p-head"
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontFamily: 'var(--f-display)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {currentFamily ? `${currentFamily.name.toUpperCase()} INCIDENTS` : 'INCIDENTS'}
              </h3>
              {currentFamily && (
                <>
                  <span
                    className="chip"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--ink-2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--f-num)',
                    }}
                  >
                    {currentFamily.activeCount ?? 0} active
                  </span>
                  <span
                    className="chip"
                    style={{
                      background: (currentFamily.criticalCount ?? 0) > 0 ? 'var(--crit-bg)' : 'var(--surface-3)',
                      color: (currentFamily.criticalCount ?? 0) > 0 ? 'var(--crit-ink)' : 'var(--ink-3)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--f-num)',
                      fontWeight: (currentFamily.criticalCount ?? 0) > 0 ? 700 : 400,
                    }}
                  >
                    {currentFamily.criticalCount ?? 0} critical
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--ink-4)',
                  fontFamily: 'var(--f-num)',
                }}
              >
                scroll right for actions, constraints, escalation, owner and status →
              </span>
              <button
                type="button"
                className="btn small"
                onClick={() => {
                  const dataStr = JSON.stringify(currentFamily, null, 2);
                  const blob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentFamily?.slug || 'incident-family'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  fontSize: '0.72rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📄 Export family
              </button>
            </div>
          </div>

          {/* Table Container with Horizontal Scroll */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: '380px' }}>
            {displayedItems.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--ink-3)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  No monitored incidents match the current filters in this family.
                </p>
                <button
                  type="button"
                  className="btn small primary"
                  onClick={resetFilters}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Reset Filter Selection
                </button>
              </div>
            ) : (
              <table
                className="incident-table dt"
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.78rem',
                  textAlign: 'left',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--line)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                    }}
                  >
                    <th style={{ padding: '8px 12px', minWidth: '180px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      INCIDENT
                    </th>
                    <th style={{ padding: '8px 10px', minWidth: '110px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      CURRENT STATE
                    </th>
                    <th style={{ padding: '8px 10px', minWidth: '120px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      SEVERITY
                    </th>
                    <th style={{ padding: '8px 10px', minWidth: '60px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      CONF.
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '240px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      REAL-TIME EVIDENCE
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '220px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      LIKELY CAUSES
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '240px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      RECOMMENDED ACTIONS
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '200px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      CONSTRAINTS
                    </th>
                    <th style={{ padding: '8px 12px', minWidth: '200px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      ESCALATION TRIGGER
                    </th>
                    <th style={{ padding: '8px 10px', minWidth: '100px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      OWNER
                    </th>
                    <th style={{ padding: '8px 10px', minWidth: '90px', fontWeight: 600, color: 'var(--ink-2)' }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((item) => {
                    const rec = item.record;
                    if (!rec) return null;

                    const isSelected = selectedRecord?.code === rec.code;
                    const isAck = acknowledgedCodes.includes(rec.code);
                    const statusText = isAck ? 'Acknowledged' : rec.status;
                    const confPct = Math.round((rec.confidence || 0) * 100);

                    return (
                      <tr
                        key={item.id}
                        className={`clk ${isSelected ? 'rowsel' : ''}`}
                        onClick={() => selectIncident(rec.code)}
                        style={{
                          borderBottom: '1px solid var(--line-soft, #1A272F)',
                          background: isSelected ? 'var(--surface-3, #1E2B34)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.1s ease',
                        }}
                      >
                        {/* Incident Name + Code */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top' }}>
                          <strong style={{ color: 'var(--ink)', display: 'block', fontSize: '0.82rem' }}>
                            {rec.name}
                          </strong>
                          <span
                            style={{
                              fontFamily: 'var(--f-num, monospace)',
                              fontSize: '0.68rem',
                              color: 'var(--ink-4)',
                            }}
                          >
                            {rec.code}
                          </span>
                        </td>

                        {/* Current State */}
                        <td style={{ padding: '9px 10px', verticalAlign: 'top', color: 'var(--ink-2)' }}>
                          <span style={{ fontWeight: rec.state === 'Monitoring' ? 600 : 400 }}>
                            {rec.state}
                          </span>
                        </td>

                        {/* Severity */}
                        <td style={{ padding: '9px 10px', verticalAlign: 'top' }}>
                          {renderSeverityPill(rec.severity)}
                        </td>

                        {/* Confidence */}
                        <td style={{ padding: '9px 10px', verticalAlign: 'top', fontFamily: 'var(--f-num)' }}>
                          <strong>{confPct}%</strong>
                        </td>

                        {/* Real-time Evidence */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top', lineHeight: 1.35 }}>
                          <span>{rec.evidence[0] || '—'}</span>
                          {rec.evidence.length > 1 && (
                            <span
                              style={{
                                marginLeft: '6px',
                                fontSize: '0.68rem',
                                color: 'var(--accent-ink)',
                                fontFamily: 'var(--f-num)',
                              }}
                            >
                              +{rec.evidence.length - 1} more
                            </span>
                          )}
                        </td>

                        {/* Likely Causes */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top', lineHeight: 1.35 }}>
                          {rec.causes.slice(0, 2).map((c, i) => (
                            <div key={i} style={{ marginBottom: '2px' }}>
                              <span>{c.t} </span>
                              <strong
                                style={{
                                  fontFamily: 'var(--f-num)',
                                  color: 'var(--accent-ink)',
                                  fontSize: '0.72rem',
                                }}
                              >
                                {Math.round(c.p * 100)}%
                              </strong>
                            </div>
                          ))}
                        </td>

                        {/* Recommended Actions */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top', lineHeight: 1.35, color: 'var(--ink)' }}>
                          {rec.recommendedAction}
                        </td>

                        {/* Constraints */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top', lineHeight: 1.35, color: 'var(--ink-3)' }}>
                          {rec.constraints}
                        </td>

                        {/* Escalation Trigger */}
                        <td style={{ padding: '9px 12px', verticalAlign: 'top', lineHeight: 1.35, color: 'var(--ink-3)' }}>
                          {rec.escalation}
                        </td>

                        {/* Owner */}
                        <td style={{ padding: '9px 10px', verticalAlign: 'top', color: 'var(--ink-2)' }}>
                          {rec.owner}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '9px 10px', verticalAlign: 'top' }}>
                          <span
                            className="chip"
                            style={{
                              background: isAck ? 'var(--ok-bg)' : 'var(--surface-3)',
                              color: isAck ? 'var(--ok-ink)' : 'var(--ink-3)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                            }}
                          >
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Evidence & Procedure Context Panel */}
        <div
          className="context-panel"
          style={{
            background: 'var(--surface, #121A20)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div
            className="p-head"
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--line)',
              background: 'var(--surface-2)',
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '0.88rem',
                fontFamily: 'var(--f-display)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--ink)',
              }}
            >
              {selectedRecord ? `Context — ${selectedRecord.name}` : 'Evidence & Procedure'}
            </h3>
          </div>

          <div
            className="p-body"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {selectedRecord ? (
              <>
                {/* Meta Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {renderSeverityPill(selectedRecord.severity)}
                  <span
                    className="chip"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--ink-2)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'var(--f-num)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {selectedRecord.code}
                  </span>
                  <span
                    className="chip"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--ink-3)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                    }}
                  >
                    Owner: <strong style={{ color: 'var(--ink)' }}>{selectedRecord.owner}</strong>
                  </span>
                </div>

                {/* Real-time Evidence Section */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--f-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-4)',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Real-time evidence
                  </div>
                  <div className="ev-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedRecord.evidence.map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '6px',
                          fontSize: '0.74rem',
                          color: 'var(--ink)',
                          lineHeight: 1.35,
                        }}
                      >
                        <span style={{ color: 'var(--accent-ink)', fontSize: '0.65rem' }}>▸</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Likely Causes Breakdown */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--f-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-4)',
                      fontWeight: 600,
                      marginBottom: '6px',
                    }}
                  >
                    Likely causes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedRecord.causes.map((c, i) => (
                      <div key={i} style={{ fontSize: '0.74rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--ink-2)' }}>{c.t}</span>
                          <span style={{ fontFamily: 'var(--f-num)', fontWeight: 600, color: 'var(--accent-ink)' }}>
                            {Math.round(c.p * 100)}%
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.round(c.p * 100)}%`,
                              height: '100%',
                              background: i === 0 ? 'var(--accent)' : 'var(--ink-3)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constraints Callout */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--f-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-4)',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Constraints
                  </div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--ink-2)',
                      background: 'var(--surface-2)',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      borderLeft: '3px solid var(--warn, #F2A93B)',
                      lineHeight: 1.35,
                    }}
                  >
                    {selectedRecord.constraints}
                  </div>
                </div>

                {/* Approved Procedure / SOP */}
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: 'var(--f-display)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--ink-4)',
                      fontWeight: 600,
                      marginBottom: '4px',
                    }}
                  >
                    Approved procedure
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      fontSize: '0.74rem',
                    }}
                  >
                    <a
                      href="#procedure"
                      onClick={(e) => {
                        e.preventDefault();
                        setModalIncident(selectedRecord);
                      }}
                      style={{
                        color: 'var(--accent-ink)',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      📄 {selectedRecord.sop}
                    </a>
                    <span style={{ fontSize: '0.66rem', color: 'var(--ink-4)', fontFamily: 'var(--f-num)' }}>
                      Revision 4 · Approved · Owner: Drilling Operations
                    </span>
                  </div>
                </div>

                {/* Live Sparkline Chart */}
                <ParameterSparkline
                  title="Surface torque"
                  value="23,800"
                  unit="ft-lbf"
                  deltaPercent={11.3}
                  dataPoints={TORQUE_SAMPLE}
                  color="var(--warn, #F2A93B)"
                  height={90}
                />

                {/* Actions Button */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => acknowledgeIncident(selectedRecord.code)}
                    disabled={acknowledgedCodes.includes(selectedRecord.code)}
                    style={{
                      background: acknowledgedCodes.includes(selectedRecord.code)
                        ? 'var(--surface-3)'
                        : 'var(--accent, #2A9DB2)',
                      border: 'none',
                      color: '#fff',
                      padding: '7px 12px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      fontSize: '0.76rem',
                      cursor: acknowledgedCodes.includes(selectedRecord.code) ? 'default' : 'pointer',
                    }}
                  >
                    {acknowledgedCodes.includes(selectedRecord.code)
                      ? '✓ Advisory Acknowledged'
                      : 'Acknowledge Advisory'}
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setModalIncident(selectedRecord)}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                    }}
                  >
                    Open Full Incident Record
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '0.76rem',
                    color: 'var(--ink-3)',
                    background: 'var(--surface-2)',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--line-soft)',
                    lineHeight: 1.45,
                  }}
                >
                  Select an incident to load its evidence, constraints and the approved procedure. The detail drawer opens with the full 13-section record.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <ParameterSparkline
                    title="Surface torque"
                    value="23,800"
                    unit="ft-lbf"
                    deltaPercent={11.3}
                    dataPoints={TORQUE_SAMPLE}
                    color="var(--warn, #F2A93B)"
                  />
                  <ParameterSparkline
                    title="Standpipe pressure"
                    value="3,740"
                    unit="psi"
                    deltaPercent={8.7}
                    dataPoints={SPP_SAMPLE}
                    color="var(--s1, #2A9DB2)"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full Record Modal / Drawer */}
      {modalIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-incident-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setModalIncident(null)}
        >
          <div
            style={{
              background: 'var(--surface, #121A20)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--f-num)', color: 'var(--accent-ink)' }}>
                  {modalIncident.code} · {modalIncident.familyId.toUpperCase()}
                </span>
                <h2 id="modal-incident-title" style={{ margin: '4px 0 0 0', fontSize: '1.25rem', color: 'var(--ink)' }}>
                  {modalIncident.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalIncident(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-3)',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {renderSeverityPill(modalIncident.severity)}
              <span className="chip" style={{ background: 'var(--surface-3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                State: <strong>{modalIncident.state}</strong>
              </span>
              <span className="chip" style={{ background: 'var(--surface-3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                Owner: <strong>{modalIncident.owner}</strong>
              </span>
              <span className="chip" style={{ background: 'var(--surface-3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.74rem' }}>
                Confidence: <strong>{Math.round(modalIncident.confidence * 100)}%</strong>
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                1. Recommended Action
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45, color: 'var(--ink)' }}>
                {modalIncident.recommendedAction}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                2. Operational Constraints
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45, color: 'var(--warn-ink)' }}>
                {modalIncident.constraints}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                3. Escalation Trigger
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45, color: 'var(--crit-ink)' }}>
                {modalIncident.escalation}
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                4. Approved Operating Procedure
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.45, color: 'var(--accent-ink)' }}>
                📄 {modalIncident.sop}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn small"
                onClick={() => setModalIncident(null)}
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--line)',
                  color: 'var(--ink)',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
