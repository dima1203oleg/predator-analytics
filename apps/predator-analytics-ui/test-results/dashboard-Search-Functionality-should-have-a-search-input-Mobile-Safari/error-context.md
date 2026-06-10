# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Search Functionality >> should have a search input
- Location: e2e/dashboard.spec.ts:61:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[type="search"], input[placeholder*="пошук" i], input[placeholder*="search" i]')

```

```yaml
- text: "PREDATOR ELITE Кластер_Абсолютного_Інтелекту // v60.0 ДОСТУП: ВЕХОВНИЙ_СУВЕРЕН НЕЙРОННИЙ_ЩИТ_АКТИВНИЙ // 2048-Q Шифрування"
- button "ПРОПУСТИТИ ЗАСТАВКУ"
- text: "Журнал_Ініціалізації_Системи: > BOOT: ЗАВАНТАЖЕННЯ_ЕЛІТНИХ_СИСТЕМНИХ_ВИКЛИКІВ [ACK] > CORE: ПРИЄДНАННЯ_НЕЙ ОННИХ_СИНАПСІВ_v60 [ACK] > SIGINT: СКАНУВАННЯ_ГЛОБАЛЬНИХ_ ЕЗЕ ВІВ [КИЇВ_СИНХ О] [ACK] > AUTH: ВСТАНОВЛЕНО_ДОПУСК_ОМЕГА [ACK] > STATUS:ПРОБУДЖЕННЯ_PREDATORА [СУВЕРЕННИЙ_РЕЖИМ] [ACK] ВЛАСНИЙ_ПРОТОКОЛ_60.0 рівень_Суверенної_Авторизації"
- heading "Правовий Суверенітет" [level=2]
- paragraph: ДОСТУП ДО PREDATOR ELITE ОБМЕЖЕНИЙ. ВИ ПОГОДЖУЄТЕСЬ НА ПОВНУ ПРОЗОРІСТЬ ВАШИХ ДІЙ ПЕРЕД АВТОНОМНИМ ЯДРОМ.
- paragraph: Всі операції логуються в незмінному реєстрі WORM.
- text: "АНАЛІЗ БІОМЕТРИЧНОГО ВІДБИТКУ... ЦЕНТРАЛЬНЕ_ЯДРО_КИЇВ КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ... НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48% ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ ЗАТрИМКА: 0.000042ms КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ... НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48% ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ ЗАТрИМКА: 0.000042ms КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ... НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48% ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ ЗАТрИМКА: 0.000042ms КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ... НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48% ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ ЗАТрИМКА: 0.000042ms КИЇВ_ВУЗОЛ_H100: СИНХ ОНІЗОВАНО GEO_SIGINT: ОДЕСЬКА_ОБЛАСТЬ_АНАЛІЗ... НЕЙ ОННЕ_НАВАНТАЖЕННЯ: 3.48% ВИЯВЛЕНО_МАНІПУЛЯЦІЮ_ ИНКОМ ЗАТрИМКА: 0.000042ms"
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
  11  |     await page.goto('/');
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
> 66  |     await expect(searchInput).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
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
  112 |       const name = await button.getAttribute('aria-label') ||
  113 |                    await button.getAttribute('title') ||
  114 |                    await button.textContent();
  115 |       expect(name?.trim()).toBeTruthy();
  116 |     }
  117 |   });
  118 | });
  119 | 
  120 | test.describe('Performance', () => {
  121 |   test('should load within acceptable time', async ({ page }) => {
  122 |     const startTime = Date.now();
  123 |     await page.goto('/');
  124 |     await page.waitForLoadState('domcontentloaded');
  125 |     const loadTime = Date.now() - startTime;
  126 | 
  127 |     // Should load within 5 seconds
  128 |     expect(loadTime).toBeLessThan(5000);
  129 |   });
  130 | 
  131 |   test('should not have console errors', async ({ page }) => {
  132 |     const errors: string[] = [];
  133 |     page.on('console', msg => {
  134 |       if (msg.type() === 'error') {
  135 |         errors.push(msg.text());
  136 |       }
  137 |     });
  138 | 
  139 |     await page.goto('/');
  140 |     await page.waitForLoadState('networkidle');
  141 | 
  142 |     // Filter out known acceptable errors
  143 |     const criticalErrors = errors.filter(e =>
  144 |       !e.includes('net::ERR') && // Network errors in test env
  145 |       !e.includes('favicon') // Missing favicon
  146 |     );
  147 | 
  148 |     expect(criticalErrors).toHaveLength(0);
  149 |   });
  150 | });
  151 | 
  152 | test.describe('Responsive Design', () => {
  153 |   test('should work on mobile viewport', async ({ page }) => {
  154 |     await page.setViewportSize({ width: 375, height: 667 });
  155 |     await page.goto('/');
  156 | 
  157 |     // Should have mobile navigation
  158 |     await expect(page.locator('body')).toBeVisible();
  159 |   });
  160 | 
  161 |   test('should work on tablet viewport', async ({ page }) => {
  162 |     await page.setViewportSize({ width: 768, height: 1024 });
  163 |     await page.goto('/');
  164 | 
  165 |     await expect(page.locator('body')).toBeVisible();
  166 |   });
```