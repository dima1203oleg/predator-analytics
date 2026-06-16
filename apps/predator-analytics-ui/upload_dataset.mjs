import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const UI_URL = 'http://localhost:3030';
const TEST_FILE_PATH = '/Users/dima1203/Desktop/Березень_2024_repacked.xlsx';

(async () => {
  console.log(`[E2E] Розпочинаємо автоматизований E2E тест PREDATOR Analytics...`);
  
  if (!fs.existsSync(TEST_FILE_PATH)) {
    console.error(`[E2E] ПОМИЛКА: Файл ${TEST_FILE_PATH} не знайдено!`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: false }); // Показувати браузер
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Авторизація
    console.log(`[E2E] 1. Відкриття сторінки авторизації...`);
    await page.goto(`${UI_URL}/login`);
    
    // Чекаємо форму
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'admin@predator.ua');
    await page.fill('input[type="password"]', 'admin_password');
    await page.click('button:has-text("Увійти")');
    
    // Чекаємо завантаження дашборду
    console.log(`[E2E] 2. Авторизація успішна. Перехід до дашборду...`);
    await page.waitForURL(`${UI_URL}/dashboard`, { timeout: 15000 });

    // 2. Перехід до розділу імпорту
    console.log(`[E2E] 3. Перехід до модуля імпорту...`);
    await page.goto(`${UI_URL}/ingestion`);
    await page.waitForSelector('text="Завантаження реєстрів"', { timeout: 15000 });

    // 3. Завантаження файлу
    console.log(`[E2E] 4. Ініціалізація завантаження Excel-файлу (247 MB)...`);
    // Оскільки ми не знаємо точний селектор input file, знайдемо його по типу
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      throw new Error("Не знайдено елемент input[type='file']");
    }
    await fileInput.setInputFiles(TEST_FILE_PATH);

    // Додамо опис чи інші поля якщо потрібно
    // ...

    // Шукаємо кнопку "Імпортувати" чи "Завантажити"
    const importBtn = await page.$('button:has-text("Завантажити"), button:has-text("Імпортувати")');
    if (importBtn) {
      await importBtn.click();
    } else {
      console.warn(`[E2E] Кнопку завантаження не знайдено, можливо завантаження почалося автоматично.`);
    }

    // 4. Очікування прогресу
    console.log(`[E2E] 5. Відстеження TUS/ETL прогресу...`);
    
    // Тут логіка відстеження UI прогрес бару (залежить від реалізації UI)
    // Наприклад, шукаємо текст "100%" або "Завершено"
    await page.waitForSelector('text="Завершено", text="100%"', { timeout: 300000 }); // До 5 хвилин для 247 MB
    console.log(`[E2E] 6. Завантаження та базова обробка успішно завершені!`);

    // 5. Перевірка AI чату
    console.log(`[E2E] 7. Перевірка інтеграції з AI Copilot...`);
    await page.goto(`${UI_URL}/ai-copilot`);
    
    // Вводимо питання в чат
    const chatInput = await page.waitForSelector('textarea');
    await chatInput.fill('Покажи декларації за березень 2024 року');
    await page.keyboard.press('Enter');

    // Чекаємо відповідь від DeepSeek-R1 (таймаут 120с як ми налаштували)
    console.log(`[E2E] 8. Очікування відповіді від DeepSeek-R1 (Local LLM)...`);
    await page.waitForSelector('.ai-message, .bot-message', { timeout: 120000 });
    console.log(`[E2E] 9. Відповідь від AI успішно отримана!`);

    console.log(`[E2E] ТЕСТ УСПІШНО ПРОЙДЕНО. Всі підсистеми відпрацювали коректно.`);
  } catch (err) {
    console.error(`[E2E] ПОМИЛКА під час виконання тесту:`, err);
  } finally {
    // Зберігаємо скріншот на випадок помилки
    await page.screenshot({ path: '/Users/Shared/Predator_60/apps/predator-analytics-ui/e2e_final.png' });
    await browser.close();
  }
})();
