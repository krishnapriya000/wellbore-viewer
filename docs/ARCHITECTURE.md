# Architecture

## Layers

| Layer         | Where                            | May import                                        |
| ------------- | -------------------------------- | ------------------------------------------------- |
| App shell     | `src/app`                        | everything                                        |
| Feature UI    | `src/features/*/ui`              | own model + lib, other features' index, `shared`  |
| Feature state | `src/features/*/model` (zustand) | own lib, other features' index, `shared` (not UI) |
| Domain        | `src/features/*/lib`             | own lib, `zod`. **No React, no three.js**         |
| Shared        | `src/shared/*`                   | `shared` only                                     |

## The eight rules

1. Organise by feature. A feature owns `lib/`, `model/`, `ui/` and exports a public `index.ts`.
2. `lib/` is pure TypeScript and unit-tested in Node.
3. Animation never goes through React state. `BitLayer` advances the clock in `useFrame` and writes the bit MD
   to the drilling store with `setState`; components that need the MD read it with `useThrottledStore`
   (≤ 5 Hz) or select a coarse value (e.g. `stationsReached`) that changes rarely.
4. One React Three Fiber component per 3D layer. Geometry is memoised on a content key (`well.version`,
   station count), so it is rebuilt only when data changes. R3F disposes replaced geometry.
5. Depths are stored in feet. Convert only through `shared/units`.
6. Validate every boundary with zod: files (`parseSurvey`), forms (`StationSchema`), API responses (`createApiClient`).
7. Identity is a shell concern: features use `useAuth()` / `<Authorized>`, never MSAL.
8. UI role checks are display-only. The API enforces permissions.

## Data flow while drilling

```
useFrame (BitLayer) ──advance()──▶ useDrilling.md  (every frame, no React render)
                                      │
             ┌────────────────────────┼─────────────────────────────┐
     ActualLayer selects        BitReadout / DrillControls     LiveFeed selects
     stationsReached(md)        useThrottledStore(200 ms)      feed (changes per station)
     → re-render per station    → re-render ≤ 5 Hz
```

## Adding a feature (geology as the example)

1. `model/geologyStore.ts` — zustand slice holding `Formation[]` and a `version` counter.
2. `ui/FormationEditor.tsx` — react-hook-form + `FormationSchema`; wrap edit controls in `<Authorized permission="geology:edit">`.
3. `features/viewer/ui/layers/GeologyWallsLayer.tsx` — reads the store, memoises textures on `version`.
4. Export the public pieces from `features/geology/index.ts`; add tests next to each file.
