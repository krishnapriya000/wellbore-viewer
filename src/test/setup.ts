import '@/shared/lib/r3fCompat';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// globals: true is set in vite.config.ts — afterEach is injected globally by Vitest.
// Do NOT import vitest APIs here; setupFiles run before the suite context is established.
afterEach(() => cleanup());

