import { useLayoutEffect, useMemo } from 'react';
import { createBrowserRouter, createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { useSettings } from '@/shared/settings/settingsStore';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import {
  AdminPage,
  DdrPage,
  IncidentCategoriesPage,
  IncidentCenterPage,
  LithologyPage,
  NotFoundPage,
  TrajectoryPage,
  WellboreGeometryPage,
} from './pages';

function AppLayout() {
  return (
    <div className="app">
      <AppHeader />
      <div className="app-body">
        <AppSidebar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <IncidentCenterPage /> },
      { path: 'incident-categories', element: <IncidentCategoriesPage /> },
      { path: 'trajectory', element: <TrajectoryPage /> },
      { path: 'viewer', element: <TrajectoryPage /> },
      { path: 'lithology', element: <LithologyPage /> },
      { path: 'ddr', element: <DdrPage /> },
      { path: 'geometry', element: <WellboreGeometryPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

const defaultRouter = createBrowserRouter(routes);

export function App({ initialPath }: { initialPath?: string } = {}) {
  const theme = useSettings((s) => s.theme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  const router = useMemo(() => {
    if (initialPath) {
      return createMemoryRouter(routes, { initialEntries: [initialPath] });
    }
    return defaultRouter;
  }, [initialPath]);

  return <RouterProvider router={router} />;
}
