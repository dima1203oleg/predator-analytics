# Predator Analytics E2E Testing Documentation

## Огляд системи тестування

Система автоматизованого тестування Predator Analytics забезпечує повну перевірку функціональності через веб-інтерфейс. Базується на Cypress та інтегрується з кастомним тестовим раннером.

## Структура проекту

```
tests/e2e/
├── cypress.config.ts          # Конфігурація Cypress
├── package.json               # Залежності
├── run_e2e_tests.sh          # Скрипт запуску
├── cypress/
│   ├── fixtures/              # Тестові дані
│   │   ├── Березень_2024.xlsx # Тестовий файл
│   │   └── test-data-metadata.json
│   ├── integration/           # Тестові сценарії
│   │   ├── full-cycle.cy.ts   # Повний цикл E2E
│   │   ├── models.cy.ts       # Тести моделей
│   │   ├── reports.cy.ts      # Звіти
│   │   └── opensearch.cy.ts   # OpenSearch
│   ├── support/
│   │   ├── e2e.ts            # Глобальні хуки
│   │   └── commands.ts       # Кастомні команди
│   └── reports/              # Результати тестів
```

## Тестові сценарії

### 1. Full E2E Cycle (`full-cycle.cy.ts`)

Повний цикл тестування від завантаження файлу до отримання результатів:

- **Завантаження файлу**: Тестує upload XLSX через UI
- **Обробка даних**: Перевіряє обробку 500+ записів
- **Моделі**: Викликає Groq, DeepSeek, Gemini, Karpathy
- **Fallback**: Тестує переключення при збоях
- **Звіти**: PDF та Markdown генерація
- **OpenSearch**: Перевірка логів та індексації

### 2. Models Testing (`models.cy.ts`)

Тестування кожної моделі окремо:

- **Groq**: Перевірка API, обробка запитів
- **DeepSeek**: Тестування з урахуванням лімітів
- **Gemini**: Формат відповідей
- **Karpathy**: Mock для локального запуску
- **Fallback Chain**: Порядок переключення

### 3. Report Generation (`reports.cy.ts`)

Перевірка генерації звітів:

- PDF з водяними знаками та підписом
- Markdown для розробників
- Доставка через UI та email

### 4. OpenSearch (`opensearch.cy.ts`)

Інтеграція з OpenSearch Dashboard:

- Доступність дашборду
- Логування подій
- Індексація даних
- Пошук та візуалізація

## Запуск тестів

### Локальний запуск (Mac)

```bash
# Встановлення залежностей
cd tests/e2e
npm install

# Запуск всіх тестів
./run_e2e_tests.sh --local

# Інтерактивний режим (Cypress GUI)
./run_e2e_tests.sh --local --open

# Конкретний тест
./run_e2e_tests.sh --local --spec full-cycle

# З генерацією звіту
./run_e2e_tests.sh --local --report
```

### Віддалений сервер

```bash
# Встановити URL сервера
export REMOTE_URL=https://your-server.example.com

# Запуск
./run_e2e_tests.sh --remote
```

### Через npm

```bash
# Всі тести
npm run test:all

# E2E цикл
npm run test:e2e

# Тести моделей
npm run test:models

# Локальне середовище
npm run test:local
```

## Кастомні команди Cypress

### Завантаження файлів

```typescript
cy.uploadXlsxFile('Березень_2024.xlsx');
cy.waitForFileProcessing(120000);
```

### Тестування моделей

```typescript
cy.testModelEndpoint('groq').then((result) => {
  expect(result.success).to.be.true;
});

cy.triggerFallback('groq');
cy.verifyFallbackActivated('deepseek');
```

### Звіти

```typescript
cy.validatePdfReport({ checkWatermark: true, checkSignature: true });
cy.validateMarkdownReport();
cy.downloadReport('pdf');
```

### OpenSearch

```typescript
cy.verifyOpenSearchLogs(runId);
cy.checkDataIndexed(500);
```

## Вхідний тестовий файл

**Файл**: `Березень_2024.xlsx`

**Характеристики**:
- Кількість записів: 500-1000
- Формат: Митні декларації України
- Поля:
  - Номер декларації
  - Дата
  - Код товару (HS)
  - Опис товару
  - Країна походження
  - Митна вартість (USD)
  - Вага
  - Митниця оформлення
  - Отримувач (ЄДРПОУ, назва)
  - Статус

### Генерація тестових даних

```bash
# Через Python
python -c "
from ua_sources.app.services.test_data_generator import get_test_data_generator
generator = get_test_data_generator()
generator.generate_xlsx('sample_data/Березень_2024.xlsx', 500)
"

# Або через npm
npm run generate:data
```

## Mock-сервіси

### Локальний запуск

При локальному запуску (Mac) автоматично використовуються mock-сервіси:

- **Karpathy**: Повний mock (локальна модель недоступна)
- **Інші моделі**: Реальні API через інтернет

### Керування моками

```typescript
// Увімкнути mock
cy.enableMockMode('karpathy');

// Симулювати помилку
cy.request({
  method: 'POST',
  url: '/api/v1/e2e/mock/enable',
  body: { model: 'groq', mode: 'fail' }
});

// Вимкнути
cy.disableMockMode('groq');
```

## Звіти

### PDF-звіт

- **Водяний знак**: "PREDATOR ANALYTICS"
- **Підпис**: "Predator Analytics System"
- **Секції**:
  - Загальна інформація
  - Статистика обробки
  - Використані моделі
  - Результати

### Markdown-звіт

- Логи виконання
- Технічні деталі
- Використані моделі
- Fallback події
- Рекомендації

## Середовища

### Пріоритетне (Віддалений сервер)

- URL: Налаштовується через `REMOTE_URL`
- Всі сервіси реальні
- Karpathy на GPU

### Резервне (Mac локально)

- URL: `http://localhost:8082`
- Karpathy mock
- Зовнішні API через інтернет

## CI/CD Інтеграція

### GitHub Actions

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        working-directory: tests/e2e
        config-file: cypress.config.ts
```

### Розклад автоматичного запуску

Рекомендується:
- При кожному деплої на staging
- Щоденно о 6:00 UTC
- Перед release

## Усунення проблем

### Тести не запускаються

```bash
# Перевірте залежності
npm install
npx cypress verify
```

### Timeout помилки

```bash
# Збільште timeout
export CYPRESS_defaultCommandTimeout=60000
```

### OpenSearch недоступний

```bash
# Перевірте сервіс
curl http://localhost:9200/_cluster/health
```

## Контакти

- **Документація**: `/docs/testing/`
- **Issues**: GitHub Issues
- **Telegram**: @predator_support
