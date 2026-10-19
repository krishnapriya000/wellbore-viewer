import { Fragment, type ReactNode } from 'react';
import type { AuthRuntime, AuthService, AuthUser, Role } from './types';

/**
 * Local-development and test stand-in for Entra ID. env.ts refuses it in production builds.
 * The token it returns is meaningless; a real API must reject it.
 */
export function createMockAuthService(role: Role, overrides: Partial<AuthUser> = {}): AuthService {
  const signedIn: AuthUser = {
    id: '00000000-0000-0000-0000-00000000dev1',
    tenantId: '00000000-0000-0000-0000-000000000000',
    name: 'Local Developer',
    username: 'dev@localhost',
    roles: [role],
    ...overrides,
  };
  let user: AuthUser | null = signedIn;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    mode: 'mock',
    getUser: () => user,
    async signIn() {
      user = signedIn;
      emit();
    },
    async signOut() {
      user = null;
      emit();
    },
    async getAccessToken() {
      return 'mock-token';
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function createMockAuth(role: Role): AuthRuntime {
  const service = createMockAuthService(role);
  return {
    service,
    Provider: Fragment,
    Gate: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
}
