# Quality gates

| Gate          | Tool / rule                                                  | Blocks merge  |
| ------------- | ------------------------------------------------------------ | ------------- |
| Types         | `tsc` strict, `noUncheckedIndexedAccess`                     | Yes           |
| Lint          | ESLint + react-hooks (React Compiler rules), 0 warnings      | Yes           |
| Format        | Prettier                                                     | Yes           |
| Unit tests    | Vitest; `features/**/lib` ≥ 90 % lines                       | Yes           |
| E2E           | Playwright, Chromium + WebKit                                | Yes           |
| Dependencies  | `npm audit --audit-level=high`                               | Yes           |
| Bundle        | Initial JS (shell + auth) ≤ 350 kB gzip; three.js chunk lazy | Review        |
| Performance   | 60 fps with 3 wells; `renderer.info.memory` flat over 10 min | Release check |
| Accessibility | axe-core on main screens, keyboard-only pass                 | Release check |
| Headers       | CSP, HSTS, nosniff in `staticwebapp.config.json`             | Release check |
