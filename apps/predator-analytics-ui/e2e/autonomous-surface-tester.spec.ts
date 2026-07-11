import { test, expect } from '@playwright/test';

test.describe('🤖 Autonomous Surface Testing', () => {
  test('перевірка стану інтерфейсу', async ({ page }) => {
    await page.goto('http://localhost:3030/');
    
    // Чекаємо завантаження
    await page.waitForLoadState('domcontentloaded');
    
    // Перевіряємо що сторінка завантажилась
    const bodyContent = await page.content();
    expect(bodyContent).toBeTruthy();
    expect(bodyContent.length).toBeGreaterThan(100);
    
    // Перевіряємо наявність React root
    const root = await page.$('#root');
    expect(root).toBeTruthy();
    
    // Перевіряємо заголовок
    await expect(page).toHaveTitle(/PREDATOR/);
    
    console.log('✅ Інтерфейс завантажений коректно');
  });
});
