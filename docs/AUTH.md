# Authentication — Microsoft Entra ID

The full setup (app registrations, roles, guests, Conditional Access, API validation) is in the
"Wellbore Viewer — React Architecture, Entra ID Auth & Boilerplate" guide. This file is the developer checklist.

## Local setup

1. Get from the Entra admin: tenant ID, `wellbore-spa` client ID, `wellbore-api` scope URI.
2. Confirm `http://localhost:5173/` is a **Single-page application** redirect URI on `wellbore-spa`.
3. Put the values in `.env.local` with `VITE_AUTH_MODE=entra`, then `npm run dev`.
4. You need an assignment to one of `Wellbore.Viewer` / `Wellbore.Engineer` / `Wellbore.Admin`;
   without one, Entra blocks sign-in (assignment required = yes).

## How it works in code

| File                            | Responsibility                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| `src/main.tsx`                  | Initialises MSAL and handles the redirect **before** React renders                 |
| `src/shared/auth/msalConfig.ts` | Authority, redirect URIs, sessionStorage cache, PII-free logging                   |
| `src/shared/auth/entraAuth.tsx` | `AuthService` over MSAL; silent token → redirect on `InteractionRequiredAuthError` |
| `src/shared/auth/mockAuth.tsx`  | Same interface for local dev and tests; refused in production builds               |
| `src/shared/auth/useAuth.ts`    | `useAuth()` → `user`, `can(permission)`, `hasRole`, `signOut`                      |
| `src/shared/auth/roles.ts`      | Permission → role map (single place to change)                                     |
| `src/shared/api/http.ts`        | Attaches the bearer token, correlation id, validates responses                     |

## Rules

- Never store tokens yourself; MSAL owns the cache.
- Never read the access token's claims in the SPA. Roles for the UI come from the ID token (or `GET /api/me`).
- Never use `username`/`email` as a key. Use `tenantId` + `id` (`tid` + `oid`).
- Mock mode is for local development only; CI builds with `VITE_AUTH_MODE=entra`.
