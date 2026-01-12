# Predator Analytics v25.0 — Technical Specification (Canonical)

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Goals, Scope, Non-Goals](#2-goals-scope-non-goals)
- [3. System Architecture (High-Level)](#3-system-architecture-high-level)
- [4. Core Domains](#4-core-domains)
  - [4.1 ETL & Ingestion](#41-etl--ingestion)
  - [4.2 Search & RAG](#42-search--rag)
  - [4.3 LLM, Agents & MLOps](#43-llm-agents--mlops)
  - [4.4 Nexus Core UI & Interfaces](#44-nexus-core-ui--interfaces)
  - [4.5 GitOps, Security & Infrastructure](#45-gitops-security--infrastructure)
- [5. Data Flows](#5-data-flows)
  - [5.1 ETL -> Augment -> Train -> Index](#data-flow-51)
  - [5.2 Search -> Rerank -> XAI](#data-flow-52)
  - [5.3 Self-Improvement Loop](#data-flow-53)
- [6. Storage & Data Layer](#6-storage--data-layer)
- [7. API Surface (Authoritative Links)](#7-api-surface-authoritative-links)
- [8. Environments & Contours](#8-environments--contours)
- [9. Observability & Operations](#9-observability--operations)
- [10. Quality Gates & Definition of Done](#10-quality-gates--definition-of-done)
- [11. Security Model (Baseline)](#11-security-model-baseline)
- [12. Appendix](#12-appendix)

---

## 1. Executive Summary

Predator Analytics v25.0 — це AI-native аналітична платформа з мульти-агентною архітектурою, яка забезпечує:

- ingestion структурованих/неструктурованих даних (XLSX/CSV/PDF/OSINT/Telegram)
- hybrid search (BM25 + vector) з reranking
- RAG-відповіді з посиланнями на джерела (XAI)
- MLOps/self-learning (DVC + MLflow + evaluation + controlled promote через GitOps)
- операційну надійність (observability, quality gates, rollback)

Канонічні матеріали зібрані з:

- `implementation_v25/TECH_SPEC.md`
- `docs/specs/v25_unified/*`
- `docs/api/openapi.yaml`
- `docs/diagrams/ARCHITECTURE_DIAGRAMS.md`

---

## 2. Goals, Scope, Non-Goals

### Goals

- Єдиний master-документ для v25.0 з навігацією
- Узгоджений опис доменів: ingestion, search/RAG, agents/MLOps, UI, GitOps/security
- Посилання на діаграми в `diagrams/` як на “source of truth” для потоків/архітектури

### Scope

- Backend/API Gateway (FastAPI), jobs/черги, storage layer (PostgreSQL/OpenSearch/Qdrant/Redis/MinIO)
- Self-improvement loop з контрольованим promote
- UI рівень (Nexus Core та інтегровані інтерфейси)

### Non-Goals

- Повний опис бізнес-логіки кожного модуля (деталізація на рівні окремих сервісів/таблиць за межами базової схеми)
- Заміна існуючих робочих доків (цей документ є канонічним, але не видаляє історичні документи)

---

## 3. System Architecture (High-Level)

- **Presentation Layer**: UI shells (Explorer/Operator/Commander/Architect), Nexus Core UI
- **API Gateway Layer**: FastAPI gateway + middleware (CORS, rate limits, metrics, logging)
- **Services Layer**: ETL/Ingestion, Search/RAG, ML services, LLM router, optimizer
- **Data Layer**: PostgreSQL, OpenSearch, Qdrant, Redis, MinIO
- **Orchestration**: queues/jobs, GitOps deployment, observability stack

Diagrams:

- [`diagrams/architecture.mmd`](./diagrams/architecture.mmd)

---

## 4. Core Domains

### 4.1 ETL & Ingestion

Опис домену ingestion:

- **Upload Gateway**: точка входу (REST API / UI upload)
- **Ingestion Manager**: оркестрація завантаження та запуску job
- **File Registry**: метадані файлів, хеші, статуси
- **Parser Workers**: excel/pdf/etc
- **Normalizer/Validator**: канонічна схема
- **Dedup/Idempotency Engine**: уникнення дублювання

Джерела даних:

- XLSX/CSV
- PDF
- Telegram
- Web/OSINT
- публічні реєстри

Diagrams:

- [`diagrams/etl_ingestion_sequence.mmd`](./diagrams/etl_ingestion_sequence.mmd)

### 4.2 Search & RAG

- **Hybrid Search Router**: паралельно OpenSearch (BM25) + Qdrant (dense)
- **Reranker**: cross-encoder reranking
- **RAG Orchestrator**: build context, context window management
- **Answer Compiler**: final answer + citations (XAI)

Diagrams:

- [`diagrams/search_rag_sequence.mmd`](./diagrams/search_rag_sequence.mmd)

### 4.3 LLM, Agents & MLOps

LLM/MAS:

- **Model Router / Provider Drum**: вибір моделі під задачу (якість/вартість/latency)
- режими: local-first (Ollama) та external APIs

Ролі агентів (мінімально):

- Orchestrator/Arbiter
- Retriever/Searcher
- Analyst
- RedTeam
- Synthesizer
- DatasetInspector
- LoRATrainer

MLOps/self-improve:

- DVC: versioning datasets
- MLflow: experiments + registry
- Evaluation harness: автоматична оцінка якості
- Promote тільки через gates + GitOps

Diagrams:

- [`diagrams/self_improvement_loop.mmd`](./diagrams/self_improvement_loop.mmd)

### 4.4 Nexus Core UI & Interfaces

UI рівень складається з:

- **Nexus Core** (React/Next.js): dashboard, pipeline tree, monitoring, knowledge graph, settings
- **OpenSearch Dashboards**: deep analytics, dev tools
- **OpenWebUI**: чат для LLM/RAG

UX вимоги:

- dark mode default
- responsive
- micro-interactions

Diagrams:

- [`diagrams/ui_shells.mmd`](./diagrams/ui_shells.mmd)

### 4.5 GitOps, Security & Infrastructure

- Orchestrator: K3s
- GitOps controller: ArgoCD
- Package manager: Helm
- Registry: GHCR/Harbor

Security:

- Keycloak (OIDC/SAML), MFA
- Vault + ExternalSecrets
- Network policies + TLS (cert-manager)
- Audit logging

Observability:

- Prometheus + Grafana
- Logs: Loki
- Tracing: Tempo/Jaeger

Diagrams:

- [`diagrams/gitops_workflow.mmd`](./diagrams/gitops_workflow.mmd)

---

## 5. Data Flows

<a id="data-flow-51"></a>
### 5.1 ETL -> Augment -> Train -> Index

Diagram:

- [`diagrams/etl_augment_train_index.mmd`](./diagrams/etl_augment_train_index.mmd)

<a id="data-flow-52"></a>
### 5.2 Search -> Rerank -> XAI

Diagram:

- [`diagrams/search_rerank_xai.mmd`](./diagrams/search_rerank_xai.mmd)

<a id="data-flow-53"></a>
### 5.3 Self-Improvement Loop

Diagram:

- [`diagrams/self_improvement_loop.mmd`](./diagrams/self_improvement_loop.mmd)

---

## 6. Storage & Data Layer

Основні компоненти:

- PostgreSQL: operational truth
- OpenSearch + Qdrant: search truth
- MinIO: artifacts truth (datasets/models/snapshots)
- Redis: cache truth (non-authoritative)

Мінімальна схема таблиць (логічно): documents, augmented_datasets, ml_datasets, ml_jobs, multimodal_assets, si_cycles.

---

## 7. API Surface (Authoritative Links)

Authoritative API description:

- `docs/api/openapi.yaml`

Важливо: фактична реалізація API також визначається роутерами FastAPI в `services/api-gateway/app/`.

---

## 8. Environments & Contours

Типові контури:

- Dev (Mac): локальні smoke/mock
- Edge/Staging (K3s): інтеграційні тести, A/B
- Compute (NVIDIA): heavy training/індексація

---

## 9. Observability & Operations

- Metrics: Prometheus (scrape всіх сервісів)
- Dashboards: Grafana
- Logs: Loki
- Tracing: Tempo/Jaeger

---

## 10. Quality Gates & Definition of Done

DoD (мінімум):

- Helm charts валідні
- ArgoCD synced/healthy
- unit/integration пройдені
- security scan (Trivy) без critical
- метрики приходять в Prometheus
- документація оновлена

---

## 11. Security Model (Baseline)

- Zero trust network policies
- Secrets тільки через secret management (Vault/ExternalSecrets)
- Audit logging по API
- MFA через IdP

---

## 12. Appendix

- Existing v25 spec (reference): `implementation_v25/TECH_SPEC.md`
- Domain specs (reference): `docs/specs/v25_unified/*`
