# 🦅 PREDATOR Analytics v56.5-ELITE — Канонічне Технічне Завдання

**Версія:** 56.5-ELITE (Sovereign Power Edition)  
**Статус:** ДІЮЧЕ / ОБОВ’ЯЗКОВЕ  
**Мова:** Українська (згідно з HR-03)  
**Цільова аудиторія:** Senior Engineers, Lead Architects, DevOps

---

## 1. Вступ та стратегічні цілі

**Predator** — це суверенна аналітична платформа (Data Intelligence Platform) для виявлення ризиків, аналізу ринків та пошуку прихованих зв'язків. Система перетворює неструктурований хаос даних на точні, математично обґрунтовані **сигнали**.

### 1.1. Ключова цінність
- **Інформаційна перевага**: Здатність бачити приховане через граф зв'язків та AI-інсайти.
- **Машина передбачення**: Прогнозування ринкової поведінки на 1–12 місяців.
- **Економічний радар**: Система раннього попередження про санкційні та операційні ризики.

### 1.2. Принцип MVP (14 днів)
В MVP входить лише те, що дозволяє провести "Killer Demo" та закрити перший платний пілот ($3,000–$5,000).

---

## 2. Архітектура (Sovereign Headless Architecture v3.0)

### 2.1. Гібридна розгортка
- **MacBook (Terminal)**: Виключно IDE та тонкий клієнт. 0 контейнерів (HR-21).
- **iMac / NVIDIA Server (Compute Node)**: 100% інфраструктури та БД (HR-22).

### 2.2. Tri-State Routing & VRAM Guard
- **SOVEREIGN (Red)**: 100% локально (Nemotron MoE, Qwen3-Coder).
- **HYBRID (Green)**: Баланс (Groq/Gemini Flash + Local).
- **CLOUD (Blue)**: Екстремальна швидкість (Gemini Pro, GLM-5.1).
- **VRAM Guard**: Ліміт 5.5 ГБ для локальних моделей. При >7.6 ГБ — автоперехід на Cloud.

### 2.3. Стек 8-ми баз даних
1. **PostgreSQL (SSOT)**: Метадані, транзакції, фінанси.
2. **ClickHouse (OLAP)**: Аналітика великих масивів (100M+).
3. **Neo4j (Graph)**: Детектор зв'язків та фрод-ланцюжків.
4. **OpenSearch (Search)**: Повнотекстовий пошук по документах.
5. **Qdrant (Vector)**: Семантична пам'ять RAG.
6. **Redis (Cache)**: Швидка пам'ять, черги.
7. **MinIO (S3)**: Сховище файлів (скани, PDF).
8. **Kafka (Event Bus)**: Координація асинхронних процесів.

---

## 3. Детальна специфікація модулів (Domain-Driven Architecture)

### 3.1. Модуль Entity Resolution & Normalization ("Мозок")
Відповідає за дедуплікацію та генерацію **UEID** (Universal Economic ID) з точністю F1 > 0.95.

- **Нормалізація**: Очищення назв від ОПФ (ТОВ, ПП, ПРАТ), видалення спецсимволів.
- **Entity Resolution**: Fuzzy matching на основі відстані Jaro-Winkler для назв + точний збіг по ЄДРПОУ/ІПН.

```python
# app/services/entity_resolution.py
from predator_common.entity_resolution import resolve_company

async def process_company(name: str, edrpou: str | None = None) -> str:
    # Ядро алгоритму винесено в predator-common для уніфікації
    result = await resolve_company(name=name, edrpou=edrpou)
    return result.ueid # Повертає існуючий або новий UEID
```

### 3.2. Модуль Risk Engine ("Сканер")
Обчислення CERS Score на основі 5 аналітичних шарів.

- **Behavioral**: Аналіз волатильності транзакцій (BVI).
- **Institutional**: Зв'язки з ПЕП та санкційними списками.
- **Graph Risk**: Передача ризику через ребра графа (ефект "токсичного сусідства").

```python
# app/services/risk_service.py
def calculate_graph_risk(ueid: str, neighbors_scores: list[float]) -> float:
    # Якщо >50% сусідів мають високий ризик, сутність отримує штраф
    high_risk_neighbors = [s for s in neighbors_scores if s > 80]
    if len(high_risk_neighbors) / len(neighbors_scores) > 0.5:
        return 20.0 # Штраф до загального скорингу
    return 0.0
```

### 3.3. Модуль Ingestion Pipeline ("Завод")
Потокова обробка великих масивів даних (Excel/API) через Kafka.

1. **Ingestion**: Прийом файлу -> збереження в MinIO -> публікація події в Kafka.
2. **Worker**: Вичитування чанків по 1000 строк -> Entity Resolution -> Збереження в Postgres & Neo4j.
3. **Idempotency**: Перевірка `event_id` у Redis для уникнення дублікатів.

### 3.4. Модуль Insight Engine ("Аналітик")
Генерація автоматичних висновків (Explainable AI).

- **Hidden Connection**: Виявлення шляху до офшорної зони через 3+ кроки.
- **Import Anomaly**: Стрибок обсягу імпорту на 300% відносно середнього за рік.

```python
# app/services/insight_service.py
async def generate_graph_insight(ueid: str) -> str:
    # Запит до Neo4j для пошуку непрямих зв'язків
    path = await neo4j.find_path_to_offshore(ueid)
    if path:
        return f"Знайдено прихований зв'язок з BVI через {len(path)} вузли."
    return ""
```

---

## 4. Веб-інтерфейс (The 4 Pillars)

### 4.1. Режим "РИНОК" (Market)
- Радар конкурентів у реальному часі.
- Карта торгових потоків (MapLibre GL).
- Тренд-сканер ніш.

### 4.2. Режим "ПРОГНОЗ" (Forecast)
- Прогноз попиту та цін на 12 місяців (XGBoost/Prophet).
- Симулятор сценаріїв "Що-якщо".

### 4.3. Режим "МОЖЛИВОСТІ" (Opportunities)
- Recommendation Engine: "Що / Звідки / Коли імпортувати".
- Аналіз маржинальності товарних груп.

### 4.4. Режим "РИЗИКИ" (Risks)
- Стрічка аномалій.
- Повна перевірка контрагента (Due Diligence).
- Санкційний моніторинг.

---

## 5. План розгортання та Продажі

### 5.1. Roadmap
1. **MVP (1-2 тиждень)**: Базовий CRUD, Пошук, Граф, Risk Score, Excel Ingestion.
2. **Beta (3-8 тиждень)**: Інтеграція OpenSearch/Qdrant, Kafka, AI Copilot (RAG).
3. **Elite (9+ тиждень)**: Автономне вдосконалення (AZR/SIO), розширені графові алгоритми.

### 5.2. Процес продажів
- **Демо (15 хв)**: Показ 3 killer-кейсів (Офшорна петля, Сплячий агент, Спільний дах).
- **Пілот (14 днів)**: Платне тестування на даних клієнта ($3,000).
- **Контракт**: Перехід на річну передплату ($20k–$50k).

---

## 6. Глосарій та Правила (Hard Rules)

- **HR-03**: Тільки українська мова в UI та документації.
- **HR-16**: WORM-таблиці (decision_artifacts). UPDATE/DELETE = ERROR.
- **UEID**: Унікальний ідентифікатор економічного суб'єкта.
- **ACP**: Autonomous Commit Protocol.

---

**Затверджено**: Lead Architect Predator Analytics  
**Дата**: 26.04.2026
