import { expect, test } from '@playwright/test';

test.describe('Shell v2', () => {
  test('відкриває командний пошук, переходить у модуль і показує контекстну панель', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => {
      window.sessionStorage.setItem('predator_auth_token', 'user-token');
    });
    await page.goto('/');

    await expect(page.getByTestId('main-layout')).toBeVisible({ timeout: 15000 });

    await page.keyboard.press('Control+K');
    await expect(page.getByTestId('shell-command-palette')).toBeVisible();

    const searchInput = page.getByPlaceholder('Маршрут, сутність, рекомендація або дія...');
    await searchInput.fill('аналіз ринку');

    await expect(page.getByTestId('palette-entry-market')).toBeVisible();
    await page.getByTestId('palette-entry-market').click();

    await expect(page).toHaveURL(/\/market$/);
    await expect(page.getByTestId('context-rail')).toBeVisible();
    await expect(page.getByTestId('context-rail').getByText('Контекстна панель')).toBeVisible();
    await expect(page.getByTestId('context-rail').getByText('Ринок')).toBeVisible();
  });
});
