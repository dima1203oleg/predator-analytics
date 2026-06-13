# Повна наскрізна валідація життєвого циклу даних (E2E тестування)

## Goal
Створення реальної, повністю автоматизованої E2E системи тестування на основі розширеного 13-пунктового ТЗ для перевірки імпорту та обробки Excel-реєстрів у PREDATOR Analytics без використання мок-заглушок чи симуляцій. Тести перевірятимуть проходження даних через повний ланцюг: UI -> API -> Kafka -> ETL -> 7 БД -> AI/RAG -> WebSocket -> UI.

## User Review Required
> [!IMPORTANT]
> - Тести відмовостійкості (Chaos Engineering) потребують прав на рестарт контейнерів або сервісів (через Docker/k3s). Чи є на iMac/сервері налаштовані права для тестів керувати інфраструктурою?
> - Playwright-тести вимагатимуть піднятого frontend-сервера (порт 3030) під час виконання.

## Proposed Changes

### E2E Test Suite Implementation
#### [MODIFY] `tests/e2e/utils/db_clients.py`
- Додавання реальних підключень (PostgreSQL, ClickHouse, Neo4j, Qdrant, OpenSearch, Redis, MinIO) за допомогою їхніх офіційних клієнтів (asyncpg, clickhouse-connect, neo4j-driver, qdrant-client, opensearch-py).
- Написання реальних методів підрахунку рядків, вузлів, перевірки векторів.

#### [MODIFY] `tests/e2e/test_ui_dom.py`
- Імплементація Playwright тестів для: drag-and-drop, перевірки індикатора завантаження, зчитування повідомлень про помилки та WebSocket-оновлень таблиці `[data-testid='recent-imports-table']`.

#### [MODIFY] `tests/e2e/test_parser_and_etl.py`
- Перевірка підтримки Unicode, дедуплікації та коректного визначення "порожніх клітинок" і помилкових дат через інтеграцію з реальним парсером `services/ingestion-worker`.

#### [MODIFY] `tests/e2e/test_ingestion_pipeline.py`
- Перевірка наскрізного шляху: збереження файлу в MinIO -> Kafka -> Ingestion Worker -> 7 Баз Даних. 
- Точні ассерти для Neo4j (перевірка графу) та Qdrant (наявність векторів).

#### [MODIFY] `tests/e2e/test_ai_rag_queries.py`
- Написання тестів, які роблять запити до AI модуля і перевіряють, що AI формує пояснення на основі "щойно імпортованих" Excel-даних (пошук за згенерованим `Номер декларації`).

#### [MODIFY] `tests/e2e/test_chaos_resilience.py`
- Тести, які навмисно переривають процес: використання `docker restart` (або `kubectl rollout restart`) для Redpanda/Postgres під час імпорту великого файлу і перевірка, чи відновився процес без дублікатів.

#### [MODIFY] `tests/e2e/test_performance.py`
- Тест на 96 файлів (багатопоточне завантаження). Вимірювання RAM/CPU та часу.

#### [MODIFY] `tests/e2e/test_master_orchestrator.py`
- Генерація фінального звіту (`Audit_Report_Final.md`) за заданими критеріями прийняття (відсоток успішності, час виконання, перевірка 100% рядків).

## Verification Plan
1. Встановлення всіх необхідних клієнтів (Neo4j, ClickHouse, Qdrant, OpenSearch).
2. Запуск Playwright `npx playwright install chromium`.
3. Запуск оркестратора: `python tests/e2e/test_master_orchestrator.py`.
4. Перевірка 100% успішності в генерованому `Audit_Report_Final.md`.
