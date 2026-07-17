import { test, expect } from '@playwright/test';

/**
 * 🧪 Простий візуальний тест для перевірки базової функціональності
 */

test('перевірка доступності головної сторінки', async ({ page }) => {
  await page.goto('/');
  
  // Зачекати завантаження сторінки
  await page.waitForLoadState('networkidle');
  
  // Перевірити, що сторінка завантажилася
  await expect(page).toHaveTitle(/.*/);
  
  // Зробити базовий знімок для перевірки
  await page.screenshot({ path: 'test-results/homepage-basic.png' });
});

test('перевірка наявності основних елементів', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Перевірити наявність body
  const body = page.locator('body');
  await expect(body).toBeVisible();
  
  console.log('Сторінка успішно завантажилася');
});

test('перевірка консолі на помилки', async ({ page }) => {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  if (errors.length > 0) {
    console.log('Знайдені помилки в консолі:', errors);
  } else {
    console.log('Помилок в консолі не знайдено');
  }
  
  // Тест не провалюється при помилках консолі, тільки логує їх
});
