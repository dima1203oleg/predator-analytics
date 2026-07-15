import { test, expect } from '@playwright/test';

test.describe('🤖 Autonomous Surface Test', () => {
  test('повне тестування поверхні', async ({ page }) => {
    const results = {
      total_clicks: 0,
      successful_clicks: 0,
      failed_clicks: 0,
      form_interactions: 0,
      keyboard_interactions: 0,
      errors: [] as string[],
      visited_urls: [] as string[]
    };
    
    try {
      await page.goto('http://localhost:3030/', { timeout: 10000 });
      
      // Обхід модальних вікон (Onboarding, License)
      await page.evaluate(() => {
        localStorage.setItem('predator_onboarding_completed', 'true');
        localStorage.setItem('admin_license_accepted', 'true');
        localStorage.setItem('predator_auth_token', 'mock_token');
      });
      await page.reload({ timeout: 10000 });
      
      results.visited_urls.push('http://localhost:3030/');
      
      // Чекаємо завантаження
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
      
      // Отримуємо всі клікабельні елементи
      const clickableElements = await page.locator('button, a, [role="button"], [onclick], input, select, [tabindex]').all();
      results.total_clicks = clickableElements.length;
      
      console.log(`🔍 Found ${results.total_clicks} interactive elements`);
      
      // Клікаємо на елементи з обмеженням
      const maxClicks = 15;
      for (let i = 0; i < Math.min(clickableElements.length, maxClicks); i++) {
        try {
          const element = clickableElements[i];
          const el = await element.elementHandle();
          if (!el) continue;
          
          // Прокрутка до елемента
          await el.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          
          // Отримуємо тип та інформацію
          const tagName = await el.evaluate(el => el.tagName.toLowerCase());
          const inputType = tagName === 'input' ? await el.evaluate(el => (el as HTMLInputElement).type) : '';
          
          if (tagName === 'input' && inputType === 'text') {
            // Заповнюємо текстові поля
            await el.fill('test_data_' + Date.now());
            results.form_interactions++;
          } else if (tagName === 'select') {
            // Клікаємо на селекти
            await el.click();
            await page.waitForTimeout(200);
            await page.keyboard.press('Escape');
            results.form_interactions++;
          } else if (tagName === 'a') {
            // Для посилань клікаємо і повертаємося
            await el.click({ timeout: 5000 });
            await page.waitForTimeout(500);
            const currentUrl = page.url();
            if (currentUrl !== 'http://localhost:3030/') {
              results.visited_urls.push(currentUrl);
              await page.goBack();
              await page.waitForTimeout(500);
            }
          } else {
            // Клікаємо на кнопки
            await el.click({ timeout: 5000 });
            await page.waitForTimeout(300);
          }
          
          results.successful_clicks++;
          console.log(`✅ Element ${i+1}/${maxClicks}: ${tagName} (${results.successful_clicks} succeeded)`);
          
        } catch (error) {
          results.failed_clicks++;
          const errorMsg = error instanceof Error ? error.message : String(error);
          results.errors.push(`Element ${i+1}: ${errorMsg}`);
          console.log(`❌ Element ${i+1}/${maxClicks} failed: ${errorMsg}`);
          
          // Продовжуємо тестування після помилки
          await page.waitForTimeout(300);
        }
      }
      
      // Клавіатурна навігація
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }
      results.keyboard_interactions += 5;
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.keyboard.press('Escape');
      
      console.log('⌨️  Keyboard navigation tested');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.errors.push(`Main test: ${errorMsg}`);
      console.log(`❌ Test error: ${errorMsg}`);
    }
    
    const successRate = results.total_clicks > 0 
      ? ((results.successful_clicks / results.total_clicks) * 100).toFixed(2) 
      : 0;
    
    console.log(`📊 Results: ${results.successful_clicks}/${results.total_clicks} clicks (${successRate}% success)`);
    
    // Зберігаємо результат в консоль для парсингу
    console.log('TEST_RESULT:', JSON.stringify(results));
  });
});
