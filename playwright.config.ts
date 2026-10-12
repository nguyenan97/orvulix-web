import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  testMatch: /\.e2e\.(spec\.)?ts$/,
  fullyParallel: true,
  retries: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command:
      process.env.PLAYWRIGHT_USE_EXISTING_BUILD === 'true'
        ? 'npm run serve'
        : 'npm run build && npm run serve', // ORVULIX-CI
    url: 'http://localhost:4173'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
});
