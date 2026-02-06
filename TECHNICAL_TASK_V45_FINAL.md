📘 ЄДИНЕ, ЗВЕДЕНЕ, РОЗШИРЕНЕ ТА ФОРМАЛІЗОВАНЕ ТЕХНІЧНЕ ЗАВДАННЯ

Predator Analytics v45+

ЖИВІ DATA PIPELINES · DATA CENTER · DATASET STUDIO · KNOWLEDGE GRAPH · SEMANTIC CORE · AZR · COMPONENT ENFORCEMENT · PRODUCTION VERIFICATION · WEB INTERFACE

⸻

GLOBALROOT AUTHORITY

Робота виконується з правами GlobalRoot.
	•	Повний доступ до всіх компонентів, конфігурацій, пайплайнів, середовищ, секретів, логів, метрик, моделей, агентів.
	•	Sandbox / demo / mock / fake режими ЗАБОРОНЕНІ.
	•	ДОЗВОЛЕНО будь-які дії, що ведуть до реального, стабільного production-результату.
	•	ЗАБОРОНЕНО:
	•	спрощувати логіку;
	•	приховувати дефекти;
	•	імітувати процеси через UI без backend-реалізації;
	•	маскувати відсутність реального виконання;
	•	показувати фейкові або статичні індикатори.

⸻

0. БАЗОВІ НЕЗМІННІ ПОЛОЖЕННЯ (CANON)
	•	ЄДИНА версія Python у всій системі: Python 3.12.
Без legacy, без паралельних версій, без винятків.
	•	ПОВНА УКРАЇНІЗАЦІЯ:
	•	увесь веб-інтерфейс;
	•	всі статуси pipeline;
	•	всі повідомлення про помилки;
	•	всі user-facing логи;
	•	всі AI-відповіді та пояснення.
❗ ЖОДНОГО англійського або змішаного тексту у клієнтській частині.
	•	Якщо система містить 200+ компонентів:
	•	жоден не може бути “про запас”;
	•	кожен зобовʼязаний мати фактичну роль у живих процесах.
	•	Аксіоми:
	•	UI ≠ система
	•	деплой ≠ виконання
	•	компонент ≠ задіяність
	•	індикатор ≠ процес

⸻

1. ЗАГАЛЬНА АРХІТЕКТУРНА ПРАВДА
	1.	Кожне джерело даних має ВЛАСНИЙ pipeline, адаптований під:
	•	тип джерела;
	•	формат;
	•	спосіб отримання;
	•	обмеження (rate-limit, auth, size, latency);
	•	бізнес-логіку.
	2.	Універсального pipeline не існує.
	3.	Всі pipeline працюють на СПІЛЬНОМУ PIPELINE ENGINE, який забезпечує:
	•	єдину FSM (state machine);
	•	єдину подієву модель;
	•	єдину observability;
	•	єдину інтеграцію з UI;
	•	виконання незалежно від навігації UI.

⸻

2. ОБОВʼЯЗКОВИЙ СИСТЕМНИЙ СТЕК (ФІКСОВАНО)

raw_storage:        MinIO
facts_storage:      PostgreSQL
relations_storage: Graph DB (Neo4j / ArangoDB)
search_storage:     OpenSearch
semantic_storage:   Qdrant
state_coordination: Redis

backend:
  api:        FastAPI
  jobs:       Celery / Argo Workflows
  parsing:    pandas + custom parsers

frontend:
  framework:  React 18 + TypeScript
  ui:         Ant Design + Tailwind
  state:      React Query + Zustand
  charts:     D3.js / Chart.js
  graphs:     vis-network

observability:
  metrics:    Prometheus
  dashboards: Grafana

❌ Видалення Redis або Graph DB = автоматичний PRODUCTION FAIL

⸻

3. PIPELINE ENGINE — STATE MACHINE (КРИТИЧНО)

3.1 Канонічна FSM

CREATED
→ SOURCE_CHECKED
→ INGESTED
→ PARSED
→ VALIDATED
→ TRANSFORMED
→ ENTITY_RESOLVED
→ STORED
→ GRAPH_BUILT
→ INDEXED
→ VECTORIZED
→ READY
→ FAILED

	•	retry контрольований;
	•	re-run окремих стадій дозволений;
	•	паралельні стадії дозволені;
	•	FAILED зобовʼязаний містити причину.

3.2 Redis — ЄДИНЕ ДЖЕРЕЛО ПРАВДИ ДЛЯ UI

{
  "source_id": "uuid",
  "stage": "PARSING",
  "overall_progress": 41,
  "stage_progress": {
    "PARSING": 41
  },
  "eta": "3m 10s",
  "errors": []
}

❌ UI НЕ читає статуси з PostgreSQL
✅ UI читає ВИКЛЮЧНО Redis

⸻

4. DATA CENTER — КОНТУР ПЕРЕВІРКИ ДЖЕРЕЛ

Мінімально підтримувані джерела
	•	Excel / CSV
	•	JSON / API
	•	PDF
	•	Telegram
	•	Web-сайти
	•	Images / Audio / Video

❗ Джерело без pipeline = КРИТИЧНИЙ PRODUCTION-ДЕФЕКТ

⸻

5. КАНОНІЧНІ PIPELINE ЗА ТИПАМИ ДЖЕРЕЛ

5.1 Excel / CSV (у т.ч. Березень_2024.xlsx)

