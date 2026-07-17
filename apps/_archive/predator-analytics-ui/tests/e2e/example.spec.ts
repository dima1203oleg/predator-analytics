import { test, expect } from '@playwright/test';

test('Homepage loads and displays title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Predator Analytics/);
});

test('Navigation works', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Dashboard');
  await expect(page).toHaveURL(/dashboard/);
});