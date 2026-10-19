import type { ComponentType, ReactNode } from 'react';

/** App roles. Values must match the app-role "Value" field in both Entra app registrations exactly. */
export const ROLES = ['Wellbore.Viewer', 'Wellbore.Engineer', 'Wellbore.Admin'] as const;
export type Role = (typeof ROLES)[number];

export interface AuthUser {
  /** Entra object id (`oid`). Together with tenantId this is the stable key for a person. */
  id: string;
  tenantId: string;
  name: string;
  /** Sign-in name. For display only — never use it for authorisation. */
  username: string;
  roles: Role[];
}

/**
 * The only contract feature code depends on. Entra (MSAL) and the local mock both implement it,
 * so features, tests and Storybook never touch MSAL directly.
 */
export interface AuthService {
  readonly mode: 'entra' | 'mock';
  getUser(): AuthUser | null;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  /** Access token for the wellbore API. Throws AuthRedirectError if the browser is redirecting to sign in. */
  getAccessToken(): Promise<string>;
  /** Notifies when the signed-in user changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export interface AuthRuntime {
  service: AuthService;
  /** Wraps the app with any provider the implementation needs (MsalProvider for Entra). */
  Provider: ComponentType<{ children: ReactNode }>;
  /** Renders children only for a signed-in user; starts sign-in otherwise. */
  Gate: ComponentType<{ children: ReactNode }>;
}

export class AuthRedirectError extends Error {
  constructor() {
    super('Redirecting to Microsoft Entra ID to sign in.');
    this.name = 'AuthRedirectError';
  }
}