Upload
→ Validation
→ Parsing
→ Data Quality
→ Transform
→ MinIO
→ PostgreSQL
→ Graph DB
→ OpenSearch
→ Qdrant

	•	прогрес по рядках;
	•	прогрес по колонках;
	•	live-статуси в UI.

5.2 Telegram

Init
→ Resolve Channel
→ Fetch
→ Parse
→ Store (raw + structured)
→ Monitor

5.3 Web

Crawl
→ Extract
→ Clean
→ Normalize
→ Index


⸻

6. КОНКРЕТНЕ ТЗ ДЛЯ Березень_2024.xlsx

6.1 Роль
	•	Тип: митні декларації
	•	Період: березень 2024
	•	Формат: Excel (immutable)

6.2 Розкладка
	•	MinIO — оригінал
	•	PostgreSQL:
	•	declarations
	•	companies
	•	products
	•	countries
	•	Graph DB:
	•	Company → Declaration → Product → HSCode → Country → Source
	•	OpenSearch — декларації + товари
	•	Qdrant — embeddings описів
	•	Redis — FSM + %

⸻

7. DATA QUALITY ENGINE
	•	обовʼязкові поля;
	•	формат дат;
	•	HS-код (6–10 цифр);
	•	суми > 0;
	•	дублікати → warning.

DQ-результат:
	•	зберігається;
	•	відображається в UI;
	•	впливає на confidence.

⸻

8. ENTITY RESOLUTION
	•	exact / normalized / fuzzy;
	•	confidence ≥ 0.85 → auto-merge;
	•	< 0.85 → NEEDS_REVIEW (через UI).

⸻

9. GRAPH DB — СТРОГИЙ КОНТРАКТ

Вузли
	•	Company
	•	Declaration
	•	Product
	•	HSCode
	•	Country
	•	Source

Звʼязки
	•	FILED
	•	CONTAINS
	•	HAS_HS
	•	FROM_COUNTRY
	•	ORIGIN

❌ Факти не дублюються у графі

⸻

10. OPENSEARCH + QDRANT
	•	OpenSearch — фільтрація, агрегації, швидкий пошук;
	•	Qdrant — семантичний пошук, LLM-контекст;
	•	модель embeddings ЯВНО задекларована.

⸻

11. EXPLAINABILITY (ЖОРСТКА ВИМОГА)

Кожен UI-запит повертає:

{
  "results": [...],
  "why": [
    "Одна компанія",
    "Однаковий HS-код",
    "Березень 2024"
  ],
  "databases_used": [
    "PostgreSQL",
    "Graph DB",
    "OpenSearch",
    "Qdrant"
  ]
}

❌ Результат без пояснення = FAIL

⸻

12. DATASET STUDIO
	•	окремий pipeline для кожного датасету;
	•	формати: Excel, CSV, JSON, Parquet, Notebook;
	•	датасет ≠ лише training;
	•	датасет = активне джерело.

⸻

13. GLOBAL OBSERVABILITY
	•	pipeline живий незалежно від UI;
	•	Global Process Indicator;
	•	відображення:
	•	стадій;
	•	підстадій;
	•	причин очікування.

⸻

14. COMPONENT ENFORCEMENT MODULE

{
  "component_id": "neo4j",
  "declared": true,
  "deployed": true,
  "used": true,
  "used_in": ["excel_pipeline"],
  "health": {
    "metrics": true,
    "logs": true,
    "traces": true
  }
}

used = false → компонент вважається ВІДСУТНІМ

⸻

15. WEB INTERFACE — ФРОНТЕНД (ІНТЕГРОВАНО)

Ролі
	•	Client
	•	Premium Client
	•	Admin (окремий інтерфейс)

Принципи
	•	UI ніколи не вирішує права;
	•	UI лише відображає реальні процеси;
	•	жодного “показу для вигляду”.

Sidebar (UA)
	•	Огляд
	•	Ранкова газета
	•	Тренди
	•	Пошук
	•	Аналітика (Premium)
	•	Дашборди (Premium)
	•	Налаштування
	•	Адміністрування (Admin)

UI-обовʼязки
	•	FSM + %
	•	live-прогрес;
	•	explainability;
	•	device switch (desktop / mobile / tablet);
	•	повна i18n.

⸻

16. AZR — АВТОНОМНЕ ВДОСКОНАЛЕННЯ
	•	CLI + backend агенти;
	•	автоаналіз логів;
	•	автофікси;
	•	автооптимізація UI;
	•	робота 24/7 без UI-залежності.

⸻

17. INFINITE PRODUCTION VERIFICATION RULE

Система НЕ МОЖЕ бути прийнята, доки:
	•	всі джерела мають pipeline;
	•	всі pipeline реально працюють;
	•	всі компоненти реально задіяні;
	•	observability повна;
	•	дані реально рухаються між БД.

Перевірка → виправлення → перевірка
Без обмеження кількості ітерацій.

⸻

18. УМОВИ ПРИЙМАННЯ

Система приймається ТІЛЬКИ якщо:
	•	Березень_2024.xlsx:
	•	пропарсений;
	•	проіндексований;
	•	векторизований;
	•	присутній у всіх БД;
	•	pipeline живий;
	•	UI показує реальний FSM + %;
	•	Graph DB має реальні звʼязки;
	•	контрольний запит працює;
	•	explainability присутня.

⸻

ФІНАЛЬНИЙ ПРИНЦИП

Дані без процесу — мертві.
Процес без доказів — брехня.
Докази без пояснення — магія.
