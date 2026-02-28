# PREDATOR ANALYTICS v55.0 — СХЕМА ВПРОВАДЖЕННЯ

**Дата:** 2026-03-02 | **Оновлено:** 2026-03-02 | **Поточна фаза:** 1 (Фундамент)  
**Базова версія:** v45.6 | **Цільова:** v55.0-community  
**Сервер:** 194.177.1.240 (64GB/20vCPU/GTX1080) | **Mac:** тонкий клієнт  
**Python:** 3.12 ONLY | **UI мова:** українська | **Код мова:** англійська

> **Канонічне ТЗ:** [`V55_TECHNICAL_SPECIFICATION.md`](./V55_TECHNICAL_SPECIFICATION.md) — повна специфікація 238 компонентів, архітектури, формул, SLO, безпеки та заборон. Є єдиним джерелом істини.

---

## 1. АУДИТ ПОТОЧНОГО СТАНУ (AS-IS)

### 1.1. Що є і працює

| Компонент | Стан | Рішення v55 |
|-----------|------|-------------|
| FastAPI (`app/main.py`) | ✅ v45 | **ЗБЕРІГАЄМО**, рефакторимо |
| 43 роутери (`app/routers/` + `app/api/routers/`) | ✅ | **ЗБЕРІГАЄМО** |
| 90+ сервісів (`app/services/`) | ✅ | **ЗБЕРІГАЄМО**, структуруємо |
| 60+ core libs (`app/libs/core/`) | ✅ | **ЗБЕРІГАЄМО** |
| PostgreSQL (TimescaleDB PG15) | ✅ | **ЗБЕРІГАЄМО** |
| Redis 7 | ✅ | **ЗБЕРІГАЄМО** |
| Neo4j 5.16 | ✅ | **ЗБЕРІГАЄМО**, розширюємо |
| Qdrant | ✅ | **ЗБЕРІГАЄМО** |
| OpenSearch 2.17 | ✅ | **ЗБЕРІГАЄМО** |
| MinIO | ✅ | **ЗБЕРІГАЄМО** |
| Ollama | ✅ | **ЗБЕРІГАЄМО** |
| Redpanda (Kafka-compatible) | ✅ | **ЗБЕРІГАЄМО** як Signal Bus |
| Celery + RabbitMQ | ✅ | **ЗБЕРІГАЄМО** для фонових задач |
| React+Vite UI (100+ компонентів) | ⚠️ mock-дані | **ЗБЕРІГАЄМО**, фіксимо |
| MCP Router, RTB Engine, SIO | ⚠️ базовий | **ЗБЕРІГАЄМО**, розширюємо |
| Helm чарти, K8s маніфести | ✅ | **ЗБЕРІГАЄМО**, розширюємо |
| Prometheus + Grafana | ✅ | **ЗБЕРІГАЄМО** |

### 1.2. Критичні проблеми

1. **3 entrypoints:** `app/main.py` vs `services/api/main.py` vs `apps/backend/`
2. **Дублікати в docker-compose.yml:** neo4j×2, backend×2, celery×2, 2 мережі
3. **Hardcoded secrets:** `666666`, `predator_secret_key` в docker-compose
4. ~~**Версійний хаос:** title=v45.0, version=30.0.0~~ → ✅ Виправлено: v55.0.0 скрізь
5. **Фронтенд:** зламаний login, mock-дані, API mismatch
6. **Немає:** Vault, Keycloak, ArgoCD, Kyverno, Falco

---

## 2. GAP-АНАЛІЗ

### 🔴 Критично відсутні (блокують v55)

- UEID System (Entity Resolution)
- Data Fusion Engine
- Behavioral Engine (BVI, ASS, CP)
- Institutional Engine (AAI, PLS)
- Influence Engine (IM, HCI)
- Structural Gaps Engine (MCI, PFI)
- Predictive Engine (XGBoost, CatBoost, Monte Carlo)
- CERS Meta-Scoring Layer
- Decision Artifacts (WORM ledger)
- Confidence Score System
- Signal Bus (Kafka topics)

### 🟡 Важливі (production)

- Keycloak (IAM), Vault (secrets), ArgoCD (GitOps)
- MLflow (Model Registry), Feast (Feature Store)
- Whisper STT, TTS "Артем", OCR
- Cytoscape.js, ECharts/Plotly.js
- Loki, Tempo, Kyverno, Falco

### Що видаляємо

| Видаляємо | На що | Причина |
|-----------|-------|---------|
| chromadb | Qdrant (вже є) | Дублювання |
| openai SDK | Ollama через MCP | $0 бюджет |
| Hardcoded secrets | Vault + .env | Безпека |
| `services/api/main.py` | `app/main.py` | Дублювання |

> **Next.js:** ТЗ вимагає, але міграція 100+ компонентів з Vite зламає все. **Рішення: залишити React+Vite**, подати RFC.

---

## 3. ПРИНЦИПИ МІГРАЦІЇ (НЕ ЗЛАМАТИ)

