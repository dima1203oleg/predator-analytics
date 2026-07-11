import { chromium } from 'playwright';
import path from 'path';

const UI_URL = 'http://localhost:3030';
const TEST_FILE_PATH = path.resolve('./public/mock-data/Risk_Entities.csv');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Встановлюємо стейт щоб пропустити Onboarding
    await page.goto(`${UI_URL}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        localStorage.setItem('predator_onboarding_completed', 'true');
    });

    console.log(`[E2E] 1. Відкриття ${UI_URL}/auth/login...`);
    await page.goto(`${UI_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
    
    // Skip Intro Video if it appears
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Чекаємо форму
    await page.waitForSelector('input[placeholder="ОПЕРАТИВНИЙ КОД (ЛОГІН)"]');
    await page.fill('input[placeholder="ОПЕРАТИВНИЙ КОД (ЛОГІН)"]', 'admin');
    await page.fill('input[placeholder="КРИПТО-КЛЮЧ (ПАРОЛЬ)"]', 'admin123');
    await page.click('button:has-text("УВІЙТИ В СИСТЕМУ")');
    
    // Чекаємо поки пройде сканування і перейде далі
    console.log(`[E2E] 2. Очікування біометричного сканування...`);
    await page.waitForTimeout(3000);
    await page.waitForURL(`**/admin/command**`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    
    // Перехід в розділ Ingestion
    console.log(`[E2E] 3. Перехід в розділ Ingestion...`);
    await page.goto(`${UI_URL}/ingestion`, { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('text="ЦЕНТР ІМПОРТУ ДОКУМЕНТІВ"', { timeout: 15000 });

    // 3. Завантаження файлу
    console.log(`[E2E] 4. Ініціалізація завантаження Excel-файлу...`);
    // Оскільки ми не знаємо точний селектор input file, знайдемо його по типу
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error("Не знайдено елемент input[type='file']");
    }
    await fileInput.setInputFiles(TEST_FILE_PATH);

    // Чекаємо поки скрипт прочитає файл (onUploadSuccess)
    console.log(`[E2E] 5. Очікування на обробку файлу...`);
    // Процес імітації "завантаження" пайплайном (займає ~8 секунд)
    await page.waitForTimeout(10000);

    console.log(`[E2E] Успішно! Ingestion workflow працює.`);
    
  } catch (error) {
    console.error(`[E2E] Помилка:`, error);
  } finally {
    await browser.close();
  }
})();
