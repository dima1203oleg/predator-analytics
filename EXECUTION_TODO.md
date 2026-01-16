# Execution TODO — Predator Analytics Stabilization

This checklist is written to be executed by an AI agent implementing the audit outcomes.

## P0 — Stop‑the‑line (Critical)

### 1) Secrets removal and path to secret manager
- Targets:
  - `helm/predator-analytics/values.yaml`
  - `helm/predator-analytics/values-production.yaml`
  - any `*.json` containing tokens/keys (e.g. `services/api-gateway/dynamic_keys.json` if present)
- Required:
  - remove plaintext secrets from repo
  - load secrets via environment / secret provider
  - document the migration path (ExternalSecrets/Vault)

**Acceptance:** repository contains no plaintext secrets; `git grep -i` checks are clean.

### 2) Backend boot‑safety (import graph)
- Targets:
  - `services/api-gateway/app/main.py`
  - `services/api-gateway/app/api/routers/etl.py` (and its imports)
- Required:
  - remove references to missing modules (e.g. `app.core.db`)
  - ensure backend starts in Docker/Helm/local

**Acceptance:** backend starts without ImportError; health endpoint responds.

### 3) Tenant leakage prevention (OpenSearch)
- Targets:
  - `services/api-gateway/app/services/opensearch_indexer.py`
  - `services/api-gateway/app/api/routers/search.py`
- Required:
  - enforce tenant filter even when `query_body` is provided
  - forbid search without tenant context

**Acceptance:** cross‑tenant access is impossible through search; missing tenant context is rejected.

### 4) Auth canon decision and enforcement
- Targets:
  - `services/api-gateway/app/api/deps.py`
  - `services/api-gateway/app/services/auth_service.py`
  - `services/api-gateway/app/api/routers/auth.py`
  - `services/api-gateway/app/main.py`
- Required:
  - choose Keycloak‑first or JWT‑first
  - single `get_current_user`
  - remove duplicate `/api/v1/auth/profile`
  - standardize `tenant_id` claim

**Acceptance:** one auth flow works end‑to‑end; all routers use canonical auth.

## P1 — Contract Unification

### 5) Documents canonical store
- Targets:
  - `services/api-gateway/app/services/document_service.py`
  - `services/api-gateway/app/core/data_layer_schema.py`
  - `libs/core/models/entities.py`
- Required:
  - pick canonical table/schema
  - align reads/writes/indexing to the same canonical store
  - add migration‑safe fixes

**Acceptance:** no split‑brain reads/writes; schema matches runtime behavior.

### 6) Ingestion canonical pipeline
- Targets:
  - upload routers (`/api/v1/...`)
  - `services/api-gateway/app/tasks/etl_workers.py`
  - `services/api-gateway/app/services/etl_ingestion.py`
  - `libs/core/mq.py` and Celery config
- Required:
  - implement and document pipeline: API→job registry→queue→workers→DB→index
  - mark alternative paths deprecated/experimental

**Acceptance:** one recommended pipeline exists and is observable.

### 7) Deployment consistency (Helm/Compose)
- Targets:
  - `helm/...` celery worker templates
  - `services/api-gateway/app/core/celery_app.py`
  - `docker-compose.prod.yml`
- Required:
  - fix Celery `-A` to correct module
  - ensure compose mount paths exist or remove mounts

**Acceptance:** worker starts; compose does not reference missing files.

## P2 — Observability + UI

### 8) One metrics endpoint
- Targets:
  - `services/api-gateway/app/api/routers/metrics.py`
  - `services/api-gateway/app/api/routers/prometheus_metrics.py`
  - metrics middleware
- Required:
  - choose one canonical `/metrics`
  - ensure one registry and no duplicated series

**Acceptance:** Prometheus scrapes one endpoint; no duplicate time series.

### 9) Frontend UX and API consistency
- Targets:
  - `apps/predator-analytics-ui/src/services/api.ts`
  - search/login/documents components
- Required:
  - unify API base path (no v1/v25 mix)
  - ensure Authorization + tenant context on requests
  - add explicit UI states (loading/empty/error)
  - implement minimal sections: Dashboard/Documents/Ingestion/Search/System
  - performance: dedupe fetch, caching, clear state model

**Acceptance:** UI predictable, tenant‑safe, reduced network churn, clear errors.
