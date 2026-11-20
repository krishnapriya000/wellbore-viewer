import { useLocation, useNavigate } from 'react-router';
import { useIncidentCategoriesStore } from '../model/incidentCategoriesStore';
import type { IncidentFamilyItem, IncidentSeverity } from '../model/types';

interface IncidentSidebarTreeProps {
  isCollapsed?: boolean;
}

const SEVERITY_DOT_COLORS: Record<IncidentSeverity, string> = {
  crit: 'var(--crit, #E5484D)',
  warn: 'var(--warn, #F2A93B)',
  adv: 'var(--adv, #79A6E8)',
  info: 'var(--info, #93A6B3)',
};

export function IncidentSidebarTree({ isCollapsed = false }: IncidentSidebarTreeProps) {
  const families = useIncidentCategoriesStore((s) => s.families);
  const expandedIds = useIncidentCategoriesStore((s) => s.expandedFamilyIds);
  const selectedFamilyId = useIncidentCategoriesStore((s) => s.selectedFamilyId);
  const selectedTypeId = useIncidentCategoriesStore((s) => s.selectedTypeId);
  const toggleFamilyExpanded = useIncidentCategoriesStore((s) => s.toggleFamilyExpanded);
  const selectFamily = useIncidentCategoriesStore((s) => s.selectFamily);
  const selectType = useIncidentCategoriesStore((s) => s.selectType);

  const navigate = useNavigate();
  const location = useLocation();

  if (isCollapsed) {
    return null;
  }

  const handleFamilyClick = (family: IncidentFamilyItem) => {
    selectFamily(family.id);
    toggleFamilyExpanded(family.id);
    if (location.pathname !== '/') {
      void navigate('/');
    }
  };

  const handleTypeClick = (_family: IncidentFamilyItem, typeId: string, code?: string) => {
    selectType(typeId, code);
    if (location.pathname !== '/') {
      void navigate('/');
    }
  };

  return (
    <div className="incident-sidebar-tree" style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 6px 12px' }}>
      {families.map((family) => {
        const isExpanded = expandedIds.includes(family.id);
        const isSelected = selectedFamilyId === family.id;
        const types = family.incidentTypes ?? [];
        const activeCount = family.activeCount ?? 0;
        const critCount = family.criticalCount ?? 0;
        const warnCount = family.warningCount ?? 0;

        return (
          <div key={family.id} className="fam-block" style={{ marginBottom: '2px' }}>
            {/* Family Header Item */}
            <div
              className={`fam-item ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: '5px',
                cursor: 'pointer',
                background: isSelected ? 'var(--surface-2, #172229)' : 'transparent',
                border: isSelected ? '1px solid var(--accent-line, rgba(42,157,178,.4))' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onClick={() => handleFamilyClick(family)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFamilyClick(family);
                }
              }}
              aria-expanded={isExpanded}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--ink-4)',
                    display: 'inline-block',
                    width: '10px',
                    textAlign: 'center',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                  aria-hidden="true"
                >
                  ▶
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontFamily: 'var(--f-ui, sans-serif)',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--ink)' : 'var(--ink-2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={family.name}
                >
                  {family.name}
                </span>
              </div>

              {/* Severity Indicators & Counts */}
              <div
                className="fam-badges"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                  marginLeft: '6px',
                }}
              >
                {critCount > 0 && (
                  <span
                    className="mini c"
                    style={{
                      background: 'var(--crit-bg, rgba(229,72,77,.13))',
                      color: 'var(--crit-ink, #FF8189)',
                      border: '1px solid rgba(229,72,77,.35)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--f-num, monospace)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title={`${critCount} active critical incident`}
                  >
                    ▲ {critCount}
                  </span>
                )}

                {warnCount > 0 && (
                  <span
                    className="mini w"
                    style={{
                      background: 'var(--warn-bg, rgba(242,169,59,.13))',
                      color: 'var(--warn-ink, #F7BF63)',
                      border: '1px solid rgba(242,169,59,.35)',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--f-num, monospace)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title={`${warnCount} active warning`}
                  >
                    ! {warnCount}
                  </span>
                )}

                <span
                  className="mini n"
                  style={{
                    background: 'var(--surface-3, #1E2B34)',
                    color: 'var(--ink-3)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    fontFamily: 'var(--f-num, monospace)',
                    fontWeight: 500,
                  }}
                  title={`${types.length} total monitored types, ${activeCount} active`}
                >
                  {activeCount}/{types.length}
                </span>
              </div>
            </div>

            {/* Expanded Incident Types */}
            {isExpanded && types.length > 0 && (
              <div
                className="fam-kids"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                  paddingLeft: '16px',
                  marginTop: '2px',
                  borderLeft: '1px dashed var(--line)',
                  marginLeft: '12px',
                }}
              >
                {types.map((type) => {
                  const isTypeSelected = selectedTypeId === type.id;
                  const severity = type.record?.severity || 'info';
                  const dotColor = SEVERITY_DOT_COLORS[severity];

                  return (
                    <div
                      key={type.id}
                      className={`fam-kid ${isTypeSelected ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: isTypeSelected ? 'var(--accent-soft, rgba(42,157,178,.14))' : 'transparent',
                        color: isTypeSelected ? 'var(--accent-ink, #5FC9DC)' : 'var(--ink-3)',
                        transition: 'all 0.12s ease',
                      }}
                      onClick={() => handleTypeClick(family, type.id, type.code)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTypeClick(family, type.id, type.code);
                        }
                      }}
                      title={`${type.name} (${type.code || type.id})`}
                    >
                      <span
                        className="sev-dot"
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: dotColor,
                          flexShrink: 0,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontFamily: 'var(--f-ui, sans-serif)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {type.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
