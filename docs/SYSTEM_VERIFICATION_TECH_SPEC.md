# SYSTEM VERIFICATION TECH SPEC (MASTER TEST PLAN)

## 1. Goal
Verify Predator Analytics is a real, functional system with zero simulations/mocks across the entire stack:
**UI → Backend → DBs → Indexes → Backend → UI**.

## 2. Scope
- **Frontend**: Web UI responsiveness and connectivity.
- **Backend**: API stability and service orchestration.
- **Data Stores**: PostgreSQL, OpenSearch, Qdrant, MinIO, Redis.
- **Pipelines**: Ingestion, Parsing, Indexing, Querying.
- **Interfaces**: Telegram Bot, CLI (Mistral/Vibe/Copilot).

## 3. Strict Rules
- ❌ No mock data.
- ❌ No simulated responses.
- ✅ All results must originate from real databases.
- ✅ LOCAL vs SERVER roles must be strictly enforced.

## 4. Verification Steps Matrix

| Stage | Task | Evidence Required |
| :--- | :--- | :--- |
| **Start** | Runtime Health Check | Containers Up, /health -> 200 |
| **Ingest** | Real File Upload | MinIO object, Celery task log |
| **Process**| Parsing & Transformation | Postgres records, Clean fields |
| **Index** | Search & Vector Prep | OpenSearch docs, Qdrant vectors |
| **Query** | E2E Retrieval | UI results from OS/Qdrant |
| **Control**| Bot & CLI | Real action triggering |

---
*Created on 2025-12-20*
