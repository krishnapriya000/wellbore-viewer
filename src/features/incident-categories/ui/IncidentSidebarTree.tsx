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
    if (selectedFamilyId === family.id) {
      toggleFamilyExpanded(family.id);
    } else {
      selectFamily(family.id);
    }
    if (location.pathname !== '/' && location.pathname !== '/incident-categories') {
      void navigate('/');
    }
  };

  const handleTypeClick = (_family: IncidentFamilyItem, typeId: string, code?: string) => {
    selectType(typeId, code);
    if (location.pathname !== '/' && location.pathname !== '/incident-categories') {
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
                padding: '5px 6px',
                borderRadius: '5px',
                cursor: 'pointer',
                background: isSelected ? 'var(--accent-soft, rgba(31,94,115,.14))' : 'transparent',
                border: isSelected ? '1px solid var(--accent, rgba(42,157,178,.4))' : '1px solid transparent',
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
              title={family.name}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFamilyExpanded(family.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px 4px',
                    margin: 0,
                    cursor: 'pointer',
                    color: isExpanded ? 'var(--ink)' : 'var(--ink-4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    lineHeight: 1,
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}
                  aria-label={isExpanded ? `Collapse ${family.name}` : `Expand ${family.name}`}
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    ▶
                  </span>
                </button>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontFamily: 'var(--f-body, sans-serif)',
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
                  marginLeft: '4px',
                }}
              >
                {critCount > 0 && (
                  <span
                    className="mini c"
                    style={{
                      background: 'var(--crit-bg, rgba(229,72,77,.13))',
                      color: 'var(--crit, #bb3326)',
                      border: '1px solid var(--crit, rgba(229,72,77,.35))',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--f-mono, monospace)',
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
                      color: 'var(--warn, #a96f12)',
                      border: '1px solid var(--warn, rgba(242,169,59,.35))',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontSize: '0.62rem',
                      fontFamily: 'var(--f-mono, monospace)',
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
                    background: 'var(--surface-2)',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--line)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    fontSize: '0.64rem',
                    fontFamily: 'var(--f-mono, monospace)',
                    fontWeight: 600,
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
                  paddingLeft: '14px',
                  marginTop: '2px',
                  borderLeft: '1px dashed var(--line)',
                  marginLeft: '10px',
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
                        gap: '6px',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: isTypeSelected ? 'var(--accent-soft, rgba(31,94,115,.14))' : 'transparent',
                        color: isTypeSelected ? 'var(--accent)' : 'var(--ink-2)',
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
                          fontFamily: 'var(--f-body, sans-serif)',
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
