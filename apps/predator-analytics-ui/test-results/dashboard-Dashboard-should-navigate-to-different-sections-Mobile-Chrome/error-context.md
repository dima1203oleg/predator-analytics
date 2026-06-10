# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> should navigate to different sections
- Location: e2e/dashboard.spec.ts:32:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://229hrqqh1vcj.share.zrok.io/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * 🧪 Dashboard E2E Tests
  5   |  *
  6   |  * Tests for the main dashboard functionality
  7   |  */
  8   | 
  9   | test.describe('Dashboard', () => {
  10  |   test.beforeEach(async ({ page }) => {
> 11  |     await page.goto('/');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  12  |   });
  13  | 
  14  |   test('should load the main dashboard', async ({ page }) => {
  15  |     // Wait for the page to load
  16  |     await expect(page).toHaveTitle(/Predator/i);
  17  | 
  18  |     // Check that main layout is visible
  19  |     await expect(page.locator('[data-testid="main-layout"]')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('should display navigation sidebar', async ({ page }) => {
  23  |     // Sidebar should be visible
  24  |     const sidebar = page.locator('[data-testid="sidebar"]');
  25  |     await expect(sidebar).toBeVisible();
  26  | 
  27  |     // Should have navigation items
  28  |     const navItems = sidebar.locator('nav a');
  29  |     expect(await navItems.count()).toBeGreaterThanOrEqual(5);
  30  |   });
  31  | 
  32  |   test('should navigate to different sections', async ({ page }) => {
  33  |     // Click on Monitoring
  34  |     await page.click('a[href="/monitoring"]');
  35  |     await expect(page).toHaveURL('/monitoring');
  36  | 
  37  |     // Click on Agents
  38  |     await page.click('a[href="/agents"]');
  39  |     await expect(page).toHaveURL('/agents');
  40  | 
  41  |     // Go back to home
  42  |     await page.click('a[href="/"]');
  43  |     await expect(page).toHaveURL('/');
  44  |   });
  45  | 
  46  |   test('should show loading state while fetching data', async ({ page }) => {
  47  |     // Look for any loading indicators
  48  |     const loader = page.locator('[data-loading="true"], .animate-spin, .animate-pulse').first();
  49  | 
  50  |     // Either loading is shown or content is already loaded
  51  |     const contentOrLoader = await Promise.race([
  52  |       loader.waitFor({ timeout: 1000 }).then(() => 'loader'),
  53  |       page.waitForLoadState('networkidle').then(() => 'content')
  54  |     ]);
  55  | 
  56  |     expect(['loader', 'content']).toContain(contentOrLoader);
  57  |   });
  58  | });
  59  | 
  60  | test.describe('Search Functionality', () => {
  61  |   test('should have a search input', async ({ page }) => {
  62  |     await page.goto('/search');
  63  | 
  64  |     // Should have search input
  65  |     const searchInput = page.locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]');
  66  |     await expect(searchInput).toBeVisible();
  67  |   });
  68  | 
  69  |   test('should handle search queries', async ({ page }) => {
  70  |     await page.goto('/search');
  71  | 
  72  |     const searchInput = page.locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]');
  73  |     await searchInput.fill('test query');
  74  |     await searchInput.press('Enter');
  75  | 
  76  |     // Should show some results or empty state
  77  |     await page.waitForLoadState('networkidle');
  78  |   });
  79  | });
  80  | 
  81  | test.describe('Accessibility', () => {
  82  |   test('should have proper heading structure', async ({ page }) => {
  83  |     await page.goto('/');
  84  | 
  85  |     // Should have an h1
  86  |     const h1 = page.locator('h1');
  87  |     expect(await h1.count()).toBeGreaterThanOrEqual(1);
  88  |   });
  89  | 
  90  |   test('should be keyboard navigable', async ({ page }) => {
  91  |     await page.goto('/');
  92  | 
  93  |     // Tab through focusable elements
  94  |     await page.keyboard.press('Tab');
  95  |     await page.keyboard.press('Tab');
  96  |     await page.keyboard.press('Tab');
  97  | 
  98  |     // Something should be focused
  99  |     const focusedElement = page.locator(':focus');
  100 |     await expect(focusedElement).toBeVisible();
  101 |   });
  102 | 
  103 |   test('should have accessible buttons', async ({ page }) => {
  104 |     await page.goto('/');
  105 | 
  106 |     // All buttons should have accessible names
  107 |     const buttons = page.locator('button');
  108 |     const count = await buttons.count();
  109 | 
  110 |     for (let i = 0; i < Math.min(count, 10); i++) {
  111 |       const button = buttons.nth(i);
```