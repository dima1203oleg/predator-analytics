import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = '/Users/dima1203/.gemini/antigravity/brain/efb2b347-a07e-4dd7-91bc-54dc0f1bde57/screenshots';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('📸 Візуальне тестування PREDATOR Analytics', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('Сценарій VIP: Скріншоти всіх бізнес-модулів та аналітики', async ({ page }) => {
    test.setTimeout(120000);
    // Реєструємо логування з браузера
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[BROWSER EXCEPTION]: ${err.message}\n${err.stack}`);
    });

    // 1. Авторизація як VIP (DRPO-ДИРЕКТОР)
    console.log('Початок авторизації VIP...');
    await page.goto('http://localhost:3030/login');
    
    // Чекаємо завантаження сторінки або кнопки пропуску заставки
    try {
      const skipBtn = page.locator('text=ПРОПУСТИТИ ЗАСТАВКУ');
      await skipBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log('Знайдено кнопку пропуску заставки. Клікаємо...');
      await skipBtn.click();
    } catch (e) {
      console.log('Кнопку пропуску заставки не знайдено або таймаут, продовжуємо стандартне очікування...');
    }

    await page.waitForSelector('text=PREDATOR', { timeout: 15000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо екрану вибору ролей
    await page.waitForSelector('text=DRPO-ДИРЕКТОР', { timeout: 15000 });
    
    // Клікаємо на DRPO-ДИРЕКТОР
    const roleButton = page.locator('button').filter({ hasText: 'DRPO-ДИРЕКТОР' });
    await roleButton.click();
    
    // Чекаємо редіректу на головну сторінку
    await page.waitForURL('**/command?tab=board', { timeout: 15000 });
    await page.waitForTimeout(2000); // Даємо час на рендер анімацій

    const businessViews = [
      { name: 'vip_dashboard.png', url: 'http://localhost:3030/command?tab=board' },
      { name: 'vip_brief.png', url: 'http://localhost:3030/command?tab=brief' },
      { name: 'vip_risk.png', url: 'http://localhost:3030/command?tab=risk' },
      { name: 'vip_observer.png', url: 'http://localhost:3030/command?tab=observer' },
      { name: 'vip_warroom.png', url: 'http://localhost:3030/command?tab=warroom' },
      
      { name: 'vip_customs.png', url: 'http://localhost:3030/market?tab=customs' },
      { name: 'vip_trade_map.png', url: 'http://localhost:3030/market?tab=flows' },
      { name: 'vip_suppliers.png', url: 'http://localhost:3030/market?tab=suppliers' },
      { name: 'vip_price_compare.png', url: 'http://localhost:3030/market?tab=price' },
      
      { name: 'vip_global_search.png', url: 'http://localhost:3030/search?tab=global' },
      { name: 'vip_newspaper.png', url: 'http://localhost:3030/search?tab=newspaper' },
      { name: 'vip_registries.png', url: 'http://localhost:3030/search?tab=registries' },
      
      { name: 'vip_diligence.png', url: 'http://localhost:3030/osint?tab=diligence' },
      { name: 'vip_ubo_map.png', url: 'http://localhost:3030/osint?tab=ubo' },
      { name: 'vip_graph.png', url: 'http://localhost:3030/osint?tab=graph' },
      { name: 'vip_sanctions.png', url: 'http://localhost:3030/osint?tab=sanctions' },
      
      { name: 'vip_aml.png', url: 'http://localhost:3030/financial?tab=aml' },
      { name: 'vip_swift.png', url: 'http://localhost:3030/financial?tab=swift' },
      { name: 'vip_offshore.png', url: 'http://localhost:3030/financial?tab=offshore' },
      { name: 'vip_assets.png', url: 'http://localhost:3030/financial?tab=assets' },
      
      { name: 'vip_ai_agents.png', url: 'http://localhost:3030/nexus?tab=agents' },
      { name: 'vip_ai_hypothesis.png', url: 'http://localhost:3030/nexus?tab=hypothesis' },
      { name: 'vip_ai_insights.png', url: 'http://localhost:3030/nexus?tab=insights' },
      { name: 'vip_knowledge.png', url: 'http://localhost:3030/nexus?tab=knowledge' },
      { name: 'vip_oracle.png', url: 'http://localhost:3030/nexus?tab=oracle' }
    ];

    for (const view of businessViews) {
      console.log(`Перехід на: ${view.url} -> Збереження у ${view.name}`);
      await page.goto(view.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Даємо час дозавантажитись картам і чартам
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, view.name), fullPage: false });
    }
  });

  test('Сценарій ADMIN: Скріншоти технічних дашбордів керування', async ({ page }) => {
    test.setTimeout(120000);
    // Реєструємо логування з браузера
    page.on('console', msg => {
      console.log(`[ADMIN BROWSER CONSOLE ${msg.type()}]: ${msg.text()}`);
    });
    page.on('pageerror', err => {
      console.error(`[ADMIN BROWSER EXCEPTION]: ${err.message}\n${err.stack}`);
    });

    // 2. Авторизація як ADMIN (КОМАНДИР СУВЕРЕНІТЕТУ)
    console.log('Початок авторизації ADMIN...');
    await page.goto('http://localhost:3030/login');

    // Чекаємо завантаження сторінки або кнопки пропуску заставки
    try {
      const skipBtn = page.locator('text=ПРОПУСТИТИ ЗАСТАВКУ');
      await skipBtn.waitFor({ state: 'visible', timeout: 5000 });
      console.log('Знайдено кнопку пропуску заставки. Клікаємо...');
      await skipBtn.click();
    } catch (e) {
      console.log('Кнопку пропуску заставки не знайдено або таймаут, продовжуємо стандартне очікування...');
    }

    await page.waitForSelector('text=PREDATOR', { timeout: 15000 });
    
    // Клікаємо на монету/логотип для запуску сканування
    const coin = page.locator('.cursor-pointer').first();
    await coin.click();
    
    // Чекаємо екрану вибору ролей
    await page.waitForSelector('text=КОМАНДИР СУВЕРЕНІТЕТУ', { timeout: 15000 });
    
    // Клікаємо на КОМАНДИР СУВЕРЕНІТЕТУ
    const roleButton = page.locator('button').filter({ hasText: 'КОМАНДИР СУВЕРЕНІТЕТУ' });
    await roleButton.click();
    
    // Чекаємо редіректу на головну сторінку адміна
    await page.waitForURL('**/admin/command?tab=infra', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const adminViews = [
      { name: 'admin_infra.png', url: 'http://localhost:3030/admin/command?tab=infra' },
      { name: 'admin_dataops.png', url: 'http://localhost:3030/admin/command?tab=dataops' },
      { name: 'admin_security.png', url: 'http://localhost:3030/admin/command?tab=security' },
      { name: 'admin_gitops.png', url: 'http://localhost:3030/admin/command?tab=gitops' },
      { name: 'admin_factory.png', url: 'http://localhost:3030/admin/command?tab=factory' },
      { name: 'admin_datasets.png', url: 'http://localhost:3030/admin/command?tab=datasets' },
      { name: 'admin_knowledge.png', url: 'http://localhost:3030/admin/command?tab=knowledge' },
      { name: 'admin_scenarios.png', url: 'http://localhost:3030/admin/command?tab=scenarios' },
      { name: 'admin_agents_ops.png', url: 'http://localhost:3030/admin/command?tab=agents-ops' },
      { name: 'admin_settings.png', url: 'http://localhost:3030/admin/command?tab=settings' },
      { name: 'admin_db_center.png', url: 'http://localhost:3030/admin/database-command-center' }
    ];

    for (const view of adminViews) {
      console.log(`Перехід на: ${view.url} -> Збереження у ${view.name}`);
      await page.goto(view.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Даємо час дозавантажитись картам і чартам
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, view.name), fullPage: false });
    }
  });
});
