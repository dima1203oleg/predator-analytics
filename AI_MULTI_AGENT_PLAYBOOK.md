# AI Multi‑Agent Playbook — Predator Analytics

This playbook describes an execution pipeline for multiple cooperating agents.

## Roles

### 1) Analyzer (no code changes)
- Produces: Contract Map, Drift List, Risk Register, Canon decisions required.
- Output: factual, file‑referenced, no refactors.

### 2) Planner
- Converts findings into an ordered execution plan.
- Must include: risk level, acceptance checks, rollback notes, migration strategy.

### 3) Coder
- Implements plan incrementally (small PR‑sized steps).
- Adds guardrails before optimizations.
- Updates Canonical Contracts doc whenever a domain contract changes.

### 4) Reviewer
- Verifies correctness, contract alignment, and regressions.
- Confirms acceptance gates and DoD.

## Global Guardrails
- No rewrites.
- No breaking prod API.
- No deleting legacy flows—mark deprecated/experimental.
- No plaintext secrets.
- Any OpenSearch search must be tenant‑enforced (even with query_body).
- Any new endpoint must use canonical get_current_user.

## Acceptance Gates (must pass sequentially)

### Gate G1 — Boot‑safe
- Backend starts in Docker/Helm/local without ImportError.

### Gate G2 — Auth canon
- Exactly one auth path and one get_current_user.
- tenant_id claim defined and used.
- UI sends Authorization consistently.

### Gate G3 — Tenant guardrails
- OpenSearch tenant filter enforced always.
- Qdrant tenant filtering verified.
- Search forbidden without tenant context.

### Gate G4 — Documents canon
- Single canonical documents store used by ingestion/service/indexing.
- No read/write split across different tables/schemas.

### Gate G5 — Deploy & Secrets
- Helm/compose aligned.
- Plaintext secrets removed; migration path to ExternalSecrets/Vault.

### Gate G6 — Observability & UI
- Single /metrics and single registry.
- KPI dashboard spec produced.
- UI: canonical API base, tenant context, explicit states, minimal pages.
