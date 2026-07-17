import { test, expect } from '@playwright/test';

/**
 * 🎨 Візуальні регресійні тести для PREDATOR Analytics UI
 *
 * Ці тести забезпечують візуальну цілісність інтерфейсу,
 * порівнюючи поточний стан сторінок з еталонними зображеннями.
 */

test.describe('Візуальні регресійні тести', () => {
  test('головна сторінка має вірне візуальне відображення', async ({ page }) => {
    await page.goto('/');
    
    // Зачекати завантаження сторінки
    await page.waitForLoadState('networkidle');
    
    // Порівняти повний знімок сторінки з еталоном
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('сторінка логіну має вірне візуальне відображення', async ({ page }) => {
    await page.goto('/login');
    
    // Зачекати завантаження сторінки
    await page.waitForLoadState('networkidle');
    
    // Порівняти знімок сторінки логіну
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('панель керування має вірне візуальне відображення', async ({ page }) => {
    // Спочатку залогінитися (або використати мок автентифікації)
    await page.goto('/');
    
    // Якщо необхідно авторизуватися - додати логін
    // await page.fill('input[name="username"]', 'test-user');
    // await page.fill('input[name="password"]', 'test-password');
    // await page.click('button[type="submit"]');
    
    await page.waitForLoadState('networkidle');
    
    // Порівняти знімок панелі керування
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('карточка компанії має вірне відображення', async ({ page }) => {
    // Перейти до сторінки компанії
    await page.goto('/companies/test-company-id');
    
    await page.waitForLoadState('networkidle');
    
    // Порівняти знімок сторінки компанії
    await expect(page).toHaveScreenshot('company-card.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('граф зв\'язків має вірне відображення', async ({ page }) => {
    // Перейти до сторінки графу
    await page.goto('/graph');
    
    await page.waitForLoadState('networkidle');
    
    // Зачекати рендерингу графу
    await page.waitForSelector('[data-testid="graph-container"]', { timeout: 10000 });
    
    // Порівняти знімок графу
    await expect(page).toHaveScreenshot('graph-view.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('статистичні панелі мають вірне відображення', async ({ page }) => {
    // Перейти до сторінки статистики
    await page.goto('/analytics');
    
    await page.waitForLoadState('networkidle');
    
    // Зачекати завантаження чартів
    await page.waitForSelector('[data-testid="chart-container"]', { timeout: 10000 });
    
    // Порівняти знімок статистики
    await expect(page).toHaveScreenshot('analytics-dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Візуальні тести компонентів', () => {
  test('кнопка навігації має вірне відображення', async ({ page }) => {
    await page.goto('/');
    
    const navigationButton = page.locator('[data-testid="nav-button"]');
    
    await expect(navigationButton).toBeVisible();
    await expect(navigationButton).toHaveScreenshot('nav-button.png', {
      animations: 'disabled',
    });
  });

  test('поле пошуку має вірне відображення', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('[data-testid="search-input"]');
    
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveScreenshot('search-input.png', {
      animations: 'disabled',
    });
  });

  test('таблиця даних має вірне відображення', async ({ page }) => {
    await page.goto('/companies');
    
    await page.waitForLoadState('networkidle');
    
    const dataTable = page.locator('[data-testid="data-table"]');
    
    await expect(dataTable).toBeVisible();
    await expect(dataTable).toHaveScreenshot('data-table.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Візуальні тети з різними розмірами екрану', () => {
  test('мобільний вид головної сторінки', async ({ page }) => {
    // Встановити мобільний розмір екрану
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('планшетний вид головної сторінки', async ({ page }) => {
    // Встановити планшетний розмір екрану
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('desktop вид головної сторінки', async ({ page }) => {
    // Встановити desktop розмір екрану
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
