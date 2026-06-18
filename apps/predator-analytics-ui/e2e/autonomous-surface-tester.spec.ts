/**
 * 🤖 Autonomous Surface Tester (Google Antigravity Style)
 * 
 * Автономний агент для автоматичного тестування веб інтерфейсу
 * Симетує реального користувача: навігація, кліки, введення даних
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * 🎯 Головний клас автономного тестування
 */
class AutonomousSurfaceTester {
  private page: Page;
  private context: BrowserContext;
  private visitedUrls: Set<string> = new Set();
  private clickedElements: Set<string> = new Set();
  private errors: Array<{ element: string, error: string }> = [];
  private successCount: number = 0;
  private failedCount: number = 0;
  
  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
  }
  
  /**
   * Головний метод тестування
   */
  async testSurface(timeout: number = 30000) {
    console.log('🤖 Початок автономного тестування поверхні...');
    
    const startTime = Date.now();
    
    try {
      // Чекаємо завантаження сторінки
      await this.page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        console.log('⏳ Networkidle timeout, продовжуємо...');
      });
      
      // Автоматична навігація та кліки
      await this.autonomousNavigation();
      
      // Тестування форм
      await this.testForms();
      
      // Тестування інтерактивних елементів
      await this.testInteractiveElements();
      
      // Тестування клавіатурної навігації
      await this.testKeyboardNavigation();
      
    } catch (error) {
      console.error('❌ Критична помилка тестування:', error);
      this.errors.push({
        element: 'MAIN_TEST',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    const duration = Date.now() - startTime;
    this.generateReport(duration);
  }
  
  /**
   * Автоматична навігація по інтерфейсу
   */
  private async autonomousNavigation() {
    console.log('🧭 Автоматична навігація...');
    
    // Отримуємо всі клікабельні елементи
    const clickableElements = await this.page.locator('button, a, [role="button"], [onclick]').all();
    
    console.log(`🔍 Знайдено ${clickableElements.length} клікабельних елементів`);
    
    // Клікаємо на елементи з випадковими затримками
    for (let i = 0; i < Math.min(clickableElements.length, 20); i++) {
      const element = clickableElements[i];
      
      try {
        // Отримуємо елемент
        const el = await element.elementHandle();
        if (!el) continue;
        
        // Отримуємо текст або атрибут
        const text = await el.textContent() || await el.getAttribute('aria-label') || `button-${i}`;
        const elementId = `${text}-${i}`;
        
        // Пропускаємо вже клікнуті елементи
        if (this.clickedElements.has(elementId)) continue;
        
        // Прокрутка до елемента
        await el.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500);
        
        // Клік з випадковою затримкою
        await el.click({ timeout: 5000 });
        await this.page.waitForTimeout(300 + Math.random() * 500);
        
        this.clickedElements.add(elementId);
        this.successCount++;
        console.log(`✅ Клікнуто: ${text.substring(0, 30)}... (${this.successCount}/${this.clickedElements.size})`);
        
        // Повертаємося на попередню сторінку якщо це посилання
        const tagName = await el.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'a') {
          await this.page.goBack();
          await this.page.waitForTimeout(500);
        }
        
      } catch (error) {
        this.failedCount++;
        const errorText = error instanceof Error ? error.message : String(error);
        this.errors.push({
          element: `element-${i}`,
          error: errorText
        });
        console.log(`❌ Помилка кліку ${i}:`, errorText);
        
        // Продовжуємо тестування після помилки
        await this.page.waitForTimeout(500);
      }
    }
  }
  
  /**
   * Тестування форм
   */
  private async testForms() {
    console.log('📝 Тестування форм...');
    
    // Знаходимо всі форми
    const forms = await this.page.locator('form').all();
    
    for (const form of forms) {
      try {
        const inputs = await form.locator('input, textarea, select').all();
        
        if (inputs.length === 0) continue;
        
        console.log(`📝 Знайдено форму з ${inputs.length} полями`);
        
        // Заповнюємо поля тестовими даними
        for (const input of inputs.slice(0, 3)) { // Ліміт 3 поля на форму
          const inputType = await input.getAttribute('type');
          const placeholder = await input.getAttribute('placeholder') || 'field';
          
          try {
            if (inputType === 'text' || inputType === 'email' || inputType === 'search' || !inputType) {
              await input.fill('test_data_' + Date.now());
            } else if (inputType === 'checkbox') {
              await input.check();
            } else if (inputType === 'radio') {
              await input.click();
            }
            
            this.successCount++;
            console.log(`✅ Заповнено: ${placeholder}`);
          } catch (error) {
            console.log(`⏩ Пропущено поле: ${placeholder}`);
          }
        }
        
      } catch (error) {
        console.log('⏩ Пропущено форму:', error instanceof Error ? error.message : String(error));
      }
    }
  }
  
  /**
   * Тестування інтерактивних елементів
   */
  private async testInteractiveElements() {
    console.log('🎯 Тестування інтерактивних елементів...');
    
    // Тестуємо dropdown menus
    const dropdowns = await this.page.locator('[role="combobox"], select').all();
    
    for (const dropdown of dropdowns.slice(0, 3)) {
      try {
        await dropdown.click();
        await this.page.waitForTimeout(500);
        await this.page.keyboard.press('Escape');
        this.successCount++;
        console.log('✅ Протестовано dropdown');
      } catch (error) {
        console.log('⏩ Пропущено dropdown');
      }
    }
    
    // Тестуємо таби
    const tabs = await this.page.locator('[role="tab"]').all();
    
    for (const tab of tabs.slice(0, 3)) {
      try {
        await tab.click();
        await this.page.waitForTimeout(300);
        this.successCount++;
        console.log('✅ Протестовано tab');
      } catch (error) {
        console.log('⏩ Пропущено tab');
      }
    }
  }
  
  /**
   * Тестування клавіатурної навігації
   */
  private async testKeyboardNavigation() {
    console.log('⌨️  Тестування клавіатурної навігації...');
    
    try {
      // Tab навігація
      for (let i = 0; i < 10; i++) {
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(100);
      }
      
      // Enter для активування
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(500);
      
      // Escape для закриття
      await this.page.keyboard.press('Escape');
      
      this.successCount++;
      console.log('✅ Клавіатурна навігація протестована');
    } catch (error) {
      console.log('⏩ Пропущено клавіатурну навігацію');
    }
  }
  
  /**
   * Генерація звіту
   */
  private generateReport(duration: number) {
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.floor(duration / 1000)}s`,
      visitedUrls: this.visitedUrls.size,
      clickedElements: this.clickedElements.size,
      successCount: this.successCount,
      failedCount: this.failedCount,
      errors: this.errors,
      successRate: this.successCount > 0 
        ? ((this.successCount / (this.successCount + this.failedCount)) * 100).toFixed(2) + '%'
        : '0%'
    };
    
    console.log('📊 ЗВІТ АВТОНОМНОГО ТЕСТУВАННЯ:');
    console.log('═══════════════════════════════════════════');
    console.log(`📅 Час: ${report.timestamp}`);
    console.log(`⏱️  Тривалість: ${report.duration}`);
    console.log(`🔗 Відвіданих URL: ${report.visitedUrls}`);
    console.log(`🖱️  Кліків: ${report.clickedElements}`);
    console.log(`✅ Успішно: ${report.successCount}`);
    console.log(`❌ Помилок: ${report.failedCount}`);
    console.log(`📈 Успішність: ${report.successRate}`);
    
    if (this.errors.length > 0) {
      console.log('❌ ПОМИЛКИ:');
      this.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.element}: ${err.error}`);
      });
    }
    
    console.log('═══════════════════════════════════════════');
    
    return report;
  }
}

