import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError, ApiProvider, createApiClient } from '@/shared/api';
import { AuthContextProvider, type AuthRuntime } from '@/shared/auth';
import { env } from '@/shared/config/env';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

/** Order matters: identity provider → auth context → sign-in gate → API client → server-state cache. */
export function Providers({ auth, children }: { auth: AuthRuntime; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (n, e) => n < 2 && !(e instanceof ApiError && (e.status === 401 || e.status === 403)),
          },
        },
      }),
  );
  const [api] = useState(() => createApiClient(auth.service, env.VITE_API_BASE_URL));
  const { Provider, Gate } = auth;

  return (
    <ErrorBoundary name="Application">
      <Provider>
        <AuthContextProvider service={auth.service}>
          <Gate>
            <ApiProvider client={api}>
              <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
            </ApiProvider>
          </Gate>
        </AuthContextProvider>
      </Provider>
    </ErrorBoundary>
  );
}
