export { AuthContextProvider } from './AuthContextProvider';
export { useAuth, useAuthService, type UseAuth } from './useAuth';
export { Authorized } from './Authorized';
export { can, hasRole, PERMISSIONS, toRoles, type Permission } from './roles';
export { createMockAuth, createMockAuthService } from './mockAuth';
export {
  AuthRedirectError,
  ROLES,
  type AuthRuntime,
  type AuthService,
  type AuthUser,
  type Role,
} from './types';
// createEntraAuth is imported directly by main.tsx so MSAL stays out of test and mock bundles.
