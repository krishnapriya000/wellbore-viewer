import { useContext, useSyncExternalStore } from 'react';
import { AuthContext } from './context';
import { can, hasRole, type Permission } from './roles';
import type { AuthService, AuthUser, Role } from './types';

export function useAuthService(): AuthService {
  const service = useContext(AuthContext);
  if (!service) throw new Error('useAuth must be used inside <AuthContextProvider>.');
  return service;
}

export interface UseAuth {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  can: (permission: Permission) => boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/** The one hook feature code uses for identity. */
export function useAuth(): UseAuth {
  const service = useAuthService();
  const user = useSyncExternalStore(service.subscribe, service.getUser, service.getUser);
  const roles = user?.roles ?? [];
  return {
    user,
    isAuthenticated: !!user,
    hasRole: (role) => hasRole(roles, role),
    can: (permission) => can(roles, permission),
    signIn: service.signIn,
    signOut: service.signOut,
  };
}
