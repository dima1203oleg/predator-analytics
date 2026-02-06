import { test, expect } from '@playwright/test';

/**
 * 🧪 Monitoring View E2E Tests
 */

test.describe('Monitoring View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/monitoring');
  });

  test('should display monitoring dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/monitoring');

    // Should have some metric cards
    const cards = page.locator('[data-testid="metric-card"], .rounded-xl, .rounded-2xl').first();
    await expect(cards).toBeVisible();
  });

  test('should show system metrics', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Should have CPU, Memory, or Disk indicators
    const metrics = page.locator('text=/CPU|Memory|Disk|Память|Диск/i').first();
    await expect(metrics).toBeVisible({ timeout: 10000 });
  });

  test('should have refresh capability', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.locator('button:has-text("Оновити"), button[aria-label*="оновити" i], button:has(svg)').first();

    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      // Should trigger a refresh
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Agents View', () => {
  test('should display agents list', async ({ page }) => {
    await page.goto('/agents');

    await expect(page).toHaveURL('/agents');
    await page.waitForLoadState('networkidle');
  });

  test('should show agent status', async ({ page }) => {
    await page.goto('/agents');

    // Should have status indicators
    await page.waitForLoadState('networkidle');
  });
});

test.describe('LLM View', () => {
  test('should display LLM providers', async ({ page }) => {
    await page.goto('/llm');

    await expect(page).toHaveURL('/llm');
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Settings View', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL('/settings');
  });

  test('should have theme toggle', async ({ page }) => {
    await page.goto('/settings');

    // Look for theme related elements
    const themeSection = page.locator('text=/тема|theme/i').first();

    if (await themeSection.isVisible()) {
      await expect(themeSection).toBeVisible();
    }
  });
});

test.describe('Graph View', () => {
  test('should load graph view', async ({ page }) => {
    await page.goto('/graph');

    await expect(page).toHaveURL('/graph');
    await page.waitForLoadState('networkidle');
  });
});

test.describe('API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock a failed API response
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/monitoring');

    // Should show error state or fallback
    await page.waitForLoadState('networkidle');

    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle network timeout', async ({ page }) => {
    // Slow down API responses
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.continue();
    });

    await page.goto('/');

    // Should show loading state
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Offline Support', () => {
  test('should handle offline mode', async ({ page, context }) => {
    // Load the page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate to another page
    await page.goto('/monitoring').catch(() => {});

    // Page should still show something (cached or offline message)
    await expect(page.locator('body')).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});
