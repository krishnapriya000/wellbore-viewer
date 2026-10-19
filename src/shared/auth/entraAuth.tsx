import {
  createStandardPublicClientApplication,
  EventType,
  InteractionRequiredAuthError,
  InteractionType,
  type AccountInfo,
  type EventMessage,
  type IPublicClientApplication,
} from '@azure/msal-browser';
import { MsalAuthenticationTemplate, MsalProvider } from '@azure/msal-react';
import type { ReactNode } from 'react';
import type { AppEnv } from '@/shared/config/env';
import { buildLoginRequest, buildMsalConfig } from './msalConfig';
import { toRoles } from './roles';
import { AuthRedirectError, type AuthRuntime, type AuthService, type AuthUser } from './types';

function toUser(account: AccountInfo | null): AuthUser | null {
  if (!account) return null;
  const claims = account.idTokenClaims ?? {};
  return {
    id: account.localAccountId,
    tenantId: account.tenantId,
    name: account.name ?? account.username,
    username: account.username,
    // Roles from the SPA registration's ID token drive the UI only. Replace with GET /api/me once the API exists.
    roles: toRoles(claims['roles']),
  };
}

function hasAccount(message: EventMessage): message is EventMessage & { payload: { account: AccountInfo } } {
  const p = message.payload as { account?: AccountInfo } | null;
  return !!p?.account;
}

export function createEntraAuthService(pca: IPublicClientApplication, env: AppEnv): AuthService {
  const listeners = new Set<() => void>();
  let snapshot: AuthUser | null = toUser(pca.getActiveAccount());
  let snapshotKey = '';

  const refresh = () => {
    const user = toUser(pca.getActiveAccount());
    const key = user ? `${user.tenantId}.${user.id}.${user.roles.join(',')}` : '';
    if (key !== snapshotKey) {
      snapshotKey = key;
      snapshot = user; // a new object only when something changed keeps useSyncExternalStore stable
      listeners.forEach((l) => l());
    }
  };
  refresh();

  pca.addEventCallback((message) => {
    if (
      (message.eventType === EventType.LOGIN_SUCCESS ||
        message.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
      hasAccount(message)
    ) {
      pca.setActiveAccount(message.payload.account);
    }
    if (message.eventType === EventType.LOGOUT_SUCCESS) pca.setActiveAccount(null);
    refresh();
  });

  const scopes = [env.VITE_API_SCOPE!];

  return {
    mode: 'entra',
    getUser: () => snapshot,
    signIn: () => pca.loginRedirect(buildLoginRequest(env)),
    signOut: () => pca.logoutRedirect({ account: pca.getActiveAccount() }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async getAccessToken() {
      const account = pca.getActiveAccount();
      if (!account) {
        await pca.loginRedirect(buildLoginRequest(env));
        throw new AuthRedirectError();
      }
      try {
        // Served from cache, or refreshed silently with the refresh token.
        const result = await pca.acquireTokenSilent({ scopes, account });
        return result.accessToken;
      } catch (error) {
        // Consent revoked, MFA required by Conditional Access, refresh token expired, ...
        if (error instanceof InteractionRequiredAuthError) {
          await pca.acquireTokenRedirect({ scopes, account });
          throw new AuthRedirectError();
        }
        throw error;
      }
    },
  };
}

/**
 * Creates and initialises MSAL before React renders, and processes the redirect response
 * when the browser comes back from Entra ID.
 */
export async function createEntraAuth(env: AppEnv): Promise<AuthRuntime> {
  const pca = await createStandardPublicClientApplication(buildMsalConfig(env));

  const redirect = await pca.handleRedirectPromise();
  if (redirect?.account) pca.setActiveAccount(redirect.account);
  else if (!pca.getActiveAccount()) {
    const [first] = pca.getAllAccounts();
    if (first) pca.setActiveAccount(first);
  }

  const loginRequest = buildLoginRequest(env);

  const Provider = ({ children }: { children: ReactNode }) => (
    <MsalProvider instance={pca}>{children}</MsalProvider>
  );

  const Gate = ({ children }: { children: ReactNode }) => (
    <MsalAuthenticationTemplate
      interactionType={InteractionType.Redirect}
      authenticationRequest={loginRequest}
      loadingComponent={() => <p className="gate-msg">Signing you in with Microsoft…</p>}
      errorComponent={({ error }) => (
        <p className="gate-msg" role="alert">
          Sign-in failed: {error?.errorMessage ?? 'unknown error'}. Contact your administrator if this
          continues.
        </p>
      )}
    >
      {children}
    </MsalAuthenticationTemplate>
  );

  return { service: createEntraAuthService(pca, env), Provider, Gate };
}
