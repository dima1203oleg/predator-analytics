# Predator Analytics — Stabilization, Unification & UX Improvement

## 1) Purpose
Bring Predator Analytics to a state of a **coherent, manageable product** by implementing the audit outcomes via **evolutionary changes**.

This spec is addressed to an **AI agent** acting as both:
- system analyst (map contracts, detect drift, define canon)
- senior full‑stack engineer (implement changes safely, incrementally)

## 2) Executor Role
You are an **AI System Architect + Senior Full‑Stack Engineer**.
Your mission is to stabilize, unify contracts, and improve UX **without breaking existing production functionality**.

## 3) Non‑Negotiable Principles
- Do **NOT** rewrite from scratch.
- Do **NOT** break production API behavior.
- Do **NOT** delete old paths; only mark as `deprecated` or `experimental`.
- All changes must be **evolutionary**.
- Each change must be justified by the audit findings.
- Establish **ONE canon** per domain (Auth, Documents, Tenant, Ingestion) and implement **guardrails first**.
- No silent magic, no hidden side‑effects, no new duplicate contracts.

## 4) Mandatory Objectives (Must Achieve)
1. Eliminate critical stability and security risks.
2. Align contracts across components (auth, documents, ingestion, tenant).
3. Ensure backend is **boot‑safe** in:
   - Docker
   - Helm
   - local dev
4. Improve the web UI to be more intuitive, faster, and more predictable.
5. Fix deployment inconsistencies and remove plaintext secrets.
6. Implement all recommendations corresponding to the audit items (1–10).

## 5) Backend — Mandatory Work Items

### 5.1 Boot‑Safety
You must:
- Remove/fix all imports referencing non‑existing modules (e.g. `app.core.db`).
- Ensure backend startup is deterministic across Docker/Helm/local.

**Acceptance:** Backend starts without ImportError; health endpoint responds.

### 5.2 Authentication — One Canon
You must choose exactly one canonical auth approach:
- **Keycloak‑first (prod) + JWT only for dev**, or
- **JWT‑first**.

You must:
- Implement exactly one `get_current_user` dependency used by all routers.
- Standardize claims schema including `tenant_id`.
- Remove duplicate `/api/v1/auth/profile` routes (single authoritative endpoint).

**Acceptance:**
- One login/profile path.
- All protected endpoints use the same auth dependency.
- UI consistently sends `Authorization` header + tenant context.

### 5.3 Documents — One Canonical Contract
You must:
- Define canonical documents schema/table(s).
- Align:
  - ingestion → writes
  - services → reads
  - indexing → source

Forbidden:
- reading from one documents table and writing to another.

**Acceptance:** ingestion/service/indexing use the same canonical store; schema and migrations match.

### 5.4 Tenant Isolation — Security Guardrail
You must:
- Enforce tenant filter for OpenSearch queries **even when `query_body` is provided**.
- Forbid any search without explicit tenant context.
- Normalize tenant semantics (no random/default drift).

**Acceptance:**
- Search cannot run without tenant_id.
- No cross‑tenant leakage through search.

### 5.5 Ingestion Unification
Canonical pipeline:

`API → job registry → queue → workers → DB → index`

You must:
- Keep other ingestion paths but label them `deprecated` or `experimental`.
- Ensure UI reflects canonical pipeline status (jobs, backlog, failures).

**Acceptance:** one recommended pipeline exists and is observable end‑to‑end.

### 5.6 Deployment & Secrets
You must:
- Align Helm and docker‑compose commands and configs.
- Forbid secrets in plaintext:
  - `values.yaml`
  - `values-production.yaml`
  - json files
  - hardcoded keys in code
- Provide a clear path to ExternalSecrets/Vault.

**Acceptance:** no plaintext secrets in repo; deployment artifacts are consistent.

## 6) Web UI — Mandatory Improvements

### 6.1 UX (Intuitiveness)
You must:
- Simplify first user journey.
- Remove confusing “magic behavior”.
- Add explicit states:
  - loading
  - empty
  - error
  - success
- Show “what is happening now” (search status, ingestion status, indexing status).

### 6.2 UI ↔ API Consistency
You must:
- Forbid mixing of `/api/v1/*` and `/api/v45/*`.
- Choose one canonical API base and update UI accordingly.
- Ensure all requests include tenant context.

### 6.3 Minimum UI Areas (Must Exist)
1) Dashboard
- system state
- ingestion backlog
- errors

2) Documents
- list
- status
- tenant

3) Ingestion
- job history
- job statuses

4) Search
- tenant‑safe

5) System / Health
- metrics
- version
- environment

### 6.4 UI Performance
You must:
- Minimize rerenders and duplicate fetches.
- Introduce caching and a clear state model.

**Acceptance:** UI is stable, predictable, no redundant network churn, clear error messages.

## 7) Observability — One Contract
You must:
- Provide exactly one `/metrics` endpoint.
- Provide exactly one Prometheus registry.
- Provide one KPI dashboard spec:
  - latency p95
  - error rate
  - ingestion backlog

Forbidden:
- duplicate metrics/registries.

## 8) Deliverables
You must provide:
1) A list of implemented changes mapped to audit items.
2) A “Canonical Contracts” document:
   - Auth
   - Documents
   - Tenant
   - Ingestion
3) Code comments (only where critical) explaining why.
4) Migration‑safe changes where possible.

## 9) Definition of Done (DoD)
- Backend boots without crashes (Docker/Helm/local).
- No tenant leaks.
- One auth path.
- One documents contract.
- UI is intuitive, predictable, tenant‑safe.
- No plaintext secrets.
- System feels like one product, not layered versions.

## 10) Prohibitions
- “Works because historically so”
- Silent magic
- Hidden side‑effects
- New duplicate contracts

## 11) Final Principle
Better fewer features but one truth.
Better one canon than three “working” variants.
