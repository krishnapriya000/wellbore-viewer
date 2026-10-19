/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Refuse to bundle the mock identity provider. The same rule is checked again at runtime in env.ts.
  if (command === 'build' && mode === 'production') {
    const authMode = loadEnv(mode, process.cwd(), 'VITE_').VITE_AUTH_MODE ?? process.env['VITE_AUTH_MODE'];
    if (authMode === 'mock') throw new Error('VITE_AUTH_MODE=mock is not allowed in a production build.');
  }

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
    build: {
      sourcemap: true,
      // The three.js chunk (~320 kB gzip) is lazy-loaded after sign-in and first paint;
      // the budget that matters is the initial chunk set, checked in CI (see docs/QUALITY.md).
      chunkSizeWarningLimit: 1300,
      rolldownOptions: {
        output: {
          // Keep the 3D engine and the identity library out of the app chunk.
          advancedChunks: {
            groups: [
              { name: 'three', test: /node_modules[\\/](three|@react-three)[\\/]/ },
              { name: 'msal', test: /node_modules[\\/]@azure[\\/]/ },
            ],
          },
        },
      },
    },
    worker: { format: 'es' },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      env: { VITE_AUTH_MODE: 'mock', VITE_MOCK_ROLE: 'Wellbore.Engineer' },
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/features/**/lib/**', 'src/features/**/model/**', 'src/shared/**'],
        thresholds: { 'src/features/**/lib/**': { lines: 90 } },
      },
    },
  };
});