### Strangler Fig Pattern

```
Новий код     → app/engines/        (паралельно до app/services/)
Нові роутери  → app/api/v2/         (паралельно до app/api/routers/)
Нові моделі   → app/models/v55/     (розширюють існуючі)
Feature flags → для перемикання v1↔v2
```

### Залізні правила

1. НЕ видаляти існуючі роутери без заміни
2. НЕ змінювати API контракти v1 (тільки додавати v2)
3. НЕ видаляти Pydantic моделі (тільки розширювати)
4. НЕ змінювати БД без Alembic міграцій
5. НЕ ламати docker-compose (тільки адитивно)
6. НЕ деплоїти без тестів на staging

---

## 4. ЦІЛЬОВА СТРУКТУРА v55

```
app/
├── main.py                    # Єдиний entrypoint (v55)
├── core/                      # ЗБЕРЕЖЕНО + розширено
│   ├── ueid.py                # 🆕 UEID генератор
│   ├── confidence.py          # 🆕 Confidence Score
│   ├── signal_bus.py          # 🆕 Kafka абстракція
│   └── i18n.py                # 🆕 Українізація бекенду
├── engines/                   # 🆕 АНАЛІТИЧНІ ДВИГУНИ
│   ├── data_fusion.py         # Data Fusion Engine
│   ├── entity_graph.py        # Entity Graph Engine
│   ├── behavioral.py          # BVI, ASS, CP
│   ├── institutional.py       # AAI, PLS
│   ├── influence.py           # IM, HCI
│   ├── structural_gaps.py     # MCI, PFI
│   ├── predictive.py          # XGBoost, CatBoost, MC
│   └── cers.py                # CERS Meta-Scoring
├── indices/                   # 🆕 МАТЕМАТИЧНІ ФОРМУЛИ
│   ├── bvi.py, ass.py, cp.py
│   ├── aai.py, pls.py
│   ├── im.py, hci.py
│   └── mci.py, pfi.py
├── datasets/                  # 🆕 200 ДАТАСЕТІВ
│   ├── behavioral/            # 101-120
│   ├── institutional/         # 121-140
│   ├── influence/             # 141-160
│   ├── structural/            # 161-180
│   └── predictive/            # 181-200
├── api/v2/                    # 🆕 V2 РОУТЕРИ
│   ├── entities.py, signals.py, analytics.py
│   ├── ingestion.py, reports.py, search.py
│   └── chat.py
├── models/v55/                # 🆕 МОДЕЛІ v55
│   ├── ueid.py, signal.py, cers.py
│   └── decision_artifact.py
├── services/                  # ЗБЕРЕЖЕНО (90+ файлів)
├── routers/                   # ЗБЕРЕЖЕНО (v1)
├── api/routers/               # ЗБЕРЕЖЕНО (v1)
└── libs/core/                 # ЗБЕРЕЖЕНО (60+ модулів)
```

---

## 5. ДОРОЖНЯ КАРТА: 4 ФАЗИ

Повний опис у окремих файлах (частини 2-4).

### ФАЗА 0: Стабілізація ✅ ЗАВЕРШЕНО

Усі задачі виконані. Детальний звіт: `V55_PHASE_TASKS.md` → Фаза 0.

### ФАЗА 1: Фундамент (місяці 1-3)

| ID | Завдання | Деталі |
|----|----------|--------|
| F1-001 | UEID System | Entity Resolution, fuzzy matching, ЄДРПОУ |
| F1-002 | Data Fusion Engine | Нормалізація митних/податкових/ЄДР даних |
| F1-003 | Behavioral Engine | BVI, ASS, CP (формули з ТЗ 6.1-6.3) |
| F1-004 | Базова інгестія v55 | Excel/CSV/PDF → validate → parse → embed → index |
| F1-005 | Decision Artifacts | WORM таблиця, trigger заборона UPDATE/DELETE |
| F1-006 | Confidence Score | Формула з ТЗ 3.14 для кожного сигналу |
| F1-007 | Kafka Signal Bus | Topics через Redpanda, DLQ |
| F1-008 | SSE прогрес інгестії | GET /api/v2/ingestion/progress/{job_id} |
| F1-009 | Competitor Radar UI | Перший v55 екран, українською |
| F1-010 | Алембік міграції | ueid, decision_artifacts, signals, scores |

**Checkpoint:** UEID працює, BVI/ASS/CP обчислюються, Excel інгестія працює, /api/v1 НЕ зламаний.

---

### ФАЗА 2: Розширення (місяці 4-6)

