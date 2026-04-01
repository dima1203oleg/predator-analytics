import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Accessibility Configuration
 * 
 * This configuration focuses on accessibility testing
 * with WCAG 2.1 AA compliance checks
 */
export default defineConfig({
  testDir: './tests/accessibility',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 2,
  reporter: [
    ['html'],
    ['json', { outputFile: 'accessibility-results.json' }],
    ['junit', { outputFile: 'accessibility-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/*.a11y.spec.ts',
    },
    {
      name: 'firefox-accessibility',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/*.a11y.spec.ts',
    },
    {
      name: 'webkit-accessibility',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/*.a11y.spec.ts',
    },
    {
      name: 'mobile-accessibility',
      use: { ...devices['iPhone 13'] },
      testMatch: '**/*.mobile-a11y.spec.ts',
    },
  ],

  // Accessibility-specific settings
  expect: {
    timeout: 20000,
  },
  timeout: 45000,
});
