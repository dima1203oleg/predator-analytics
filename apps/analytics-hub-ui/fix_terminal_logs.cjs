const fs = require('fs');
let content = fs.readFileSync('src/components/DataIngestionTab.tsx', 'utf8');

const replacements = {
  "PREDATOR ADIP Engine: Central scheduler active.": "PREDATOR ADIP Engine: Центральний планувальник активний.",
  "API Intelligence: Swagger parsed for OpenSanctions v4.": "API Розвідка: Swagger проаналізовано для OpenSanctions v4.",
  "MinIO landing zone: Wrote 15,000 incremental records to S3.": "Зона MinIO: Записано 15,000 інкрементних записів у S3.",
  "Deduplication AI: Cleaned 12 anomalies from EDRPOU datasets.": "ШІ Дедуплікації: Очищено 12 аномалій з наборів даних ЄДРПОУ.",
  "Qdrant Vector database: Generated Ukrainian embeddings.": "Векторна БД Qdrant: Згенеровано українські ембединги.",
  "Endpoints verified. Ping latency: < 50ms.": "Кінцеві точки перевірено. Затримка Ping: < 50ms.",
  "Classified as: State Procurement API. Sector: Government.": "Класифіковано як: API Державних закупівель. Сектор: Уряд.",
  "License: Open Data (MIT-equivalent). Risk: Low.": "Ліцензія: Відкриті дані (еквівалент MIT). Ризик: Низький.",
  "Volume: ~20GB. Update frequency: Real-time (Webhooks).": "Об'єм: ~20GB. Частота оновлень: У реальному часі (Webhooks).",
  "Schema generated. Pydantic models: 45. DB Migrations ready.": "Схему згенеровано. Pydantic моделі: 45. Міграції БД готові.",
  "Entities mapped: (Company), (Tender), (Contract).": "Сутності зіставлено: (Company), (Tender), (Contract).",
  "Relationships detected: 14 edge types. Graph ready.": "Зв'язки виявлено: 14 типів ребер. Граф готовий.",
  "Priority Score: 98.4/100 (CRITICAL). Approved for integration.": "Оцінка пріоритету: 98.4/100 (КРИТИЧНО). Схвалено для інтеграції.",
  "Generated Python Client: connectors/prozorro_client.py": "Згенеровано Python клієнт: connectors/prozorro_client.py",
  "Test coverage: 99.1%. Contract tests: PASSED.": "Покриття тестами: 99.1%. Контрактні тести: ПРОЙДЕНО.",
  "PR merged. ArgoCD Sync: Healthy. Pods: Running.": "PR злито. Синхронізація ArgoCD: У нормі. Поди: Працюють.",
  "OpenTelemetry active. Latency alerts configured.": "OpenTelemetry активна. Налаштовано сповіщення про затримку.",
  "Drift monitor: Active. Self-healing agent: Standby.": "Монітор відхилень: Активний. Агент самовідновлення: У режимі очікування.",
  "Template libraray updated. Error catalog synced.": "Бібліотеку шаблонів оновлено. Каталог помилок синхронізовано.",
  "Intelligence Scan: Complete. New formats detected: Parquet v2.": "Розвідувальне сканування: Завершено. Виявлено нові формати: Parquet v2.",
  "🤖 [AI ENGAGED] Activating Google Antigravity autonomous Self-Healing cycle for Spending.gov.ua.": "🤖 [ШІ ЗАДІЯНО] Активація автономного циклу самовідновлення Google Antigravity для Spending.gov.ua.",
  "🔍 [DISCOVERY] Fetching latest Swagger / OpenAPI v2 specifications from public-api endpoint...": "🔍 [ВИЯВЛЕННЯ] Отримання останніх специфікацій Swagger / OpenAPI v2 з кінцевої точки public-api...",
  "⚙️ [CODEGEN] Re-generating client files. patched connectors/spending.py client and updated pydantic model in schemas.py.": "⚙️ [ГЕНЕРАЦІЯ КОДУ] Перегенерація файлів клієнта. Оновлено клієнт connectors/spending.py та модель pydantic у schemas.py.",
  "🧪 [REGRESSION] Executing 14 regression test cases inside temporary Docker stack...": "🧪 [РЕГРЕСІЯ] Виконання 14 регресійних тест-кейсів у тимчасовому стеку Docker...",
  "✅ [TESTS PASSED] 14/14 tests verified. Auto-generating documentation changelog docs/spending_migration.md.": "✅ [ТЕСТИ ПРОЙДЕНО] Перевірено 14/14 тестів. Автогенерація журналу змін у документації docs/spending_migration.md.",
  "🚀 [DEPLOY] Pushed hotfix PR, bypassed CI to local sandbox production. Connection status: АКТИВНИЙ.": "🚀 [РОЗГОРТАННЯ] Надіслано хотфікс PR, обхід CI до локального пісочного продакшену. Статус підключення: АКТИВНИЙ."
};

for (const [eng, ukr] of Object.entries(replacements)) {
  content = content.replace(eng, ukr);
}

fs.writeFileSync('src/components/DataIngestionTab.tsx', content);
console.log('Translated DataIngestionTab logs');