| ID | Завдання | Деталі |
|----|----------|--------|
| F2-001 | Institutional Engine | AAI, PLS, RDI, RSI (формули з ТЗ 6.4-6.5) |
| F2-002 | Influence Engine | IM, HCI, Shadow Clusters (формули з ТЗ 6.6-6.7) |
| F2-003 | Entity Graph (повний) | Neo4j: 8 типів вузлів, 6 типів ребер, Louvain |
| F2-004 | CERS (3 шари) | Behavioral+Institutional+Influence, Z-score, PCA |
| F2-005 | Keycloak + Vault | IAM, OIDC, MFA, secrets management |
| F2-006 | RAG Chat через MCP | Ollama + Qdrant + стрімінг SSE |
| F2-007 | Граф зв'язків UI | Cytoscape.js візуалізація |
| F2-008 | Dataset Manager UI | CRUD для датасетів 101-160 |

**Checkpoint:** 3 аналітичні шари, CERS(3), граф працює, Keycloak auth, RAG chat.

---

### ФАЗА 3: Прогностика (місяці 7-9)

| ID | Завдання | Деталі |
|----|----------|--------|
| F3-001 | Structural Gaps Engine | MCI, PFI, TDI, LGS (формули з ТЗ 6.8-6.9) |
| F3-002 | Predictive Engine | Online: LogReg, LightGBM; Offline: XGBoost, CatBoost, MC |
| F3-003 | CERS (повний, 5 шарів) | 0.25B+0.20I+0.20Inf+0.15S+0.20P, декорреляція |
| F3-004 | MLflow + Feast | Model Registry + Feature Store |
| F3-005 | TTS "Артем" | Coqui/Piper TTS українською |
| F3-006 | Whisper STT | Транскрипція українського аудіо |
| F3-007 | Graph snapshots | Daily 03:00 → MinIO, approximate centrality |
| F3-008 | SHAP пояснення | Для кожного сигналу та CERS компонента |

**Checkpoint:** 5 шарів, повний CERS, прогнози, TTS/STT, p95 < 3с.

---

### ФАЗА 4: Екосистема (місяці 10-12)

| ID | Завдання | Деталі |
|----|----------|--------|
| F4-001 | ArgoCD GitOps | Automated sync, rollback policy |
| F4-002 | Kyverno + Falco | Policy enforcement, runtime security |
| F4-003 | Повний моніторинг | Loki, Tempo, AlertManager, SLO dashboard |
| F4-004 | Public API + SDK | OpenAPI 3.1 docs, Python SDK, rate limiting |
| F4-005 | Документація | MkDocs українською, user guides |
| F4-006 | Ethical Audit | Quarterly audit framework, whistleblower channel |

**Checkpoint:** GitOps, Zero Trust, повна документація, production-ready.

---

## 6. УКРАЇНІЗАЦІЯ

### Правила

1. **UI/UX:** УКРАЇНСЬКА (primary), English (secondary)
2. **Код:** АНГЛІЙСЬКА (змінні, функції, класи)
3. **API labels:** УКРАЇНСЬКА, API fields: АНГЛІЙСЬКА
4. **Документація:** УКРАЇНСЬКА
5. **Логи:** АНГЛІЙСЬКА
6. **ЗАБОРОНЕНО:** російська мова

### Файли локалізації

```
apps/predator-analytics-ui/src/locales/uk/
├── common.json       # Пошук, Фільтр, Зберегти...
├── navigation.json   # Дашборд, Граф зв'язків, Аналітика...
├── analytics.json    # BVI, CERS, рівні ризику...
├── ingestion.json    # Завантаження, Обробка, Помилка...
├── entities.json     # Компанія, Особа, Брокер, ЄДРПОУ...
├── signals.json      # Попередження, Критично, Стабільний...
└── errors.json       # Помилка з'єднання, Файл занадто великий...
```

### Бекенд i18n

**Реалізовано:** `app/core/i18n.py` — CERS рівні, типи сигналів, типи суб'єктів, індекси, помилки, аналітичні шари. Функція `t(key, lang, category)` для перекладу.

---

## 7. РИЗИКИ

| Ризик | Мітигація |
|-------|-----------|
| Нестача RAM (50Gi на 38 подів) | QoS classes, GPU degradation policy |
| Порушення /api/v1 | Strangler Fig, v1/v2 паралельно, feature flags |
| GPU contention (GTX 1080) | Time slicing 4×2GB, priority queue |
| Дефіцит даних для ML | Синтетичні дані, поступовий збір |
| Neo4j OOM | Snapshots, approximate centrality, pagecache tuning |

---

## 8. РОЗПОДІЛ: MAC vs СЕРВЕР

| Mac (тонкий клієнт) | Сервер 194.177.1.240 |
|---------------------|---------------------|
| VS Code + Remote SSH | Docker, K8s, всі поди |
| Браузер (фронтенд) | Backend, DB, AI/ML |
| Git operations | CI/CD, ArgoCD |
| Фронтенд dev (Vite HMR) → sync | Build & deploy |

**Фронтенд синхронізація:** rsync або git push → argocd sync.

---

*Документ є єдиним планом впровадження ТЗ v55.0 у поточну кодову базу.*  
*Поточний крок: Фаза 1 — DB persistence для UEID, engines, Signal Bus.*  
*Детальні задачі: `V55_PHASE_TASKS.md`*
