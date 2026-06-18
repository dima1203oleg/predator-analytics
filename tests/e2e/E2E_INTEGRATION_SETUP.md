# 🧪 Інструкція з налаштування уніфікованого E2E тестування

## 📋 Огляд

Цей документ описує повне налаштування інтегрованого середовища для E2E тестування PREDATOR Analytics з використанням:
- **Browser Use** - AI-агент для автономного тестування браузера
- **Playwright** - Фреймворк для E2E тестів
- **MCP Playwright** - Model Context Protocol сервер для глибокої інтеграції
- **Візуальна регресія** - Автоматична перевірка візуальної цілісності

## 🔧 Встановлені компоненти

### 1. Python середовище
- **Версія**: Python 3.14.4
- **Віртуальне середовище**: `/Users/Shared/Predator_60/tests/e2e/e2e_venv`
- **Основні пакети**:
  - `browser-use` - Фреймворк для AI-агента браузера
  - `playwright` - Фреймворк для E2E тестування

### 2. Playwright для фронтенду
- **Конфігурація**: `/Users/Shared/Predator_60/apps/predator-analytics-ui/playwright.config.ts`
- **Каталог тестів**: `/Users/Shared/Predator_60/apps/predator-analytics-ui/e2e/`
- **Порт за замовчуванням**: 3030

### 3. MCP сервери
- **Конфігурація**: `/Users/dima1203/.codeium/windsurf/mcp_config.json`
- **Підключені сервери**:
  - `mcp-playwright` - Для глибокої інтеграції з браузером
  - `figma-remote-mcp-server` - Для роботи з Figma

## 🚀 Швидкий старт

### Запуск фронтенду на порту 3030
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

### Активація Python середовища для E2E тестів
```bash
cd /Users/Shared/Predator_60/tests/e2e
source e2e_venv/bin/activate
```

### Запуск Playwright тестів (фронтенд)
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run test          # Всі тести
npm run test:unit      # Unit тести
npm run test:ui        # UI режим для тестів
npm run test:headed    # З відображенням браузера
```

### Запуск візуальних регресійних тестів
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright test visual-regression.spec.ts
```

### Використання Browser Use інтеграції
```bash
cd /Users/Shared/Predator_60/tests/e2e
source e2e_venv/bin/activate
python browser_use_integration.py
```

## 📁 Структура тестів

### Playwright тести (TypeScript)
```
apps/predator-analytics-ui/e2e/
├── visual-regression.spec.ts          # Візуальні регресійні тести
├── autonomous-excel-import.spec.ts    # Автономний E2E тест імпорту Excel
└── [інші тестові файли]
```

### Python інтеграційні тести
```
tests/e2e/
├── browser_use_integration.py         # Інтеграція browser-use
├── master_orchestrator.py              # Головний оркестратор
├── validate_8_dbs.py                   # Валідація 8 баз даних
└── e2e_venv/                           # Віртуальне середовище
```

## 🎨 Візуальна регресія

### Принципи роботи
- Використовує вбудовану функцію Playwright `toHaveScreenshot()`
- Порівнює поточні знімки з еталонними
- Підтримує різні розміри екрану (мобільні, планшети, desktop)
- Автоматично ігнорує анімації для стабільності

### Створення нових візуальних тестів
```typescript
test('назва тесту', async ({ page }) => {
  await page.goto('/url');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('file-name.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

### Оновлення еталонних знімків
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright test --update-snapshots
```

## 🤖 Browser Use інтеграція

### Основні можливості
1. **Автономне тестування** - AI-агент самостійно виконує завдання
2. **Гнучкі сценарії** - Опис завдань природною мовою
3. **Автоматичні скріншоти** - Документування кожного кроку
4. **Самооновлення** - Агент може адаптуватися до змін UI

### Приклад використання
```python
import asyncio
from browser_use_integration import BrowserUseIntegration

async def test_import():
    integration = BrowserUseIntegration(headless=False)
    result = await integration.test_excel_import_autonomous(
        "/Users/dima1203/Desktop/Березень_2024_repacked.xlsx"
    )
    print(f"Результат: {result}")
    await integration.cleanup()

asyncio.run(test_import())
```

## 🔌 MCP інтеграція

### Перевірка доступних MCP серверів
```bash
# В терміналі Devin CLI
mcp list servers
```

### Використання MCP Playwright інструментів
MCP Playwright сервер надає інструменти для:
- `browser_close` - Закриття браузера
- `browser_resize` - Зміна розміру вікна
- `browser_console_messages` - Отримання повідомлень консолі
- `browser_evaluate` - Виконання JavaScript
- `browser_click` - Кліки по елементах
- `browser_fill_form` - Заповнення форм
- І багато інших

## 📊 Повний цикл тестування

### 1. Запуск локального середовища
```bash
# Фронтенд на порту 3030
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev &

# Mock API на порту 9080 (якщо бекенд недоступний)
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
node mock-api-server.mjs &
```

### 2. Запуск візуальних регресійних тестів
```bash
npx playwright test visual-regression.spec.ts
```

### 3. Запуск автономних E2E тестів
```bash
cd /Users/Shared/Predator_60/tests/e2e
source e2e_venv/bin/activate
./run_autonomous_agent_v2.sh
```

### 4. Перевірка результатів
```bash
# Звіти Playwright
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
open playwright-report/index.html

# Звіти автономних тестів
cd /Users/Shared/Predator_60/tests/e2e/reports
ls -la
```

## 🛠️ Налаштування та вирішення проблем

### Оновлення Playwright браузерів
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright install --with-deps
```

### Перевірка портів
```bash
lsof -i :3030  # Фронтенд
lsof -i :9080  # Mock API
lsof -i :8000  # Core API
```

### Очищення кешів
```bash
# Playwright кеш
rm -rf ~/Library/Caches/ms-playwright

# Node modules (у разі проблем з залежностями)
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
rm -rf node_modules package-lock.json
npm install
```

### Python віртуальне середовище
```bash
# Перестворення venv
cd /Users/Shared/Predator_60/tests/e2e
rm -rf e2e_venv
python3 -m venv e2e_venv
source e2e_venv/bin/activate
pip install browser-use playwright
playwright install
```

## 🎯 Рекомендовані практики

1. **Візуальні тести**: Запускайте перед кожним релізом для перевірки UI
2. **Автономні тести**: Використовуйте для складних сценаріїв з Excel імпортом
3. **MCP інтеграція**: Використовуйте для налагодження та глибокого аналізу сторінок
4. **Паралельні тести**: Playwright автоматично запускає тести паралельно
5. **Скріншоти при помилках**: Автоматично зберігаються у `test-results`

## 📞 Додаткові ресурси

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Browser Use Documentation](https://github.com/browser-use/browser-use)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [PREDATOR Analytics AGENTS.md](file:///Users/Shared/Predator_60/AGENTS.md)

## ✅ Перевірка встановлення

### Перевірити все встановлено коректно
```bash
# Python версія
python3 --version  # >= 3.12

# Playwright встановлено
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright --version

# Browser use встановлено
cd /Users/Shared/Predator_60/tests/e2e
source e2e_venv/bin/activate
python -c "import browser_use; print('browser-use OK')"

# MCP сервери доступні
# (Перевіряється через Devin CLI)
```

---

**Статус**: ✅ Повністю налаштовано та готово до використання

**Дата**: 18 червня 2026

**Версія**: PREDATOR Analytics v61.0-ELITE
