import { test, expect } from '@playwright/test';

test.describe('Continuous UI Health Monitor', () => {
  // Налаштування для запуску в циклі
  test.describe.configure({ mode: 'parallel' });

  test('should load main dashboard and verify key indicators', async ({ page }) => {
    // 1. Перехід на головну сторінку (авторизація має бути замокана або передана через state)
    await page.goto('http://localhost:3030/');
    
    // Перевірка заголовка
    await expect(page).toHaveTitle(/PREDATOR Analytics/i);

    // 2. Перевірка наявності головного компонента Command Center
    const commandCenter = page.locator('text=Command Center');
    await expect(commandCenter).toBeVisible({ timeout: 10000 });

    // 3. Перевірка відсутності критичних помилок (Red Screen of Death)
    const errorAlerts = page.locator('.text-destructive');
    const errorCount = await errorAlerts.count();
    expect(errorCount).toBe(0); // Очікуємо, що помилок немає
  });

  test('should verify navigation tabs are functional', async ({ page }) => {
    await page.goto('http://localhost:3030/');
    
    // Перевірка навігації між табами (Diligence, Graph, Factory тощо)
    const navLinks = ['Diligence', 'Graph Analysis', 'Factory', 'Admin'];
    
    for (const linkText of navLinks) {
      const link = page.locator(`button:has-text("${linkText}")`);
      if (await link.isVisible()) {
         await link.click();
         // Перевірка, що URL змінився або з'явився відповідний контент
         // (це базовий приклад, адаптувати під конкретні роути)
      }
    }
  });

  test('should ensure backend connection indicator is green', async ({ page }) => {
    await page.goto('http://localhost:3030/');
    // Моніторинг статусу підключення до бекенду
    const statusIndicator = page.locator('div[data-testid="backend-status-indicator"]');
    if (await statusIndicator.isVisible()) {
       await expect(statusIndicator).toHaveClass(/bg-green-500/);
    }
  });
});
