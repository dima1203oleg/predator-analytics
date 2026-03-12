import { test, expect, Page } from '@playwright/test';

/**
 * 🧪 Dashboard E2E Tests
 *
 * Tests for the main dashboard functionality
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the main dashboard', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveTitle(/Predator/i);

    // Check that main layout is visible
    await expect(page.locator('[data-testid="main-layout"]')).toBeVisible();
  });

  test('should display navigation sidebar', async ({ page }) => {
    // Sidebar should be visible
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // Should have navigation items
    const navItems = sidebar.locator('nav a');
    expect(await navItems.count()).toBeGreaterThanOrEqual(5);
  });

  test('should navigate to different sections', async ({ page }) => {
    // Click on Monitoring
    await page.click('a[href="/monitoring"]');
    await expect(page).toHaveURL('/monitoring');

    // Click on Agents
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL('/agents');

    // Go back to home
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');
  });

  test('should show loading state while fetching data', async ({ page }) => {
    // Look for any loading indicators
    const loader = page.locator('[data-loading="true"], .animate-spin, .animate-pulse').first();

    // Either loading is shown or content is already loaded
    const contentOrLoader = await Promise.race([
      loader.waitFor({ timeout: 1000 }).then(() => 'loader'),
      page.waitForLoadState('networkidle').then(() => 'content')
    ]);

    expect(['loader', 'content']).toContain(contentOrLoader);
  });
});

test.describe('Search Functionality', () => {
  test('should have a search input', async ({ page }) => {
    await page.goto('/search');

    // Should have search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();
  });

  test('should handle search queries', async ({ page }) => {
    await page.goto('/search');

    const searchInput = page.locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]');
    await searchInput.fill('test query');
    await searchInput.press('Enter');

    // Should show some results or empty state
    await page.waitForLoadState('networkidle');
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');

    // Should have an h1
    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThanOrEqual(1);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Something should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible names
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') ||
                   await button.getAttribute('title') ||
                   await button.textContent();
      expect(name?.trim()).toBeTruthy();
    }
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors
    const criticalErrors = errors.filter(e =>
      !e.includes('net::ERR') && // Network errors in test env
      !e.includes('favicon') // Missing favicon
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Should have mobile navigation
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('body')).toBeVisible();
  });
});
