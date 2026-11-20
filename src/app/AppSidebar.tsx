import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import { IncidentSidebarTree } from '@/features/incident-categories/ui/IncidentSidebarTree';

interface NavItem {
  to: string;
  label: string;
  badge?: string;
  badgeType?: 'crit' | 'warn' | 'info';
  icon: React.ReactNode;
  end?: boolean;
}

const OTHER_NAV_ITEMS: NavItem[] = [
  {
    to: '/incident-categories',
    label: 'Incident Categories',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    to: '/trajectory',
    label: 'Trajectory & Real-Time',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    to: '/lithology',
    label: 'Lithology',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="20" y2="12" />
        <line x1="4" y1="18" x2="20" y2="18" />
        <rect x="2" y="3" width="20" height="18" rx="2" />
      </svg>
    ),
  },
  {
    to: '/ddr',
    label: 'DDR (Daily Drilling)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    to: '/geometry',
    label: 'Wellbore Geometry',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="7" y1="3" x2="7" y2="21" />
        <line x1="17" y1="3" x2="17" y2="21" />
        <line x1="10" y1="7" x2="10" y2="21" />
        <line x1="14" y1="7" x2="14" y2="21" />
        <ellipse cx="12" cy="3" rx="5" ry="1.5" />
      </svg>
    ),
  },
  {
    to: '/admin',
    label: 'Admin',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const families = useIncidentCategoriesStore((s) => s.families);
  const fetchFamilies = useIncidentCategoriesStore((s) => s.fetchFamilies);

  useEffect(() => {
    void fetchFamilies();
  }, [fetchFamilies]);

  // Total active incidents across all families
  const totalActiveIncidents = families.reduce(
    (sum, f) => sum + (f.activeCount ?? 0),
    0,
  );

  return (
    <aside
      className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Main Navigation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Sidebar Header & Toggle */}
      <div className="sidebar-section-title" style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)' }}>
        {!isCollapsed && (
          <span style={{ font: '600 0.8rem var(--f-display)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Well Advisory
          </span>
        )}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
        {/* Incident Center Main Entry */}
        <div style={{ marginBottom: '6px' }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? 'Incident Center' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span
                className="sidebar-item-icon"
                style={{
                  color: totalActiveIncidents > 0 ? 'var(--crit, #E5484D)' : 'var(--ink-2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
              {!isCollapsed && (
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    fontFamily: 'var(--f-display)',
                    letterSpacing: '0.02em',
                  }}
                >
                  Incident Center
                </span>
              )}
            </div>

            {!isCollapsed && (
              <span
                className="sidebar-item-badge"
                style={{
                  background: 'var(--crit-bg, rgba(229,72,77,.13))',
                  color: 'var(--crit-ink, #FF8189)',
                  border: '1px solid rgba(229,72,77,.35)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  fontFamily: 'var(--f-num, monospace)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {totalActiveIncidents}
              </span>
            )}
          </NavLink>

          {/* Collapsible 14 Incident Families Tree */}
          {!isCollapsed && <IncidentSidebarTree />}
        </div>

        <div style={{ height: '1px', background: 'var(--line)', margin: '8px 6px' }} />

        {/* Other Modules Navigation */}
        {!isCollapsed && (
          <div
            style={{
              padding: '4px 10px',
              fontSize: '0.68rem',
              fontFamily: 'var(--f-display)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--ink-4)',
              fontWeight: 600,
            }}
          >
            Engineering & Operations
          </div>
        )}

        {OTHER_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {!isCollapsed && (
              <span className="sidebar-item-label">
                <span>{item.label}</span>
                {item.badge && <span className="sidebar-item-badge">{item.badge}</span>}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Advisory Boundary Footer */}
      {!isCollapsed && (
        <div
          className="sidebar-footer"
          style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-2)',
          }}
        >
          <div style={{ fontSize: '0.66rem', color: 'var(--ink-4)', lineHeight: 1.35, display: 'flex', gap: '6px' }}>
            <span>🔒</span>
            <span>
              <strong>Advisory boundary:</strong> Read-only decision support. Recommendations require supervisory confirmation.
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
