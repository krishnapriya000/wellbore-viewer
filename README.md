# Wellbore Viewer

Multilateral wellbore trajectory viewer: minimum-curvature surveys, real-time drilling replay, plan-vs-actual
deviation, in 3D. React 19 + TypeScript + React Three Fiber, secured with Microsoft Entra ID.

Behaviour reference: _Multilateral Trajectory Viewer (2).html_. Structure reference: `docs/ARCHITECTURE.md`.

## Quick start

```bash
nvm use                 # Node 24
npm ci
cp .env.example .env.local
# For a first run without a tenant, set VITE_AUTH_MODE=mock in .env.local
npm run dev             # http://localhost:5173
```

With `VITE_AUTH_MODE=entra`, fill the Entra values from the two app registrations (see `docs/AUTH.md`).
The app loads the bundled sample surveys (`public/samples`) until `VITE_API_BASE_URL` is set.

## Scripts

| Script                  | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Dev server on port 5173                                          |
| `npm run check`         | Typecheck + lint + unit tests + production build (run before PR) |
| `npm run test`          | Vitest unit and component tests                                  |
| `npm run test:coverage` | Tests with coverage; `features/**/lib` must stay ≥ 90 % lines    |
| `npm run test:e2e`      | Playwright smoke tests (Chromium + WebKit, mock auth)            |
| `npm run lint`          | ESLint, zero warnings allowed                                    |
| `npm run format`        | Prettier                                                         |

## Layout

```
src/
  app/          shell, routes, providers — composition only
  features/     survey · drilling · viewer · geology · events · construction
    <feature>/  lib/ (pure TS)  model/ (zustand store)  ui/ (React)  index.ts (public API)
  shared/       auth · api · config · units · settings · ui · theme · lib
  test/         setup and fixtures
public/samples  reference sample surveys (3 laterals)
docs/           ARCHITECTURE · AUTH · MIGRATION · QUALITY
```

## Rules that CI enforces

- No MSAL import outside `src/shared/auth` (ESLint `no-restricted-imports`).
- Features import each other only through `@/features/<name>` (ESLint).
- `VITE_AUTH_MODE=mock` fails a production build (`src/shared/config/env.ts`).
- No high-severity `npm audit` findings; zero lint warnings; coverage gate on domain code.
