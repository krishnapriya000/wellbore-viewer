import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import type { IncidentSeverity } from '@/features/incident-categories';

const SEVERITY_DOT_COLORS: Record<IncidentSeverity, string> = {
  crit: 'var(--crit, #E5484D)',
  warn: 'var(--warn, #F2A93B)',
  adv: 'var(--adv, #79A6E8)',
  info: 'var(--info, #93A6B3)',
};

export function IncidentCategoriesPage() {
  const families = useIncidentCategoriesStore((s) => s.families);
  const isLoading = useIncidentCategoriesStore((s) => s.isLoading);
  const error = useIncidentCategoriesStore((s) => s.error);
  const expandedIds = useIncidentCategoriesStore((s) => s.expandedFamilyIds);
  const fetchFamilies = useIncidentCategoriesStore((s) => s.fetchFamilies);
  const toggleExpanded = useIncidentCategoriesStore((s) => s.toggleFamilyExpanded);
  const expandAll = useIncidentCategoriesStore((s) => s.expandAll);
  const collapseAll = useIncidentCategoriesStore((s) => s.collapseAll);
  const selectType = useIncidentCategoriesStore((s) => s.selectType);

  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void fetchFamilies();
  }, [fetchFamilies]);

  const filteredFamilies = families.filter((f) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const matchesFamily =
      f.name.toLowerCase().includes(term) || (f.description && f.description.toLowerCase().includes(term));
    const matchesType = f.incidentTypes.some(
      (t) =>
        t.name.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term)) ||
        (t.code && t.code.toLowerCase().includes(term)),
    );
    return matchesFamily || matchesType;
  });

  const totalTypesCount = families.reduce((acc, f) => acc + (f.typesCount || f.incidentTypes.length), 0);
  const totalActiveCount = families.reduce((acc, f) => acc + (f.activeCount || 0), 0);

  const handleSelectIncident = (typeId: string, code?: string) => {
    selectType(typeId, code);
    void navigate('/');
  };

  return (
    <div
      className="module-page"
      style={{
        padding: '20px 24px',
        overflowY: 'auto',
        flex: 1,
        background: 'var(--bg, #0A1015)',
        color: 'var(--ink, #E4EDF2)',
      }}
    >
      {/* Title & Controls */}
      <div
        className="block"
        style={{
          borderLeft: '4px solid var(--accent, #2A9DB2)',
          background: 'var(--surface, #121A20)',
          border: '1px solid var(--line)',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 6px 0',
                font: '700 1.4rem var(--f-display)',
                letterSpacing: '0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              Incident Categories & Taxonomy
              <span
                className="pill ok"
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--ok-bg)',
                  color: 'var(--ok-ink)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                PostgreSQL
              </span>
              <span
                className="pill idle"
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--surface-3)',
                  color: 'var(--ink-2)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                }}
              >
                {families.length} Families · {totalTypesCount} Monitored Types · {totalActiveCount} Active
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-3)' }}>
              14 standard incident families mapped to granular detection patterns, real-time evidence, and advisory procedures.
            </p>
          </div>

          <div className="row" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn small"
              onClick={() => void fetchFamilies()}
              disabled={isLoading}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
              title="Refetch categories from backend"
            >
              {isLoading ? 'Loading…' : '↻ Refresh'}
            </button>
            <button
              type="button"
              className="btn small"
              onClick={expandAll}
              disabled={families.length === 0}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              Expand All
            </button>
            <button
              type="button"
              className="btn small"
              onClick={collapseAll}
              disabled={families.length === 0}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '0.76rem',
                cursor: 'pointer',
              }}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Search input */}
        <div style={{ marginTop: '14px' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search incident families, incident codes (e.g. DW-WC-01), or keywords…"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '7px 12px',
              fontSize: '0.82rem',
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '5px',
              color: 'var(--ink)',
            }}
            aria-label="Search incident categories"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'var(--crit-bg, rgba(229,72,77,.13))',
            border: '1px solid var(--crit, #ef4444)',
            color: 'var(--crit-ink, #ef4444)',
            marginBottom: '16px',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Error loading categories from backend: {error}</span>
          <button
            type="button"
            onClick={() => void fetchFamilies()}
            style={{ background: 'transparent', border: '1px solid currentColor', color: 'inherit', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && families.length === 0 && (
        <div className="block" style={{ padding: '36px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px' }}>
          <p style={{ color: 'var(--ink-3)', margin: 0 }}>Fetching incident taxonomy from database…</p>
        </div>
      )}

      {/* Empty search results */}
      {!isLoading && filteredFamilies.length === 0 && (
        <div className="block" style={{ padding: '36px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '6px' }}>
          <p style={{ color: 'var(--ink-3)', margin: 0 }}>No incident categories match &quot;{searchTerm}&quot;.</p>
        </div>
      )}

      {/* Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredFamilies.map((family) => {
          const isExpanded = expandedIds.includes(family.id) || Boolean(searchTerm.trim());
          const types = family.incidentTypes ?? [];
          const critCount = family.criticalCount ?? 0;
          const warnCount = family.warningCount ?? 0;
          const activeCount = family.activeCount ?? 0;

          return (
            <div
              key={family.id}
              className="block"
              style={{
                padding: '0',
                overflow: 'hidden',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                background: 'var(--surface, #121A20)',
              }}
            >
              {/* Family Header */}
              <button
                type="button"
                onClick={() => toggleExpanded(family.id)}
                aria-expanded={isExpanded}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: isExpanded ? 'var(--surface-2, #172229)' : 'var(--surface, #121A20)',
                  border: 'none',
                  borderBottom: isExpanded ? '1px solid var(--line)' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--ink-4)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      display: 'inline-block',
                      width: '12px',
                      textAlign: 'center',
                    }}
                  >
                    ▶
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--ink)', fontFamily: 'var(--f-display)', letterSpacing: '0.02em' }}>
                      {family.name}
                    </strong>
                    {family.description && (
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--ink-3)' }}>
                        {family.description}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {critCount > 0 && (
                    <span
                      className="mini c"
                      style={{
                        background: 'var(--crit-bg)',
                        color: 'var(--crit-ink)',
                        border: '1px solid rgba(229,72,77,.35)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        fontFamily: 'var(--f-num)',
                      }}
                    >
                      ▲ {critCount} crit
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span
                      className="mini w"
                      style={{
                        background: 'var(--warn-bg)',
                        color: 'var(--warn-ink)',
                        border: '1px solid rgba(242,169,59,.35)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        fontFamily: 'var(--f-num)',
                      }}
                    >
                      ! {warnCount} warn
                    </span>
                  )}
                  <span
                    className="pill idle"
                    style={{
                      fontSize: '0.72rem',
                      background: 'var(--surface-3)',
                      color: 'var(--ink-2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--f-num)',
                    }}
                  >
                    {activeCount}/{types.length} active
                  </span>
                </div>
              </button>

              {/* Incident Types Grid */}
              {isExpanded && (
                <div style={{ padding: '14px 16px', background: 'var(--bg, #0A1015)' }}>
                  {types.length === 0 ? (
                    <p style={{ fontStyle: 'italic', margin: '4px 0', fontSize: '0.8rem', color: 'var(--ink-4)' }}>
                      No granular incident types registered for this family yet.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {types.map((type) => {
                        const rec = type.record;
                        const severity = rec?.severity || 'info';
                        const dotColor = SEVERITY_DOT_COLORS[severity];

                        return (
                          <div
                            key={type.id}
                            style={{
                              background: 'var(--surface, #121A20)',
                              border: '1px solid var(--line)',
                              borderRadius: '6px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              transition: 'border-color 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    backgroundColor: dotColor,
                                    flexShrink: 0,
                                  }}
                                />
                                <strong style={{ fontSize: '0.84rem', color: 'var(--ink)' }}>{type.name}</strong>
                              </div>
                              <span
                                style={{
                                  fontFamily: 'var(--f-num, monospace)',
                                  fontSize: '0.68rem',
                                  color: 'var(--accent-ink)',
                                }}
                              >
                                {type.code}
                              </span>
                            </div>

                            {rec?.recommendedAction && (
                              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.35 }}>
                                {rec.recommendedAction}
                              </p>
                            )}

                            <div
                              style={{
                                marginTop: 'auto',
                                paddingTop: '8px',
                                borderTop: '1px solid var(--line-soft)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontSize: '0.7rem', color: 'var(--ink-4)' }}>
                                State: <strong style={{ color: 'var(--ink-2)' }}>{rec?.state || 'Monitoring'}</strong>
                              </span>
                              <button
                                type="button"
                                className="btn small"
                                onClick={() => handleSelectIncident(type.id, type.code)}
                                style={{
                                  background: 'var(--surface-2)',
                                  border: '1px solid var(--line)',
                                  color: 'var(--accent-ink)',
                                  padding: '3px 8px',
                                  borderRadius: '3px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                }}
                              >
                                View in Center →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
