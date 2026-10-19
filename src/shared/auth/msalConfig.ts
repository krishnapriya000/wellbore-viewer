import {
  BrowserCacheLocation,
  LogLevel,
  type Configuration,
  type RedirectRequest,
} from '@azure/msal-browser';
import type { AppEnv } from '@/shared/config/env';

export function buildMsalConfig(env: AppEnv): Configuration {
  return {
    auth: {
      clientId: env.VITE_ENTRA_SPA_CLIENT_ID!,
      // Single-tenant authority: only accounts in (or invited as guests to) this tenant can sign in.
      authority: env.VITE_ENTRA_AUTHORITY!,
      redirectUri: env.VITE_ENTRA_REDIRECT_URI!,
      postLogoutRedirectUri: env.VITE_ENTRA_REDIRECT_URI!,
    },
    cache: {
      // sessionStorage: tokens die with the tab. Switch to localStorage only if SSO across tabs is required.
      cacheLocation: BrowserCacheLocation.SessionStorage,
    },
    system: {
      loggerOptions: {
        logLevel: import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error,
        piiLoggingEnabled: false,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          if (level === LogLevel.Error) console.error(message);
          else if (level === LogLevel.Warning) console.warn(message);
        },
      },
    },
  };
}

/** Asking for the API scope at sign-in collects consent once, up front. */
export function buildLoginRequest(env: AppEnv): RedirectRequest {
  return { scopes: ['openid', 'profile', env.VITE_API_SCOPE!] };
}
