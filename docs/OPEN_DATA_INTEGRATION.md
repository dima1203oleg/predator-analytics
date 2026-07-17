# Open Data & Registries Integration (v57.0-FACTORY)

Цей документ описує архітектуру та реалізацію підсистеми збору, обробки та аналізу відкритих даних України в рамках платформи PREDATOR Analytics.

## 1. Загальна Архітектура (The Data Engine)

Підсистема працює за моделлю **Harvester Pattern + Event-Driven Architecture**.

### 1.1. Ingestion Worker (Harvesters)
Знаходиться в `services/ingestion-worker/app/harvesters/`.
Відповідає за безпечне, стійке та ввічливе (polite) витягування даних з державних реєстрів:

*   **`ckan_harvester.py`**: Інтеграція з порталом `data.gov.ua` через CKAN API. Підтримує rate-limiting (до 5 RPS) та відстежує зміни метаданих наборів.
*   **`prozorro_sync.py`**: Інтеграція з `Prozorro OCDS / API`. Використовує механізм "watermark-based pagination" через `offset` для інкрементальної синхронізації змін без перевантаження API.
*   **`edr_aggregator.py`**: Агрегатор даних про компанії та кінцевих бенефіціарів (ЄДР). Відповідає за нормалізацію імен, розбір ієрархій засновників та формування Ownership Graph.

### 1.2. Core API (Routers)
Знаходиться в `services/core-api/app/routers/`.
Надає інтерфейс для UI та інших AI-агентів.

*   **`open_data.py`**: Управління статусом Ingestion Worker (CKAN, Prozorro), пошук тендерів та перевірка каталогів.
*   **`ownership_graph.py`**: Доступ до графа власності (Neo4j), ризиків та зв'язків з публічними закупівлями.

### 1.3. UI (Sovereign Command Center)
Знаходиться в `apps/predator-analytics-ui/src/pages/OpenDataHubPage.tsx`.
Надає єдину панель управління `Open Data Intelligence Hub`. Включає пошук, перегляд графа власності та контроль стану Ingestion процесів.

## 2. Механізми Стійкості (Resilience)

*   **Smart Rate Limiting**: Харвестери мають динамічне обмеження швидкості запитів. Якщо сервер повертає 429 (Too Many Requests), харвестер автоматично збільшує затримку.
*   **User-Agent Stealthing**: Кожен запит містить детальний User-Agent, що ідентифікує систему (напр., `PredatorAnalytics-Harvester/1.0`), відповідно до етикету парсингу державних реєстрів.
*   **Incremental Sync (Watermarks)**: Для Prozorro використовується `offset`. Система ніколи не витягує всі дані з нуля, якщо це не примусовий рестарт.

## 3. Моделювання Даних

*   **PostgreSQL**: Зберігає статус інгестії (watermarks, offset_id, timestamp останнього оновлення), конфігурації харвестерів.
*   **ClickHouse**: Зберігає денормалізовані тендери Prozorro для швидкої агрегації (OLAP).
*   **Neo4j**: Зберігає `Ownership Graph`. Вузли: `(Company)`, `(Person)`, `(GovernmentEntity)`. Зв'язки: `[OWNS]`, `[MANAGES]`, `[REPRESENTS_IN_TENDERS]`.

## 4. Запуск та Налагодження

```bash
# 1. Запуск Ingestion Worker (в режимі standalone для тестів)
python services/ingestion-worker/app/main.py

# 2. Перевірка статусу через API
curl http://localhost:8000/api/v1/open-data/status

# 3. Доступ до UI
# Відкрийте http://localhost:3030/admin/open-data
```
