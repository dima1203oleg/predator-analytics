
# 📦 Predator Analytics v20.0 — Release Notes (Singularity Edition)

**Status:** Stable / Released
**Focus:** Mini Stack 2-6 + Admin UI + Self-Learning Loop v1

---

## 1. Overview

Predator Analytics v20.0 ("Singularity Edition") introduces the stable **Mini Stack**, comprising the core ETL engine, AI Brain, and a unified Admin UI for monitoring and control. This release marks the transition from prototype to a production-ready SaaS platform deployable on NVIDIA and Oracle environments.

---

## 2. Key Features

### 2.1. ETL Engine (`ua-sources`)
- **Data Ingestion:**
  - `POST /etl/upload`: High-performance upload for XLSX/CSV files.
  - `GET /etl/imports/{id}`: Real-time tracking of import status.
- **Connectors:**
  - Integrations for Customs, Tax, and Open Registers.

### 2.2. AI Brain (`predator-brain`)
- **Neural Council:**
  - `POST /council/run`: Multi-model consensus engine (Gemini, DeepSeek, Llama).
- **Self-Learning Loop (v1):**
  - `POST /council/feedback`: Captures user feedback (positive/negative) to train future iterations.
  - `brain_training_samples` table stores Q/A pairs for dataset generation.

### 2.3. Admin UI & Observability
- **DashboardView:** Main operational dashboard for system health.
- **AdminDashboard:** Dedicated view for:
  - **Billing:** Track `api_usage_events`.
  - **Training:** Review and label `brain_training_samples`.
- **SettingsView:** Feature flag management per environment (`mac`, `nvidia`, `oracle`).

### 2.4. Infrastructure & Security
- **GitOps-First:** All deployments managed via ArgoCD.
- **Security:** Keycloak RBAC, Vault for secrets, TLS-ready ingress.
- **Rate Limiting:** Redis-backed throttling (429 responses).

---

## 3. Upgrade Guide

To upgrade from v19.x:
1. Ensure ArgoCD is synced with the `main` branch.
2. Verify `vault` secrets are populated.
3. Run database migrations for `api_usage_events` and `brain_training_samples`.
