import { defineConfig, devices } from '@playwright/test';

/**
 * 🧪 Playwright E2E Test Configuration
 *
 * Configuration for end-to-end testing of PREDATOR Analytics UI
 * Fully autonomous with auto-approval and auto-commit
 */

export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only - increased for reliability
  retries: process.env.CI ? 3 : 1,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 2 : 4,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3050',

    // Collect trace for all tests (not just on retry) for detailed analysis
    trace: 'retain-on-failure',

    // Screenshot on failure and on success for comprehensive coverage
    screenshot: 'only-on-failure',

    // Video on failure for debugging
    video: "off",

    // Locale
    locale: 'uk-UA',

    // Timezone
    timezoneId: 'Europe/Kyiv',

    // Auto-wait for network idle
    navigationTimeout: 60000,
    actionTimeout: 30000,
    
    // Headless mode for CI
    headless: process.env.CI !== 'false',
    
    // Ignore HTTPs errors for local testing
    ignoreHTTPSErrors: true,

    // Launch options for testing microphone without NotSupportedError
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
      ],
    },
  },

  // Configure projects for major browsers - only Chromium for speed
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Faster viewport for CI
        viewport: { width: 1280, height: 720 },
      },
    },
    // Додатковий проект для автономного тестування
    {
      name: 'autonomous-surface',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Більший viewport для автономного тестування
      },
      testMatch: '**/autonomous-surface-tester.spec.ts',
    },
  ],

  // Run local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'VITE_AUTO_MODE=true npm run dev',
    url: 'http://localhost:3050',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  
  // Global timeout
  timeout: 120000, // 2 хвилини для автономного тестування
  
  // Expect timeout
  expect: {
    timeout: 15000,
  },
});
