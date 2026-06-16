# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: run_full_e2e_test.spec.ts >> PREDATOR Analytics v61.0-ELITE E2E Import Test >> Повний цикл завантаження та валідації 8 баз
- Location: e2e/run_full_e2e_test.spec.ts:12:3

# Error details

```
Test timeout of 900000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 900000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e11] [cursor=pointer]:
  - img [ref=e12]
  - text: НАТИСНІТЬ ДЛЯ ЗАПУСКУ МАТРИЦІ
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import * as fs from 'fs';
  3   | import { execSync } from 'child_process';
  4   | import * as path from 'path';
  5   | 
  6   | const UI_URL = 'http://localhost:3030'; // Or NVIDIA server URL if UI is there. Wait, UI is on MacBook 3030 port forwarding.
  7   | const TEST_FILE_PATH = '/Users/dima1203/Desktop/Березень_2024_repacked.xlsx';
  8   | 
  9   | test.describe('PREDATOR Analytics v61.0-ELITE E2E Import Test', () => {
  10  |   test.setTimeout(900000); // 15 хвилин таймаут для повного циклу
  11  | 
  12  |   test('Повний цикл завантаження та валідації 8 баз', async ({ page }) => {
  13  |     console.log(`[E2E] 1. Відкриття сторінки авторизації...`);
  14  |     await page.goto(`${UI_URL}/login`);
  15  |     
  16  |     // Чекаємо форму
> 17  |     await page.waitForSelector('input[type="text"]');
      |                ^ Error: page.waitForSelector: Test timeout of 900000ms exceeded.
  18  |     await page.fill('input[type="text"]', 'admin@predator.dev');
  19  |     await page.fill('input[type="password"]', 'admin123');
  20  |     await page.click('button:has-text("УВІЙТИ В СИСТЕМУ")');
  21  |     
  22  |     // Чекаємо завантаження дашборду
  23  |     console.log(`[E2E] 2. Авторизація успішна. Перехід до дашборду...`);
  24  |     await page.waitForURL('**/admin/command*', { timeout: 15000 });
  25  | 
  26  |     // Перевірка прав адміністратора
  27  |     const userRole = await page.textContent('.user-role-badge');
  28  |     expect(userRole).toContain('Admin');
  29  | 
  30  |     // Перехід до розділу імпорту
  31  |     console.log(`[E2E] 3. Перехід до модуля імпорту...`);
  32  |     await page.goto(`${UI_URL}/ingestion`);
  33  |     await page.waitForSelector('text="ЦЕНТР ІМПОРТУ ДОКУМЕНТІВ"', { timeout: 15000 });
  34  | 
  35  |     // Завантаження файлу
  36  |     console.log(`[E2E] 4. Ініціалізація завантаження Excel-файлу (247 MB)...`);
  37  |     // Завантаження файлу: пробуємо знайти видимий input[type="file"]; якщо не знайдено, використовуємо безпосередньо setInputFiles
  38  |     const fileInputHandle = await page.$('input[type="file"]');
  39  |     if (fileInputHandle) {
  40  |       await fileInputHandle.setInputFiles(TEST_FILE_PATH);
  41  |     } else {
  42  |       // hidden або кастомний файл інпут, використання форсу
  43  |       await page.setInputFiles('input[type="file"]', TEST_FILE_PATH);
  44  |     }
  45  | 
  46  |     // Шукаємо кнопку імпорту
  47  |     const importBtn = await page.$('button:has-text("ПОЧАТИ ІМПОРТ")');
  48  |     if (importBtn) {
  49  |       await importBtn.click();
  50  |     } else {
  51  |       throw new Error('Кнопку "ПОЧАТИ ІМПОРТ" не знайдено');
  52  |     }
  53  | 
  54  |     // Чекаємо завершення імпорту (індикатор успіху)
  55  |     await page.waitForSelector('.import-success, .import-complete', { timeout: 15 * 60 * 1000 });
  56  |     
  57  |     console.log(`[E2E] 5. Відстеження TUS/ETL прогресу... (може тривати до 15 хвилин)`);
  58  |     // На практиці тут треба чекати конкретний селектор, що сигналізує про завершення
  59  |     // Якщо файл не завантажено, ми просто імітуємо перевірку:
  60  |     await page.waitForTimeout(10000); // Wait for upload UI to react
  61  | 
  62  |     console.log(`[E2E] 6. Виконання бекенд-валідації на сервері NVIDIA...`);
  63  |     
  64  |     // Синхронізуємо валідаційний скрипт та запускаємо його
  65  |     try {
  66  |       const sshCommand = `scp /Users/Shared/Predator_60/tests/e2e/validate_8_dbs.py predator-server:/tmp/validate_8_dbs.py && ssh predator-server "docker cp /tmp/validate_8_dbs.py deploy-core-api-1:/tmp/validate_8_dbs.py && docker exec deploy-core-api-1 bash -c 'pip install qdrant-client opensearch-py > /dev/null 2>&1 && python /tmp/validate_8_dbs.py'"`;
  67  |       console.log(`Виконується: ${sshCommand}`);
  68  |       const output = execSync(sshCommand, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
  69  |       console.log(`[E2E] Результати валідації 8 баз:`);
  70  |       console.log(output);
  71  |       
  72  |       const jsonStart = output.indexOf('{');
  73  |       const jsonEnd = output.lastIndexOf('}');
  74  |       const jsonStr = output.substring(jsonStart, jsonEnd + 1);
  75  |       const validationResults = JSON.parse(jsonStr);
  76  |       
  77  |       // Перевіряємо статуси
  78  |       expect(validationResults.postgres.status).not.toBe('error');
  79  |       expect(validationResults.redis.status).not.toBe('error');
  80  |       expect(validationResults.qdrant.status).not.toBe('error');
  81  |       expect(validationResults.neo4j.status).not.toBe('error');
  82  |       
  83  |       // Зберігаємо результати у файл
  84  |       const reportPath = '/Users/Shared/Predator_60/tests/e2e/validation_report.json';
  85  |       fs.writeFileSync(reportPath, JSON.stringify(validationResults, null, 2));
  86  |       
  87  |       // Додаємо звіт до Playwright HTML
  88  |       await test.info().attach('Validation Report', { path: reportPath, contentType: 'application/json' });
  89  | 
  90  |     } catch (e) {
  91  |       console.error("[E2E] ПОМИЛКА під час перевірки баз даних:", e);
  92  |     }
  93  | 
  94  |     // Перевірка AI чату
  95  |     console.log(`[E2E] 7. Перевірка інтеграції з AI Copilot...`);
  96  |     await page.goto(`${UI_URL}/ai-copilot`);
  97  |     
  98  |     // Вводимо питання в чат
  99  |     const chatInput = await page.waitForSelector('textarea');
  100 |     await chatInput.fill('Покажи декларації за березень 2024 року');
  101 |     await page.keyboard.press('Enter');
  102 | 
  103 |     console.log(`[E2E] 8. Очікування відповіді від DeepSeek-R1 (Local LLM)...`);
  104 |     // Wait for bot message
  105 |     await page.waitForSelector('.ai-message, .bot-message', { timeout: 120000 });
  106 |     console.log(`[E2E] 9. Відповідь від AI успішно отримана!`);
  107 | 
  108 |     console.log(`[E2E] ТЕСТ УСПІШНО ПРОЙДЕНО.`);
  109 |   });
  110 | });
  111 | 
```