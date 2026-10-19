## What and why

<!-- One or two sentences. Link the issue. -->

## Checklist

- [ ] Follows the architecture rules in `docs/ARCHITECTURE.md` (feature folder, pure `lib/`, no per-frame React state)
- [ ] New logic in `lib/` or `model/` has unit tests; behaviour matches the reference HTML
- [ ] UI checked in light and dark theme, ft and m, at 390 px width
- [ ] Role-gated UI uses `<Authorized>` / `useAuth().can()`; the matching API rule exists or is ticketed
- [ ] No MSAL import outside `src/shared/auth`; no secrets or tenant IDs committed
- [ ] `npm run check` passes locally