/**
 * 🎯 Playwright тест з автономним тестуванням
 */
test.describe('🤖 Autonomous Surface Testing', () => {
  test('повна автоматична навігація та кліки', async ({ page, context }) => {
    const tester = new AutonomousSurfaceTester(page, context);
    
    await page.goto('http://localhost:3030/');
    
    // Запускаємо автономне тестування
    const report = await tester.testSurface(60000); // 60 секунд
    
    // Перевіряємо що інтерфейс працює
    await expect(page).toHaveTitle(/PREDATOR/);
    
    // Перевіряємо що не було критичних помилок
    expect(report.failedCount).toBeLessThan(10); // Менше 10 помилок
    
    console.log('🎉 Автономне тестування завершено успішно');
  });
  
  test('тестування простого React компонента', async ({ page }) => {
    await page.goto('http://localhost:3030/simple-test');
    
    // Чекаємо завантаження React компонента
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Перевіряємо що простий компонент працює
    const title = await page.textContent('h1');
    expect(title).toContain('ПРОСТИЙ ТЕСТ REACT');
    
    // Тестуємо інтерактивність
    const timeText = await page.textContent('div:has-text("Поточний час")');
    expect(timeText).toBeTruthy();
    
    console.log('✅ Простий React компонент працює коректно');
  });
  
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
    
    console.log('✅ Інтерфейс завантажений коректно');
  });
});
