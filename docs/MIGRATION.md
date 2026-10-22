# Porting from the reference HTML

Port one row at a time. Each row is one pull request with tests. "Done" = behaves like the HTML, side by side.

| #   | Feature (reference HTML)                                 | Target in this repo                                 | Status                      |
| --- | -------------------------------------------------------- | --------------------------------------------------- | --------------------------- |
| 1   | Minimum curvature, arc interpolation, `atMd`             | `features/survey/lib/mcm.ts`                        | Done                        |
| 2   | Survey parsing CSV, header detection, well column        | `features/survey/lib/parseSurvey.ts` (+ worker)     | Done                        |
| 3   | XLSX upload                                              | SheetJS CDN build inside `parse.worker.ts`          | Done                        |
| 4   | Only the selected wellbore drills; speed; pause; restart | `features/drilling`                                 | Done                        |
| 5   | Plan vs actual deviation, On plan / Watch / Off plan     | `features/drilling/model/deviation.ts`              | Done                        |
| 6   | ft / m switch everywhere (incl. DLS °/30 m, speed)       | `shared/units` + `useUnits()`                       | Done (extend to new panels) |
| 7   | Light / dark tokens in page and 3D                       | `shared/theme/tokens.css` + `useSceneColors`        | Done                        |
| 8   | Bit label, TVD staff + reference line, MD markers        | `features/viewer/ui/layers/ScaleLayer.tsx`          | To do                       |
| 9   | Formations & lithology: TVD walls, MD overrides, % mixes | `features/geology` (types + `formationAt` done)     | To do                       |
| 10  | Lithology sleeve on the wellbore; strip log canvas       | `geology/ui/StripLog.tsx`, `viewer/.../SleeveLayer` | To do                       |
| 11  | Engineering events (21 symbols), 3D markers, feed        | `features/events` (types done)                      | To do                       |
| 12  | Well construction editor, fit checks, 3D casing/cement   | `features/construction` (types + rules done)        | To do                       |
| 13  | Wellbore schematic canvas                                | `construction/ui/Schematic.tsx`                     | To do                       |
| 14  | Readout extras: hole at bit, last shoe, formation, event | `drilling/ui/BitReadout.tsx`                        | To do                       |
| 15  | Persistence of formations / events / construction        | API via `shared/api` + TanStack Query               | To do                       |

Canvas-drawn pieces (lithology patterns, event icons, schematic) port as plain functions in `lib/` that take a
`CanvasRenderingContext2D`; React components only own the `<canvas>` and call them when data changes.
