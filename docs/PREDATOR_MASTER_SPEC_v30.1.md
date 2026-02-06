- **Legal Safety**: The system NEVER accuses; it only hypothesizes based on data.
- **Data Sovereignty**: Training happens ONLY with explicit user consent per dataset.

## ⚠️ CRITICAL SAFETY & LEGAL GUARDRAILS (THE "CONSTITUTION")

### 1. Linguistic Safety (Anti-Libel Protocol)
To differntiate analytical insight from legal accusation, the system MUST strictly adhere to this vocabulary:
- **FORBIDDEN:** "Person X committed a crime", "The company is laundering money", "Fraud detected".
- **REQUIRED:** "Indicators of potential irregularity found", "High risk score detected (98%)", "Analytical hypothesis suggests linkage", "Anomaly in transaction pattern".
*Rationale: The tool empowers the user to judge, it does not issue verdicts.*

### 2. Training Data Safety (No Ghost Learning)
- **Rule:** Data ingested into the system is **NEVER** used for model training or fine-tuning by default.
- **Activation:** Training pipelines run **ONLY** when a user explicitly toggles `is_training_source=True` for a specific dataset.
- **Transparency:** Before training starts, the system MUST show a manifesto of exactly which data will be absorbed.

### 3. AZR (Autonomous Zone) Boundaries
- **Permitted:** AZR may optimize code, fix bugs, scale infrastructure, and improve UI performance.
- **FORBIDDEN:** AZR **CANNOT** alter the business logic of:
    - Risk Scoring algorithms.
    - Analytical conclusions or weightings.
    - The "Linguistic Safety" protocols.
*Rationale: The brain of the business belongs to the human; the muscle belongs to the machine.*
# 🦅 PREDATOR ANALYTICS v30.1+
# РОЗШИРЕНЕ ЗАГАЛЬНЕ ТЕХНІЧНЕ ЗАВДАННЯ (PRODUCTION MASTER SPEC)

## 1. КОНТЕКСТ І ПІДХІД (ВАЖЛИВО ПРОЧИТАТИ)

Predator Analytics — це не сайт і не BI-дашборд.
Це AI-native аналітична платформа, яка:
- працює з реальними даними (митниця, реєстри, медіа, Telegram, PDF, Excel)
- генерує інсайти, ризики, прогнози
- повинна бути юридично захищеною
- повинна масштабуватись і жити роками
- повинна заробляти гроші, а не просто бути «крутою»

Тому ТЗ ділиться на:
1. Архітектуру
2. Реалізацію в коді (VS Code)
3. Runtime-логіку
4. Бізнес-рівень
5. Обмеження та заборони

---

## 2. СТРУКТУРА ПРОЄКТУ У VS CODE (ОБОВʼЯЗКОВО)

### 2.1. Загальна структура репозиторію

```text
PredatorAnalytics/
├── apps/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── api/                # FastAPI routers
│   │   │   ├── core/               # config, security, guards
│   │   │   ├── services/           # business logic
│   │   │   ├── pipelines/          # ingestion, RAG, AI flows
│   │   │   ├── ai/                 # LLM, RAG, explainability
│   │   │   ├── provenance/         # data lineage & explanations
│   │   │   ├── metrics/            # business + technical metrics
│   │   │   ├── azr/                # autonomous refinement
│   │   │   └── models/             # Pydantic / ORM
│   │   ├── tests/
│   │   └── main.py
│   │
│   ├── frontend/
│   │   ├── app/                    # Next.js App Router
│   │   ├── components/
│   │   ├── views/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── lib/
│   │
├── helm/
├── infra/
├── docs/
└── scripts/
```

❗ Antigravity повинен працювати тільки в межах цієї структури.
❌ Заборонено створювати хаотичні файли поза нею.

---

## 3. BACKEND: ФУНКЦІОНАЛЬНЕ ТЗ

### 3.1. API-рівень (FastAPI)

