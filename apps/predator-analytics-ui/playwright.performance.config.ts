import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Performance Configuration
 * 
 * This configuration focuses on performance testing
 * with specific metrics and thresholds
 */
export default defineConfig({
  testDir: './tests/performance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ['html'],
    ['json', { outputFile: 'performance-results.json' }],
    ['junit', { outputFile: 'performance-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.perf.spec.ts',
    },
    {
      name: 'firefox-performance',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/*.perf.spec.ts',
    },
    {
      name: 'webkit-performance',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/*.perf.spec.ts',
    },
  ],

  // Performance-specific settings
  expect: {
    timeout: 30000,
  },
  timeout: 60000,
});
