# 📘 PREDATOR EXECUTION RUNBOOKS
# Version: 30.1
# Status: PRODUCTION READY

This document defines the Standard Operating Procedures (SOPs) for maintaining and operating the Predator Analytics v45.1+ system.

---

## 🟢 RUNBOOK A: COLD START (DISASTER RECOVERY / FIRST BOOT)

**Trigger:** New server setup, full crash, or "Clean Slate" requirement.
**Goal:** Restore full system functionality with 0 errors.

### 1. Backend Boot (The Foundation)
1.  Navigate to `PredatorAnalytics` root.
2.  Execute `BACKEND_CLEAN_BOOT.sh` (Mac/Local) or `deploy_prod.sh` (Server).
    - *Why:* Bypasses local file locks and creates a clean Python venv.
3.  **Verification:**
    - `curl http://localhost:9080/health` -> Must return `{"status": "ok"}`
    - Check Telegram Sentinel logs: `tail -f /tmp/predator_backend_launch/logs/sentinel.log`

### 2. Frontend Launch (The Interface)
1.  Ensure Backend is GREEN.
2.  Execute `START_3045.sh` (or `START_UI.sh` for standard port).
    - *Why:* Uses clean `pnpm` install and temp cache to avoid `EPERM` issues.
3.  **Verification:**
    - Open `http://localhost:3045` (or configured port).
    - Login (Auto-bypass allowed only in Dev).
    - Check "System Status" dashboard widget.

---

## 🟡 RUNBOOK B: DATA INGESTION (DAILY OPS)

**Trigger:** New dump received (Customs Excel, Telegram Export, JSON Lines).
**Goal:** 100% data indexed without duplicates.

### 1. Pre-Processing
1.  Place raw files in `data_staging/incoming`.
2.  Run Validator: `python scripts/validate_ingestion_source.py <filename>`
    - *Check:* Encoding (UTF-8?), Column Headers, Corruption.

### 2. Execution
1.  Trigger Ingestion API:
    ```bash
    curl -X POST http://localhost:9080/api/v1/ingestion/start \
      -F "file=@/path/to/data.xlsx" \
      -F "type=customs_declaration"
    ```
2.  **Monitor:**
    - Watch progress via UI "Ingestion Monitor".
    - Logs: `tail -f logs/ingestion_pipeline.log`

### 3. Post-Action
1.  Verify record count in Dashboard.
2.  Run random spot-check search in UI to confirm data is queryable.

---

## 🔵 RUNBOOK C: AI MODEL REFRESH

**Trigger:** Knowledge cutoff update, new RAG sources added.

### 1. Vector Store Re-indexing
1.  Put system in "Maintenance - Read Only" mode.
2.  Run `python services/backend/pipelines/rag/reindex.py --collection=all`.
3.  Verify: Compare document count in Qdrant vs PostgreSQL.

### 2. Evaluation
1.  Run "Golden Set" test: `python tests/ai/benchmark_rag.py`.
2.  **Constraint:** If Confidence Score drops below 0.85 average, ROLLBACK changes.

---

## 🔴 RUNBOOK D: EMERGENCY RESPONSE (RED ALERT)

**Trigger:** 500 Errors spike, UI unresponsive, "SYSTEM CRITICAL" alert.

### 1. Immediate Stabilization
1.  If UI is stuck: Restart Frontend Container/Script (`kill -9 <pid>` then `START_3045.sh`).
2.  If Backend is hung: Check memory usage (`htop`). If OOM, restart Service.

### 2. Circuit Breaking
1.  If API is flooding (DDoS or loop): Enable lockdown mode.
    - `curl -X POST http://localhost:9080/api/v1/admin/lockdown/enable`

### 3. Root Cause Analysis (RCA)
1.  Pull logs: `logs/error.log` and `logs/access.log`.
2.  Trace `request_id` in logs across microservices.
3.  **Report:** Create an Incident Report in `docs/incidents/YYYY-MM-DD_issue.md`.

---

## ⚪ RUNBOOK E: RELEASE TO PRODUCTION

**Trigger:** Moving code from Dev to Prod.

### Checklist (Constraint Enfocement)
- [ ] No `TODO` comments in critical paths.
- [ ] Frontend builds without warnings.
- [ ] All new API endpoints have Pydantic models.
- [ ] Database migrations successfully applied on staging.
- [ ] Business Metrics (Retention/Value) hooks are active.

**Command:**
```bash
./scripts/deploy_prod.sh --verify-integrity
```

---
*End of Runbooks*
