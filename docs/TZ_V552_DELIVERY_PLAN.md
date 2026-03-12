# План впровадження Predator Analytics v55.2-SM

## 1. Мета та рамки
- **Ціль**: довести всю екосистему Predator Analytics до вимог ТЗ v55.2-SM (архітектура з 40 подів, 5 аналітичних шарів, 250+ реєстрів, 50+ OSINT інструментів, Zero Trust, GitOps).
- **Обмеження**: Python 3.12 для бекендів, React 18 для UI, Kubernetes (k3s) на сервері 194.177.1.240.
- **Вихідні артефакти**: оновлені сервіси, Helm чарти, CI/CD, документація, тестові сценарії, runbooks.

## 2. Стратегічні пріоритети
1. **Інфраструктура та безпека**: Helm/ArgoCD, Vault, Kyverno, Falco, TLS, observability.
2. **Data & Intelligence**: ingestion pipeline, реєстри, OSINT, Neo4j, ClickHouse, Qdrant.
3. **Аналітичні шари та алгоритми**: індекси, CERS, Data Fusion, workers CPU/GPU.
4. **UI/UX**: рольові вьюхи, графи, карти, AI Copilot, PWA.
5. **Тестування і CI/CD**: ruff, mypy, pytest, vitest, k6, trivy, chaos, GitOps потік.

## 3. Етапи реалізації
| Етап | Фокус | Ключові результати |
|------|-------|--------------------|
| **Phase 0 — Stabilization** (готово) | Локальні фікси, health-check, базова інфраструктура | ✅ виконано раніше |
| **Phase 1 — Infra & Control Plane** | Helm, ArgoCD, secrets, observability | Створити чарт для кожного сервісу, налаштувати GitOps, Vault/Kyverno/Falco, Prometheus/Grafana/Loki |
| **Phase 2 — Data & Ingestion** | Реєстри, ingestion-worker, Kafka, MinIO, ClickHouse | RegistryClient framework, 30 топових адаптерів, ingestion pipeline, дельта-оновлення |
| **Phase 3 — Intelligence Engines** | 5 шарів, індекси, workers, Neo4j інтеграція | Behavioral/Institutional/Influence/Structural/Predictive модулі, GDS, ClickHouse агрегації |
| **Phase 4 — AI & OSINT** | OSINT 50+, AI Copilot, RAG, worker-gpu | Інтеграції CrewAI/LangChain, sandbox executors, GPU manager |
| **Phase 5 — UI & Experience** | Рольові UI, карти, графи, PWA, адмін-панель | Сторінки Business/Premium/Audit/Journalist/Governance/Admin, AI Copilot UI |
| **Phase 6 — Hardening & Launch** | DR, k6, chaos, security audits, документація | k6 сценарії, Trivy, Falco alerts, runbooks, DR план |

## 4. Backlog за доменами

### 4.1 Core API
1. Оновити конфіг (`app/config.py`) під всі сервіси (ClickHouse, Qdrant, ai-engine, worker endpoints).
2. Реалізувати повний набір ендпоінтів розділу 9 (reports, admin, graph path, ingestion SSE, risk factors).
3. Інтегрувати Keycloak: middleware для JWT, оновити `permissions.py`, додати tenant isolation на рівні ORM (RLS + filters).
4. Cache layer (Redis) для пошуку, профілів, CERS; додати інвалідацію.
5. Prometheus metrics: додати label-и tenant/endpoint, інтегрувати з OTEL.
6. API tests (pytest + httpx + pytest-asyncio) з coverage ≥80%.

### 4.2 Ingestion Worker
1. Scaffold сервісу (`services/ingestion-worker`): FastAPI health, Kafka consumer (aiokafka/Faust), task router.
2. RegistryClient SDK + 30 топових адаптерів (ЄДР, ПДВ, митниця, суди, Prozorro, санкції).
3. MinIO інтеграція (raw-uploads, processed-files), checksum + lifecycle політики.
4. Enrichment pipeline: parse → normalize → entity resolution → publish (Postgres/OpenSearch/Neo4j/Qdrant).
5. Job tracking: Kafka offsets + `ingestion_jobs` статуси, SSE прогрес.
6. Інтеграційні тести з testcontainers (Postgres, Kafka, MinIO).

### 4.3 Graph Service
1. Завершити REST API: CRUD вузлів/зв’язків, path search, analytics endpoints, Cypher sandbox (адмін).
2. Redis кеш для центральностей, graph snapshots у MinIO.
3. Інтегрувати GDS (якщо доступно) або fallback обчислення.
4. Auth via Keycloak (service token) + rate limiting.
5. Тести (pytest + neo4j testcontainer).

### 4.4 Worker CPU & GPU
- **worker-cpu**:
  1. Створити структуру `layers/` та `indices/`, реалізувати BVI, CP, IM, HCI, PFI, MCI, AAI, PLS, ASS.
  2. Celery/arq tasks, Redis broker, ClickHouse writer.
  3. Batch jobs для nightly перерахунків (інтеграція з job-scheduler).
- **worker-gpu**:
  1. Torch+Whisper, embeddings (BAAI/bge-small-uk), Ollama client.
  2. GPU Resource Manager (mutex + queue) для уникнення OOM.
  3. REST/gRPC API для core-api/ingestion-worker.

