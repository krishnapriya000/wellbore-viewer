import { IncidentCategoriesOverview } from '@/features/incident-categories';

export function IncidentCategoriesPage() {
  return (
    <div
      className="module-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg, #0A1015)',
      }}
    >
      <IncidentCategoriesOverview />
    </div>
  );
}
