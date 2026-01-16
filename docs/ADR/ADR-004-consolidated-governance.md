# ADR-004: Consolidated Governance Core (Monolithization)

## Status
ACCEPTED

## Date
2026-01-16

## Context
The system architecture previously relied on 5 separate microservices for governance functionality:
- `arbiter` (Rules)
- `truth-ledger` (Audit)
- `som` (Sovereign Observer)
- `rce` (Execution)
- `vpc-verifier` (Isolation)

These services were lightweight (Python/FastAPI) but consumed significant resources (RAM/CPU) due to Python interpreter overhead (approx. 100MB RAM each). Intra-service communication was done via HTTP, adding latency.

## Decision
We decided to consolidate all 5 governance microservices into a single unified service called **`constitutional-core`**.

### Implementation Details:
1.  **Modular Monolith:** The codebases of the 5 services were moved to `services/constitutional-core/app/modules/{module_name}`.
2.  **FastAPI Mounting:** The unified `main.py` uses `app.mount()` to serve the logic of each module under `/api/v1/{module_name}`.
3.  **Docker Optimization:** A single Docker container is now used, replacing 5 separate containers.
4.  **UV Package Manager:** The build process uses `uv` for 10x faster dependency installation.
5.  **Traffic Map:** The old ports (8091-8095) are mapped to the single container port (8000) or handled via Nginx/Docker mapping to maintain API compatibility.

## Consequences

### Positive:
- **Resource Efficiency:** RAM usage reduced by ~400-500MB.
- **Performance:** Internal communication latency eliminated (in-process calls possible in future).
- **Simplicity:** Fewer containers to manage, faster deployment.

### Negative:
- **Coupling:** Modules share the same Python environment and dependencies. A conflict in requirements could be an issue (resolved by keeping `requirements.txt` minimal/unified).
- **Import Complexity:** Moving code required checking relative/absolute imports.

## Technical Debt Note
- The `som` module maintains an internal `truth_ledger.py` (in-memory) separate from the global `ledger` module (DB-backed). This duplication is preserved intentionally for now but should be unified in v29.
