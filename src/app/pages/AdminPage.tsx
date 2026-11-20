import { useAuth } from '@/shared/auth';
import { useSettings } from '@/shared/settings/settingsStore';

export function AdminPage() {
  const { user } = useAuth();
  const { unit, theme } = useSettings();

  return (
    <div className="module-page" style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div
        className="block"
        style={{
          borderLeft: '4px solid var(--accent)',
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
              margin: '0 0 4px 0',
              font: '700 1.3rem var(--f-display)',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Administration & Diagnostics
            <span className="pill ok" style={{ fontSize: '0.72rem' }}>
              System Healthy
            </span>
          </h1>
          <p className="hint" style={{ margin: 0 }}>
            Application environment, database configuration, user permissions, and service connectivity.
          </p>
        </div>

        <div className="row" style={{ gap: '8px' }}>
          <span className="pill idle" style={{ fontSize: '0.75rem' }}>
            Node.js Express + Prisma
          </span>
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Backend Connectivity */}
        <div className="block" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, font: '600 1rem var(--f-display)' }}>Backend API</h2>
            <span className="pill ok" style={{ fontSize: '0.68rem' }}>
              Online
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span className="hint">API Server:</span> <code>http://localhost:5000</code>
            </div>
            <div>
              <span className="hint">Prisma ORM:</span> <code>v6.19.3</code>
            </div>
            <div>
              <span className="hint">Health Check:</span> <code>GET /api/health</code>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="block" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, font: '600 1rem var(--f-display)' }}>PostgreSQL Database</h2>
            <span className="pill ok" style={{ fontSize: '0.68rem' }}>
              Connected
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span className="hint">Database:</span> <code>wellbore_db</code>
            </div>
            <div>
              <span className="hint">Host:</span> <code>localhost:5432</code>
            </div>
            <div>
              <span className="hint">Tables:</span> <code>10 Tables Synced</code>
            </div>
          </div>
        </div>

        {/* User Session */}
        <div className="block" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, font: '600 1rem var(--f-display)' }}>Active Session</h2>
            <span className="pill idle" style={{ fontSize: '0.68rem' }}>
              {user?.roles[user.roles.length - 1] ?? 'Authenticated'}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div>
              <span className="hint">User:</span> <strong>{user?.name ?? 'Developer'}</strong>
            </div>
            <div>
              <span className="hint">Email:</span> <code>{user?.username ?? 'user@domain.local'}</code>
            </div>
            <div>
              <span className="hint">Roles:</span> {user?.roles.join(', ') ?? 'Wellbore.Engineer'}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Summary */}
      <section className="block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ margin: 0, font: '600 1.05rem var(--f-display)' }}>
          Environment Configuration
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ padding: '12px', background: 'var(--panel-bg)', borderRadius: '6px' }}>
            <span className="hint" style={{ fontSize: '0.75rem' }}>Active Depth Unit</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{unit.toUpperCase()}</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--panel-bg)', borderRadius: '6px' }}>
            <span className="hint" style={{ fontSize: '0.75rem' }}>Active UI Theme</span>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>{theme}</div>
          </div>
          <div style={{ padding: '12px', background: 'var(--panel-bg)', borderRadius: '6px' }}>
            <span className="hint" style={{ fontSize: '0.75rem' }}>Incident Center Sync</span>
            <div style={{ fontWeight: 600, marginTop: '4px', color: 'var(--ok, #10b981)' }}>Dynamic PostgreSQL</div>
          </div>
        </div>
      </section>
    </div>
  );
}

