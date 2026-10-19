import { defineConfig, devices } from '@playwright/test';

/** End-to-end tests run against the dev server in mock-auth mode (no tenant needed in CI). */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    env: { VITE_AUTH_MODE: 'mock', VITE_MOCK_ROLE: 'Wellbore.Engineer' },
  },
});
