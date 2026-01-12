---
description: Comprehensive System Verification Suite (Predator Analytics v25)
---

# 1. Data Integrity & Infrastructure Verification
- [ ] **Service Status Check**: Verify all core services are running (Backend, Postgres, Redis, Qdrant, OpenSearch, MinIO).
- [ ] **Configuration Audit**: Confirm backend is configured to use REAL databases, not mocks (check `settings.py` / env vars).
- [ ] **Database Connectivity**:
    - [ ] PostgreSQL connection check.
    - [ ] Redis connection check.
    - [ ] Qdrant connection check.
    - [ ] OpenSearch connection check.
    - [ ] MinIO connection check.

# 2. Web Interface Data Ingestion (End-to-End)
- [ ] **Upload Mechanism**:
    - [ ] Verify `DatasetStudio.tsx` or `IngestionView.tsx` uploads files to the correct backend endpoint.
    - [ ] endpoint: `/api/v1/ingest/upload` (or similar).
- [ ] **Data Flow Verification**:
    - [ ] **MinIO**: Verify file appears in the raw bucket.
    - [ ] **OpenSearch**: Verify document is indexed in the full-text index.
    - [ ] **Qdrant**: Verify embeddings are generated and stored.
    - [ ] **PostgreSQL**: Verify metadata record exists in the primary DB.

# 3. Agents & Orchestration
- [ ] **Agent Status**: Verify all agents are 'ACTIVE' via the Orchestrate API / CLI.
- [ ] **Task Execution**: Trigger a dummy task and verify agent pickup & completion.
- [ ] **Self-Improvement Loop**: Verify `TransformationService` or `OptimizationLoop` is active.

# 4. Performance & Logs
- [ ] **Latency Check**: Measure API response time for critical endpoints.
- [ ] **Log Aggregation**: Verify logs are shipping to Loki (if configured) or visible in container logs.