### 4.5 AI Engine (RAG, Copilot)
1. FastAPI сервіс, SSE endpoint, інтеграція з LiteLLM/Ollama.
2. Vector search у Qdrant (rag_chunks, company_embeddings, media_embeddings).
3. Prompt templates, цитування джерел, guardrails (перевірка ролей, змісту).
4. Redis кеш історій, Keycloak auth.
5. Unit + integration tests (LLM responses mock).

### 4.6 OSINT Ecosystem
1. Стандартизувати виклик інструментів: Runner API (CLI/HTTP) з sandbox profile.
2. Контейнери з resource limits, network policy (зовнішній трафік тільки назовні).
3. Інтеграція TOP-50 інструментів (Sherlock, Amass, SpiderFoot, Twint, Instaloader, OnionScan, LinkScope, CrewAI, LangChain, Haystack, тощо).
4. Збереження результатів у Postgres (`osint_results`), Neo4j (LinkScope/STIX), MinIO (артефакти).
5. UI модулі для запуску/перегляду результатів.

### 4.7 UI (apps/predator-analytics-ui)
1. Створити структуру сторінок для ролей (Business, Premium, Audit, Journalist, Governance, Admin) + маршрутизація.
2. Компоненти: дашборди Recharts/ECharts, таблиці TanStack, граф Cytoscape, карта Leaflet, AI Copilot панель, Report Builder.
3. Хуки для API/SSE/WebSocket, auth з Keycloak, Zustand store для тем/користувача/фільтрів.
4. PWA (Service Worker, офлайн кеш), локалізація uk.json (повна), accessibility (WCAG AA).
5. Vitest + RTL, e2e (Playwright) для ключових сценаріїв.

### 4.8 Інфраструктура та DevOps
1. **Helm**: каталоги для кожного сервісу (core-api, ingestion-worker, graph, worker-cpu, worker-gpu, ai-engine, job-scheduler, ui, api-gateway) + депо сервісів (Postgres, Redis, Kafka/Redpanda, Neo4j, Qdrant, ClickHouse, Keycloak, Vault, MinIO, OpenSearch).
2. Values з ресурсами, HPA, PSP/podSecurityContext, affinity, tolerations, GPU nodeSelector.
3. ArgoCD applications + GitOps потік (environments: staging, prod).
4. CI/CD (GitHub Actions): lint → test → build → trivy → push → helm template validate → Argo sync.
5. Monitoring stack (Prometheus Operator, Grafana dashboards, Loki promtail), Alertmanager правила.
6. Security: Vault secrets engines, Kyverno policies (no root, limits, approved registries), Falco rules.

### 4.9 Data Layer
1. PostgreSQL DDL (`db/schema.sql`) з усіма таблицями, індексами, RLS, тригерами WORM.
2. ClickHouse schemas + ingestion jobs (worker-cpu).
3. OpenSearch index templates, analyzers для української.
4. Qdrant collections migration scripts.
5. Backup jobs (Velero або custom + MinIO).

### 4.10 Testing & Quality
1. Pytest + coverage ≥80% у сервісах, Vitest ≥80% для UI.
2. Integration tests (testcontainers) для core-api ↔ Postgres/Redis/Kafka, ingestion ↔ MinIO/Kafka, graph ↔ Neo4j.
3. k6 сценарії (100 RPS, p95 <500ms) для пошуку, профілю, інгестії.
4. Chaos tests (Litmus) для відмов PostgreSQL, Kafka, Neo4j.
5. Security scans: ruff/mypy, pip-audit, npm audit, trivy, kube-bench (перед випуском).

## 5. Найближчі кроки (спринт 1)
1. **Helm базова структура**: створити чарт `helm/predator` з підчартами для core-api, graph, ai-engine, ui; задати secrets через Vault refs.
2. **Core API**: підготувати конфіг для інтеграції з новими сервісами, реалізувати Keycloak auth, довести health/liveness readiness до стандарту K8s.
3. **RegistryClient SDK**: scaffold + 5 адаптерів (ЄДР, ПДВ, митні декларації, судові рішення, Prozorro) + їхні pytest тести з fixtures.
4. **UI каркас**: створити layout, auth guard, базові маршрути для Business/Premium/Audit, інтегрувати Keycloak JS adapter.
5. **CI/CD**: додати GitHub Actions workflow (`.github/workflows/ci.yaml`) з ruff, mypy, pytest (core-api), vitest, trivy (образ core-api).

## 6. Залежності та ризики
- **Ліцензії OSINT**: перевірити сумісність open-source інструментів, уникати несумісних ліцензій.
- **Ресурси GPU**: один GTX1080 — необхідний internal queue, щоб уникати блокувань.
- **Державні реєстри**: частина API платні/закриті → передбачити мок/обхід (mock server 9080) та модульну структуру адаптерів.
- **SecOps**: Vault/Kyverno/Falco потребують додаткових прав на кластері; узгодити з DevOps.

## 7. Контроль якості та звітність
- Щотижневий прогрес у `docs/STATUS_REPORT.md` (таблиця виконання).
- Для кожної фази — демо (core-api e2e, ingestion pipeline, UI ролі, AI Copilot, OSINT запуск).
- Definition of Done: код + тести + Helm + документація + runbook + моніторинг + алерти.
