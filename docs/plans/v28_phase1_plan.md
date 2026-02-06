# PREDATOR ANALYTICS v28-S INTEGRATION PLAN
## Phase 1: Genesis (Single-Node Sovereign Edition)

**Target Hardware:** 20 CPU, 64GB RAM, GTX 1080 8GB
**Current Stage:** Docker Compose Migration -> Constitutional Architecture

### 1. Constitutional Core Implementation (Weeks 1-2)
- [ ] **Truth Ledger (PostgreSQL Schema)**
    - Implement `actions_table` with immutable append-only logic.
    - Implement Merkle Tree hashing for chain integrity.
- [ ] **Axiom Registry**
    - Define the "10 Axioms" in a hardened JSON/SQLite configuration.
    - Create `ConstitutionMonitor` service to validate actions against axioms.
- [ ] **Formal Verifier Stub**
    - Integrate Z3 Python bindings into `predator-backend`.
    - Create initial verification endpoint `/api/v1/formal/verify`.

### 2. Sovereign Observer Module (SOM) Integration (Weeks 2-4)
- [x] **Visual Dashboard (UI)**: Implement `SovereignObserverView.tsx` (In Progress).
- [ ] **Central Oversight Core**:
    - Build `SystemStateModel` (Graph representation of services).
    - Connect Prometheus/Loki feeds to Anomaly Detector.
- [ ] **Agents Deployment**:
    - Deploy `ArchitectAgent` (Auto-scaling & resource planning).
    - Deploy `AuditorAgent` (Static analysis of internal code).
    - Deploy `AutoHealAgent` (Restart policies & self-healing).

### 3. Intelligence Layer (Weeks 4-6)
- [ ] **LLM Runtime (Ollama Optimization)**
    - Config `llama.cpp` for GTX 1080 (split layers if necessary).
    - Implement "Constitutional PromptWrappers" ensuring axioms are injected in every prompt.
- [ ] **RCE (Reality Context Engine)**
    - Implement temporal consistency checks for imported data (e.g., March Declarations).

### 4. Human Sovereignty Interface (Immediate)
- [x] **Approval Gateway**: UI for human sanctioning of high-risk actions.
- [x] **Red Button**: Hardware-level (simulated via API) kill switch.

### 6. The "Living Organism" Layers (Weeks 6-8)
- [ ] **Data Quality Engine (Immune System)**
    - Implement `pandas`/`polars` based validation profile.
    - Create `dq_rules.json` configuration.
- [ ] **State Machine (Nervous System)**
    - Implement Redis Streams consumer group for pipeline stages.
    - Visualize FSM in UI.
- [ ] **Identity Resolution (Cortex)**
    - Implement `DedupService` using PG Trigram or Qdrant similarity.
- [ ] **Human-in-the-Loop**
    - Create "Resolution Queue" in UI for manual entity merging.

### 7. Transition to K3s (Future Phase)
- Prepare Helm charts based on current Docker Compose files.
- Setup Traefik Ingress.
