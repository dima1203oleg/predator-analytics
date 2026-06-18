# 🦅 Autonomous E2E Test для PREDATOR Analytics v61.0-ELITE

## Огляд

Це повністю автономний наскрізний (End-to-End) тест для автоматизованої перевірки імпорту Excel файлів через веб-інтерфейс PREDATOR Analytics. Тест включає:

- ✅ Симуляцію реальної поведінки користувача в браузері
- ✅ Валідацію всіх 8 баз даних (PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO, Redpanda)
- ✅ Перевірку векторизації та AI-чату
- ✅ DOM-аудит та моніторинг ETL прогресу
- ✅ Механізм самовідновлення при помилках
- ✅ Детальну генерацію звітів (JSON, Markdown, HTML)
- ✅ Автоматичну перевірку консистентності даних

## Архітектура

```
┌─────────────────────────────────────────────────────────┐
│         🦅 Autonomous E2E Test Orchestrator             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Playwright Browser Automation                      │
│     - Авторизація                                       │
│     - Навігація UI                                      │
│     - Завантаження Excel                                │
│     - Моніторинг ETL                                    │
│     - DOM-аудит                                         │
│     - AI-чат тести                                      │
│                                                         │
│  2. Database Validation Module                          │
│     - PostgreSQL (структура, індекси, дані)             │
│     - ClickHouse (аналітичні таблиці)                   │
│     - Neo4j (вузли, ребра, граф)                        │
│     - Qdrant (вектори, колекції)                        │
│     - OpenSearch (індексація, пошук)                    │
│     - Redis (кеш, черги)                               │
│     - MinIO (файли, артефакти)                          │
│     - Redpanda (Kafka повідомлення)                     │
│                                                         │
│  3. Self-Healing Mechanism                              │
│     - Аналіз помилок                                    │
│     - Автоматичний перезапуск сервісів                   │
│     - Ітеративні виправлення                            │
│                                                         │
│  4. Report Generation                                   │
│     - JSON (structured data)                            │
│     - Markdown (readable report)                        │
│     - HTML (Playwright report)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Вимоги

### Системні вимоги

- **MacBook**: Для запуску IDE та Playwright тестів
- **NVIDIA Server** (predator-server): Для розгортання бекенду та баз даних
- **SSH доступ**: До NVIDIA сервера через alias `predator-server`
- **Тестовий файл**: `/Users/dima1203/Desktop/Березень_2024_repacked.xlsx`

### Програмні вимоги

- **Node.js** 18+ (для Playwright)
- **Python** 3.12 (для валідації баз даних)
- **Docker** (на NVIDIA сервері)
- **Playwright** Chromium

## Встановлення

### 1. Налаштування SSH доступу

Переконайтеся, що у вас є SSH alias для NVIDIA сервера:

```bash
# Додати до ~/.ssh/config
Host predator-server
    HostName 194.177.1.200
    User predator
    IdentityFile ~/.ssh/id_rsa
    StrictHostKeyChecking no
```

Перевірте з'єднання:

```bash
ssh predator-server "echo 'Connection successful'"
```

### 2. Встановлення залежностей

```bash
# Перейти в директорію фронтенду
cd /Users/Shared/Predator_60/apps/predator-analytics-ui

# Встановити npm залежності
npm install

# Встановити Playwright браузери
npx playwright install chromium
```

### 3. Налаштування Python залежностей на NVIDIA

```bash
# Скрипт автоматично встановить необхідні пакети при першому запуску
ssh predator-server "docker exec deploy-core-api-1 pip install qdrant-client opensearch-py"
```

## Використання

### Режими роботи

Автономний E2E тест підтримує кілька режимів роботи:

1. **auto** (за замовчуванням) - автоматичне визначення режиму
2. **local** - локальний бекенд на порту 8000
3. **remote** - бекенд на NVIDIA сервері через Docker
4. **ui-only** - тільки UI тестування без валідації баз даних

### Швидкий старт (автоматичний режим)

Запустіть автономний тест однією командою:

```bash
cd /Users/Shared/Predator_60/tests/e2e
./run_autonomous_e2e.sh
```

Скрипт автоматично визначить наявність бекенду і вибере відповідний режим.

### Запуск в конкретному режимі

**UI-Only режим (тільки тестування інтерфейсу):**
```bash
cd /Users/Shared/Predator_60/tests/e2e
./run_autonomous_e2e.sh ui-only
```

**Локальний режим (якщо бекенд запущено локально):**
```bash
cd /Users/Shared/Predator_60/tests/e2e
./run_autonomous_e2e.sh local
```

**Remote режим (для NVIDIA сервера з запущеними контейнерами):**
```bash
cd /Users/Shared/Predator_60/tests/e2e
./run_autonomous_e2e.sh remote
```

### Ручний запуск

Якщо потрібно більше контролю, можна запустити компоненти окремо:

#### 1. Запуск UI (якщо ще не запущено)

```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

#### 2. Запуск Playwright тесту

