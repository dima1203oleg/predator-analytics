# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: views.spec.ts >> API Integration >> should handle network timeout
- Location: e2e/views.spec.ts:114:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "https://229hrqqh1vcj.share.zrok.io/", waiting until "load"

```

# Test source

```ts
  21  |     // Wait for data to load
  22  |     await page.waitForLoadState('networkidle');
  23  | 
  24  |     // Should have CPU, Memory, or Disk indicators
  25  |     const metrics = page.locator('text=/CPU|Memory|Disk|Память|Диск/i').first();
  26  |     await expect(metrics).toBeVisible({ timeout: 10000 });
  27  |   });
  28  | 
  29  |   test('should have refresh capability', async ({ page }) => {
  30  |     // Look for refresh button
  31  |     const refreshButton = page.locator('button:has-text("Оновити"), button[aria-label*="оновити" i], button:has(svg)').first();
  32  | 
  33  |     if (await refreshButton.isVisible()) {
  34  |       await refreshButton.click();
  35  |       // Should trigger a refresh
  36  |       await page.waitForLoadState('networkidle');
  37  |     }
  38  |   });
  39  | });
  40  | 
  41  | test.describe('Agents View', () => {
  42  |   test('should display agents list', async ({ page }) => {
  43  |     await page.goto('/agents');
  44  | 
  45  |     await expect(page).toHaveURL('/agents');
  46  |     await page.waitForLoadState('networkidle');
  47  |   });
  48  | 
  49  |   test('should show agent status', async ({ page }) => {
  50  |     await page.goto('/agents');
  51  | 
  52  |     // Should have status indicators
  53  |     await page.waitForLoadState('networkidle');
  54  |   });
  55  | });
  56  | 
  57  | test.describe('LLM View', () => {
  58  |   test('should display LLM providers', async ({ page }) => {
  59  |     await page.goto('/llm');
  60  | 
  61  |     await expect(page).toHaveURL('/llm');
  62  |     await page.waitForLoadState('networkidle');
  63  |   });
  64  | });
  65  | 
  66  | test.describe('Settings View', () => {
  67  |   test('should display settings page', async ({ page }) => {
  68  |     await page.goto('/settings');
  69  | 
  70  |     await expect(page).toHaveURL('/settings');
  71  |   });
  72  | 
  73  |   test('should have theme toggle', async ({ page }) => {
  74  |     await page.goto('/settings');
  75  | 
  76  |     // Look for theme related elements
  77  |     const themeSection = page.locator('text=/тема|theme/i').first();
  78  | 
  79  |     if (await themeSection.isVisible()) {
  80  |       await expect(themeSection).toBeVisible();
  81  |     }
  82  |   });
  83  | });
  84  | 
  85  | test.describe('Graph View', () => {
  86  |   test('should load graph view', async ({ page }) => {
  87  |     await page.goto('/graph');
  88  | 
  89  |     await expect(page).toHaveURL('/graph');
  90  |     await page.waitForLoadState('networkidle');
  91  |   });
  92  | });
  93  | 
  94  | test.describe('API Integration', () => {
  95  |   test('should handle API errors gracefully', async ({ page }) => {
  96  |     // Mock a failed API response
  97  |     await page.route('**/api/**', route => {
  98  |       route.fulfill({
  99  |         status: 500,
  100 |         contentType: 'application/json',
  101 |         body: JSON.stringify({ error: 'Internal Server Error' })
  102 |       });
  103 |     });
  104 | 
  105 |     await page.goto('/monitoring');
  106 | 
  107 |     // Should show error state or fallback
  108 |     await page.waitForLoadState('networkidle');
  109 | 
  110 |     // Page should still be functional
  111 |     await expect(page.locator('body')).toBeVisible();
  112 |   });
  113 | 
  114 |   test('should handle network timeout', async ({ page }) => {
  115 |     // Slow down API responses
  116 |     await page.route('**/api/**', async route => {
  117 |       await new Promise(resolve => setTimeout(resolve, 3000));
  118 |       route.continue();
  119 |     });
  120 | 
> 121 |     await page.goto('/');
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  122 | 
  123 |     // Should show loading state
  124 |     await expect(page.locator('body')).toBeVisible();
  125 |   });
  126 | });
  127 | 
  128 | test.describe('Offline Support', () => {
  129 |   test('should handle offline mode', async ({ page, context }) => {
  130 |     // Load the page first
  131 |     await page.goto('/');
  132 |     await page.waitForLoadState('networkidle');
  133 | 
  134 |     // Go offline
  135 |     await context.setOffline(true);
  136 | 
  137 |     // Navigate to another page
  138 |     await page.goto('/monitoring').catch(() => {});
  139 | 
  140 |     // Page should still show something (cached or offline message)
  141 |     await expect(page.locator('body')).toBeVisible();
  142 | 
  143 |     // Go back online
  144 |     await context.setOffline(false);
  145 |   });
  146 | });
  147 | 
```