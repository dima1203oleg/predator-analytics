# PREDATOR ANALYTICS v26: "THE UNBREAKABLE" SPECIFICATION

**Version:** 26.2 (Ratified)
**Codename:** "Nezlamnist" (The Unbreakable)
**Status:** IMPLEMENTED
**Governance:** CLI-Governed (via `predatorctl`)

## 1. Abstract
Predator Analytics v26 represents a paradigm shift from a UI-centric application to a **CLI-First Sovereign System**. It is built upon a rigid Constitutional framework (`docs/v26_CONSTITUTION.md`) that enforces truthfulness, compute distribution, and autonomous self-healing. The system guarantee is provided not by code functioning, but by **mathematical proof of state** via the Truth Ledger and **active enforcement** by the Arbiter.

## 2. Core Philosophy
The system operates under the "Law of CLI-First Sovereignty" (Axiom 5). The User Interface is demoted to a passive, read-only projection of the system's state, while all mutations, control, and verification happen exclusively through the `predatorctl` control plane.

### 2.1 Key Components Implemented
1.  **Predator CLI (`predatorctl`)**: The single source of command for the system.
2.  **ETL Arbiter & Truth Ledger**: A python service enforcing invariants and recording cryptographic proof of every state transition.
3.  **Agent Zero Trust**: An autonomous agent framework using ephemeral tokens for self-healing (AZR).
4.  **Chaos Engineering**: Integrated toolkit for continuous resilience verification (`predatorctl chaos`).

---

## 3. DevOps & CI/CD (The "Unbreakable" Pipeline)

### 3.1 Continuous Verification Loop (CVL)
Instead of simple unit tests, v26 employs a "Continuous Verification Loop" triggered by `predatorctl verify`. This validates:
*   **Constitutional Integrity:** MD5/SHA256 checks of the Constitution itself.
*   **Ledger Integrity:** Cryptographic chain validation of the `truth.truth_ledger` table.
*   **Operational Health:** Real-time checks of all microservices via `system check`.

### 3.2 GitOps with ArgoCD
*   **Sync:** ArgoCD automatically syncs `k8s/` manifests from the repo to the cluster.
*   **Drift Detection:** Any manual changes are overwritten by the Git state.
*   **Rollbacks:** Automatic rollback if a new deployment fails health checks.

---

## 4. Local Development Environment

### 4.1 Prerequisites
*   Docker & Docker Compose
*   Python 3.12+ (for `predatorctl`)

### 4.2 Quick Start (CLI-First)
```bash
# Initialize control plane
pip install typer rich shellingham
chmod +x scripts/predatorctl.py

# Check status
./predatorctl.py system status

# Verify Integrity
./predatorctl.py verify --scope full

# Run Chaos Tests
./predatorctl.py chaos run smoke
```

---

## 5. Constitutional Components

### 5.1 Truth Ledger
A dedicated PostgreSQL schema (`truth`) that records every critical state transition.
*   **Immutability:** Uses SHA-256 hash chaining (blockchain-like structure).
*   **Verification:** `predatorctl ledger verify` re-calculates all hashes to detect tampering.

### 5.2 Agent AZR (Autonomous Zone Recovery)
An autonomous agent (`libs/agents/azr_agent.py`) that:
1.  Observes system state via `predatorctl`.
2.  Detects anomalies.
3.  Proposes amendments (fixes).
4.  Operates with ephemeral tokens (Zero Trust).

---

## 6. License & Components

All components are Open Source (Apache 2.0 / MIT).
*   **DB:** PostgreSQL, Qdrant
*   **Search:** OpenSearch
*   **Control Plane:** Typer (Python)
*   **Monitoring:** Prometheus, Grafana