```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui

# Запуск конкретного тесту
npx playwright test e2e/autonomous-excel-import.spec.ts \
    --reporter=html,list \
    --headed=false \
    --browser=chromium

# Запуск в headed режимі (з видимим браузером)
npx playwright test e2e/autonomous-excel-import.spec.ts \
    --headed=true \
    --browser=chromium
```

### Перемінні середовища

Можна налаштувати через `.env` або CLI:

```bash
# URL UI (за замовчуванням http://localhost:3030)
export PLAYWRIGHT_BASE_URL="http://localhost:3030"

# NVIDIA сервер SSH alias
export NVIDIA_SERVER="predator-server"

# Шлях до тестового файлу
export TEST_FILE_PATH="/Users/dima1203/Desktop/Березень_2024_repacked.xlsx"
```

## Структура тесту

### Головний файл: `autonomous-excel-import.spec.ts`

Тест реалізовано як клас `AutonomousE2EOrchestrator` з наступними методами:

#### 1. `execute()` - Головний цикл
- Керує ітераціями самовідновлення
- Координує всі етапи тесту
- Генерує фінальний звіт

#### 2. `authenticate()` - Автентифікація
- Відкриває сторінку логіну
- Вводить облікові дані адміністратора
- Перевіряє роль користувача

#### 3. `navigateToImport()` - Навігація
- Переходить до сторінки імпорту
- Перевіряє наявність елементів UI

#### 4. `uploadExcelFile()` - Завантаження файлу
- Перевіряє наявність файлу
- Завантажує через HTML input
- Натискає кнопку імпорту

#### 5. `monitorETLProgress()` - Моніторинг
- Відстежує прогрес-бар
- Чекає індикатори завершення
- Обробляє таймаути

#### 6. `performDOMAudit()` - DOM-аудит
- Збирає консольні помилки
- Перевіряє WebSocket з'єднання
- Аналізує оновлення таблиць

#### 7. `validateAllDatabases()` - Валідація БД
- Запускає validate_8_dbs.py на NVIDIA
- Парсить JSON результати
- Повертає детальний статус

#### 8. `checkConsistency()` - Консистентність
- Порівнює кількість записів між сховищами
- Виявляє розбіжності
- Фіксує в звіті

#### 9. `checkVectorization()` - Векторизація
- Перевіряє наявність векторів
- Аналізує колекції Qdrant
- Перевіряє розмірність векторів

#### 10. `testAIChat()` - AI-чат
- Виконує серію запитів
- Перевіряє відповіді
- Аналізує використані компоненти

#### 11. `performFinalValidation()` - Фінальна валідація
- Обчислює загальний результат
- Перевіряє критерії успіху
- Приймає рішення PASS/FAIL

#### 12. `attemptSelfHealing()` - Самовідновлення
- Аналізує помилки
- Перезапускає відповідні сервіси
- Фіксує застосовані виправлення

#### 13. `generateReport()` - Звіти
- Генерує JSON звіт
- Генерує Markdown звіт
- Додає до Playwright звіту

## Валідація баз даних

### Файл: `validate_8_dbs.py`

Покращений модуль для детальної валідації кожної бази даних:

#### PostgreSQL
- Кількість записів
- Структура таблиці (колонки, типи)
- Індекси
- Зовнішні ключі

#### ClickHouse
- Кількість таблиць
- Аналітичні таблиці
- Матеріалізовані представлення
- Агрегати

#### Neo4j
- Кількість вузлів
- Кількість ребер
- Типи вузлів
- Типи ребер
- Індекси

#### Qdrant
- Список колекцій
- Кількість векторів
- Розмірність векторів
- Статус колекцій

#### OpenSearch
- Індекси
- Кількість документів
- Статус кластера
- Розмір індексів

#### Redis
- Кількість ключів
- Патерни ключів
- Використання пам'яті
- Черги

#### MinIO
- Бакети
- Кількість об'єктів
- Розмір даних
- Метадані

#### Redpanda
- Топіки
- Партіції
- Статус кластера

## Звіти

### Розташування звітів

```
tests/e2e/reports/
├── latest/                          # Останні звіти
│   ├── report.json                  # JSON звіт
│   └── report.md                    # Markdown звіт
├── autonomous-e2e-report-*.json     # Тимчасові JSON звіти
├── autonomous-e2e-report-*.md       # Тимчасові Markdown звіти
├── playwright-report-*/            # Playwright HTML звіти
└── final-report-*.md               # Фінальні звіти
```

### Структура JSON звіту

```json
{
  "timestamp": "2024-06-18T12:00:00.000Z",
  "iteration": 1,
  "etl_success": true,
  "validation_results": {
    "postgres": { "status": "ok", "count": 12345, "details": {...} },
    "clickhouse": { "status": "ok", "tables_count": 10, "details": {...} },
    // ... інші БД
  },
  "ai_queries": [
    { "query": "...", "response": "...", "success": true }
  ],
  "dom_audit": {
    "console_errors": [],
    "websocket_connected": true,
    "progress_bar_visible": true
  },
  "consistency_check": {
    "excel_rows": 12345,
    "postgres_rows": 12345,
    "qdrant_vectors": 12345,
    // ... інші метрики
  },
  "performance_metrics": {
    "upload_time": 15000,
    "etl_time": 120000,
    "validation_time": 5000,
    "total_time": 140000
  },
  "errors": [],
  "fixes_applied": [],
  "final_status": "PASS"
}
```

