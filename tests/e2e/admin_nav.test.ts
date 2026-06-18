import { test, expect } from '@playwright/test';

const UI_URL = 'http://localhost:3030';

test.describe('ADMIN navigation visibility', () => {
  test('Admin can see admin navigation bar', async ({ page }) => {
    // Login as admin
    await page.goto(`${UI_URL}/login`);
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', 'admin@predator.dev');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("УВІЙТИ В СИСТЕМУ")');
    await page.waitForURL('**/admin*', { timeout: 15000 });
    // Verify admin navigation bar exists
    const adminNav = await page.$('.admin-nav');
    expect(adminNav).not.toBeNull();
    // Optionally check a known admin menu item
    const systemItem = await page.$('text=Система');
    expect(systemItem).not.toBeNull();
  });
});
