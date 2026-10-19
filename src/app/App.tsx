import { useLayoutEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { useSettings } from '@/shared/settings/settingsStore';
import { AppHeader } from './AppHeader';
import { ViewerPage } from './ViewerPage';

function NotFound() {
  return (
    <main className="layout single">
      <p>Page not found.</p>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <AppHeader />
      {children}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Shell>
        <ViewerPage />
      </Shell>
    ),
  },
  // Future: /wells, /wells/:id, /admin (wrap admin routes in <Authorized permission="well:configure">)
  {
    path: '*',
    element: (
      <Shell>
        <NotFound />
      </Shell>
    ),
  },
]);

export function App() {
  const theme = useSettings((s) => s.theme);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);

  return <RouterProvider router={router} />;
}
