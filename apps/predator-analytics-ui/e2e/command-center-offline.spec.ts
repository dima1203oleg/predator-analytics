import { test, expect } from '@playwright/test';

test.describe('Command Center (Offline Mode)', () => {
  test.use({
    // Force specific timezone and locale if needed
    locale: 'uk-UA',
    timezoneId: 'Europe/Kyiv',
  });

  test('should load Command Center without crashing when backend is unreachable', async ({ page }) => {
    // Navigate to the Command Center
    await page.goto('/command');

    // Dismiss the onboarding wizard if it appears
    const closeButton = page.locator('button').filter({ hasText: '×' }).or(page.locator('button[aria-label="Close"]'));
    if (await closeButton.count() > 0) {
      // Playwright might be too fast, giving a small wait helps
      await page.waitForTimeout(500);
      try {
        await closeButton.first().click({ force: true, timeout: 2000 });
      } catch (e) {
        // Ignore if we can't click it
      }
    }

    // Wait for the page to load and check the main HUD components
    await expect(page.locator('text=СИСТЕМНІ МЕТРИКИ').first()).toBeVisible({ timeout: 10000 });

    // Check if Cognitive Panel is visible
    const cognitivePanelTitle = page.locator('text=AI КОГНІТИВНА ПАНЕЛЬ').first();
    await expect(cognitivePanelTitle).toBeVisible();

    // Check if Activity Panel is visible
    const activityTitle = page.locator('text=АКТИВНІСТЬ СИСТЕМИ').first();
    await expect(activityTitle).toBeVisible();

    // Check if Threat Matrix panel is visible
    const threatTitle = page.locator('text=МАТРИЦЯ ЗАГРОЗ').first();
    await expect(threatTitle).toBeVisible();

    // Verify 3D Scene container is present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Ensure there are no React error boundary crash messages
    // (We assume a crash would show a generic "Something went wrong" or a stack trace)
    const errorBoundary = page.locator('text=Критичний збій матриці');
    await expect(errorBoundary).toHaveCount(0);
  });
});
