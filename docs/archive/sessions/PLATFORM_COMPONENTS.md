# Розділ ТЗ: Компоненти Платформи Predator Analytics v45.0

Цей документ визначає затверджену архітектуру, матрицю компонентів та план релізів платформи.

---

## 1. Матриця Компонентів Платформи

### A. Core Services (Ключові функціональні сервіси)
| Компонент | Внутрішня назва Predator | Технологічний стек | Роль у системі | Основні метрики / SLO |
|-----------|--------------------------|--------------------|----------------|-----------------------|
| **Frontend (Web UI)** | `predator-frontend` | React + TS + Vite + TailwindCSS | Єдина точка входу користувача. Пошук, візуалізація графів, дашборди. | TTI < 2.5s, Error Rate < 0.1% |
| **Backend API** | `predator-backend` | FastAPI (Python 3.11) | REST API, оркестрація агентів, бізнес-логіка, Auth. | p95 Response < 500ms |
| **Auth Service** | `auth-module` | JWT + OAuth2 (Internal) | Реєстрація, приватності, RBAC (User/Admin). | Login p95 < 300ms |
| **Ingest Parser** | `agent-sherlock` | Python + Celery + httpx | Збір даних з Prozorro/NBU/EDR. | Throughput (docs/min) |
| **Data Processor** | `agent-watson` | Python + Pandas | Очищення, PII-masking, нормалізація даних. | Processing Lag < 5min |
| **Indexing Agent** | `agent-moriarty` | Python + AsyncOpenSearch | Індексація в OpenSearch та Qdrant. | Indexing time < 2s/doc |

### B. Data & Search Layer (Сховища та Пошук)
| Компонент | Технологія | Призначення | Схеми / Колекції |
|-----------|------------|-------------|------------------|
| **Primary DB** | **PostgreSQL 15** | "Джерело правди", реляційні дані, логи. | `staging` (raw), `gold` (clean), `public` (auth) |
| **Full-Text Search** | **OpenSearch 2.11** | Пошук за ключовими словами, фасети, агрегації. | `predator-documents`, `audit-logs` |
| **Vector Search** | **Qdrant 1.7** | Семантичний пошук, RAG контекст. | `predator-vectors` (384/768 dim) |
| **Process Queue** | **Redis 7** | Брокер для Celery, кешування сесій. | `celery-events`, `cache` |
| **Object Storage** | **MinIO** | Зберігання великих файлів (PDF, dumps). | `raw-data`, `exports` |

### C. Platform Infrastructure (Інфраструктура)
| Компонент | Інструмент | Опис |
|-----------|------------|------|
| **Containerization** | Docker | Стандарт пакування всіх сервісів. |
| **Orchestration** | Kubernetes (K3s) | Управління контейнерами (Prod/Staging). |
| **Deployment** | ArgoCD | GitOps контролер. Sync state from Git. |
| **Templating** | Helm Charts | "Umbrella" chart для управління всім стеком. |
| **CI/CD** | GitHub Actions | Build, Test, Push to GHCR, Trigger ArgoCD. |
| **Gateway** | Nginx / Traefik | Ingress controller, TLS termination. |

### D. Observability & AI (Додатково)
| Компонент | Стек | Роль |
|-----------|------|------|
| **Monitoring** | Prometheus + Grafana | Збір метрик (RPS, Latency, CPU/RAM). |
| **Logging** | PLG Stack (Promtail+Loki) | Централізований збір логів (ефективніше EFK). |
| **LLM Engine** | Ollama / OpenAI API | Аналіз ризиків, генерація звітів. |
| **Embeddings** | SentenceBERT (Local) | Перетворення тексту на вектори для Qdrant. |

---

## 2. Матриця Релізів (MVP Roadmap)

### Реліз 0.1 — Search Core (✅ Completed)
**Ціль**: Базовий пошук та завантаження даних.
- [x] **Frontend**: Пошуковий рядок, перегляд JSON результатів.
- [x] **Backend**: API `/search`, `/documents`.
- [x] **DB**: Postgres, OpenSearch, Qdrant підняті в Docker.
- [x] **Ingest**: Базовий парсер (Prozorro, NBU).

### Реліз 0.2 — Hybrid Intelligence (🚧 In Progress)
**Ціль**: Комерційно придатний мінімум з Auth та AI.
- [x] **Auth**: JWT, Login/Register.
- [x] **Advanced Search**: Гібридний пошук (Vector + Keyword).
- [ ] **AI Analysis**: Генерація звітів по компаніях (LLM).
- [ ] **Dashboard**: Графіки статистики в UI.
- [ ] **Monitoring**: Базовий Prometheus/Grafana.

### Реліз 1.0 — Production Ready (Planned)
**Ціль**: Хмарний деплой та стабільність.
- [ ] **K3s Cluster**: Повноцінне середовище.
- [ ] **GitOps**: ArgoCD пайплайни.
- [ ] **Security**: TLS, Rate Limiting, Audit logs.
- [ ] **Billing**: Модуль підписок.

---

## 3. Deployment & Automation Standards

### Структура Helm Umbrella
```text
infra/helm/umbrella/
├── Chart.yaml          # Головний чарт
├── values.yaml         # Дефолтні налаштування
├── values-prod.yaml    # Продакшн оверрайди
└── charts/             # Під-чарти (Subcharts)
    ├── backend/
    ├── frontend/
    ├── agents/         # Generic chart для воркерів
    └── db/             # External dependencies (bitnami/postgresql etc)
```

### Automation (Makefile)
Єдиний інтерфейс для розробника:
- `make up` — запустити локально (Docker Compose).
- `make build` — перезібрати контейнери.
- `make deploy-dev` — деплой в K3s (Dev namespace).
- `make test` — прогон тестів.

### Quality Gates
1. **Idempotency**: Повторний запуск ETL не дублює дані.
2. **One ID**: Використання єдиного `uuid` для сутності у всіх базах (Postgres, ES, Qdrant).
3. **No Downtime**: Rolling updates для Backend/Frontend.