## Критерії успіху

Тест вважається успішним якщо:

1. **ETL завершено без критичних помилок**
2. **80%+ баз даних у статусі OK**
3. **80%+ AI запитів успішних**
4. **Консистентність даних підтверджено**
5. **DOM без критичних помилок**
6. **Векторизація активна**

## Самовідновлення

Тест підтримує до 10 ітерацій самовідновлення. На кожній ітерації:

1. Аналізуються помилки попередньої спроби
2. Визначаються проблемні сервіси
3. Виконується спроба виправлення:
   - Перезапуск сервісів інгестії для ETL помилок
   - Перезапуск баз даних для проблем з БД
   - Перезапуск Qdrant для проблем з векторизацією
   - Перезапуск AI сервісів для проблем з AI-чатом
4. Тест повторюється

## Налаштування

### Таймаути

```typescript
// В autonomous-excel-import.spec.ts
const MAX_ITERATIONS = 10;  // Максимальна кількість ітерацій
test.setTimeout(30 * 60 * 1000);  // 30 хвилин таймаут тесту
```

### URL та порти

```typescript
const UI_URL = 'http://localhost:3030';
const NVIDIA_SERVER = 'predator-server';
const TEST_FILE_PATH = '/Users/dima1203/Desktop/Березень_2024_repacked.xlsx';
```

### AI запити

```typescript
const queries = [
  'Покажи декларації за березень 2024 року',
  'Знайди декларацію за номером',
  'Які товари зустрічаються найчастіше?',
  'Покажи семантично схожі декларації',
  'Побудуй короткий аналітичний звіт',
];
```

## Усунення проблем

### Проблема: UI недоступний

**Рішення:**
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

### Проблема: NVIDIA сервер недоступний або немає контейнерів

**Рішення:**
```bash
# Перевірка SSH конфігурації
ssh predator-server "echo 'test'"

# Якщо не працює, перевірте ~/.ssh/config
# та переконайтеся, що сервер доступний

# Перевірка наявності контейнерів
ssh predator-server "docker ps"

# Якщо контейнерів немає, запустіть в UI-Only режимі
./run_autonomous_e2e.sh ui-only
```

### Проблема: Контейнер не знайдено

**Рішення:**
```bash
# Перевірте назви запущених контейнерів
ssh predator-server "docker ps --format '{{.Names}}'"

# Якщо назва відрізняється від 'predator_backend', 
# встановіть її через змінну середовища:
export BACKEND_CONTAINER="реальна_назва_контейнера"
./run_autonomous_e2e.sh remote
```

### Проблема: Тестовий файл не знайдено

**Рішення:**
```bash
# Перевірте наявність файлу
ls -l /Users/dima1203/Desktop/Березень_2024_repacked.xlsx

# Якщо файл в іншому місці, оновіть шлях у тесті
export TEST_FILE_PATH="/шлях/до/вашого/файлу.xlsx"
```

### Проблема: Playwright не встановлено

**Рішення:**
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright install chromium
```

### Проблема: Python залежності відсутні на NVIDIA

**Рішення:**
```bash
ssh predator-server "docker exec deploy-core-api-1 pip install qdrant-client opensearch-py"
```

## Інтеграція з CI/CD

### GitHub Actions

```yaml
name: Autonomous E2E Test

on:
  schedule:
    - cron: '0 2 * * *'  # Щодня о 2:00
  workflow_dispatch:

jobs:
  e2e-test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd apps/predator-analytics-ui
          npm install
          npx playwright install chromium
          
      - name: Run autonomous E2E test
        run: |
          cd tests/e2e
          ./run_autonomous_e2e.sh
          
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: e2e-reports
          path: tests/e2e/reports/
```

## Моніторинг та аналітика

### Метрики продуктивності

Тест автоматично збирає такі метрики:

- **Upload Time**: Час завантаження файлу на сервер
- **ETL Time**: Час обробки даних
- **Validation Time**: Час валідації баз даних
- **Total Time**: Загальний час виконання

### Історичні дані

Результати кожного запуску зберігаються з таймстемпом, що дозволяє:

- Відстежувати деградацію продуктивності
- Аналізувати тенденції
- Порівнювати різні версії системи

## Розвиток та підтримка

### Розширення тесту

Для додавання нових перевірок:

1. Додайте метод в `AutonomousE2EOrchestrator` клас
2. Викличте його в `execute()` методі
3. Додайте результат в звіт

### Додавання нових баз даних

1. Додайте валідаційну функцію в `validate_8_dbs.py`
2. Додайте результат в `SystemValidationResult` interface
3. Оновіть логіку фінальної валідації

## Ліцензія

Цей тест є частиною проекту PREDATOR Analytics v61.0-ELITE.

## Контакти

Для питань та підтримки звертайтеся до команди розробки PREDATOR Analytics.

---

**Версія документації**: 1.0  
**Останнє оновлення**: 2024-06-18