Кожен сервіс:
- має окремий router
- має /health
- має /metrics
- має строгі Pydantic-схеми
- не містить бізнес-логіки напряму

Обовʼязкові API-групи:
- /auth
- /search
- /analytics
- /ingestion
- /datasets
- /ai
- /risk
- /anomaly
- /reports
- /admin
- /azr

### 3.2. Ingestion Pipeline (КРИТИЧНО)

Обовʼязково:
- chunked upload (Excel до 300MB+)
- resumable uploads
- детальний статус:
  - uploaded
  - parsing
  - embedding
  - indexing
  - ready / failed

```yaml
ingestion_requirements:
  idempotent: true
  retryable: true
  observable: true
  explainable: true
```

❗ Користувач ЗАВЖДИ бачить % виконання.

---

## 4. AI / RAG / LLM — НЕ МАГІЯ, А ІНЖЕНЕРІЯ

### 4.1. RAG Pipeline (строго)
1. Retriever (OpenSearch + Qdrant)
2. Reranker
3. Context Builder
4. LLM Call
5. Explanation Generator
6. Confidence Scoring

❌ Заборонено:
- відповідати без джерел
- відповідати без confidence score

### 4.2. Data Provenance & Explainability (ОБОВʼЯЗКОВО)

Кожен AI-результат має:

```yaml
ai_result:
  answer: string
  sources: [id, type, confidence]
  explanation: text
  confidence_score: 0.0 - 1.0
  generated_at: timestamp
```

Це:
- юридичний захист
- довіра клієнта
- конкурентна перевага

---

## 5. FRONTEND: НЕ ПРОСТО UI, А ПРОДУКТ

### 5.1. Обовʼязкові розділи
- Dashboard (бізнес + технічні KPI)
- Search Console
- Datasets
- Ingestion Monitor
- Analytics
- Graph View
- AI Assistant
- Risk & Alerts
- Reports
- Admin

❗ ЖОДЕН пункт меню не може бути “порожнім”.

### 5.2. UX-вимоги
- Skeleton loading
- Streaming results (AI відповіді)
- Tooltips з поясненнями
- Confidence indicators
- Export (PDF / CSV)

---

## 6. BUSINESS LAYER — ТЕ, ЗА ЩО ПЛАТЯТЬ

### 6.1. Premium / Enterprise

```yaml
premium_features:
  - forecasts
  - competitor graphs
  - early alerts
  - advanced filters

enterprise_features:
  - private datasets
  - explainable reports
  - audit trails
  - white-label UI
```

### 6.2. Бізнес-метрики (обовʼязково)

Збирати і показувати власнику:
- активність клієнтів
- кількість інсайтів
- retention
- value per customer

---

## 7. AZR — АВТОНОМІЯ БЕЗ БЕЗУМСТВА

AZR:
- НЕ має права:
  - видаляти дані
  - міняти схеми БД
  - ламати API
- МАЄ право:
  - покращувати код
  - додавати тести
  - оптимізувати запити
  - пропонувати зміни

Manual gate для продакшну — обовʼязковий.

---

## 8. ЗАБОРОНИ (ДУЖЕ ВАЖЛИВО)

❌ Заборонено:
- “TODO” в продакшні
- “поки без цього”
- фейкові health-check
- заглушки без статусу
- AI-відповіді без джерел

---

## 9. КРИТЕРІЇ ГОТОВНОСТІ (ФІНАЛ)

Система НЕ ВВАЖАЄТЬСЯ ГОТОВОЮ, якщо:
- є хоча б 1 HTTP 500
- ingestion без прогресу
- AI без explanation
- UI з порожніми сторінками
- немає бізнес-метрик

---

## 10. ПІДСУМОК

Це ТЗ:
- не абстрактне
- не фантазія
- не “на майбутнє”

Це бойовий контракт:
- для Antigravity
- для команди
- для бізнесу
