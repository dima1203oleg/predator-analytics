# Predator Analytics v45: CLI-First System Implementation

## 🦅 Overview

Predator Analytics v45 establishes a **CLI-First, Constitutionally-Bound, Autonomous System**.
This implementation enforces the "CLI-First Sovereignty" and "GitOps Verification" laws.

## 🛠 installed CLI Tools

### 1. `predatorctl` (Control Plane)

The single source of truth for controlling the system.

**Usage:**

```bash
predatorctl system status
predatorctl system audit --type constitution
predatorctl etl list
predatorctl chaos run gpu_failure
predatorctl azr propose --type performance --file proposal.yaml
```

### 2. `google-agentctl` (Integrative Runtime)

The interface for the Google ecosystem to assist, propose, and analyze.

**Usage:**

```bash
google-agentctl generate proposal --type optimization --area kubernetes
google-agentctl analyze performance --metric cpu
google-agentctl submit proposal --file proposal.yaml
```

## 📜 Constitutional Framework

Located in `infrastructure/constitution/`:

- **axioms.yaml**: The immutable core laws.
- **laws/gpu_first.yaml**: Mandates GPU usage for heavy tasks.
- **laws/etl_truth.yaml**: Enforces Arbiter approval for state changes.
- **laws/data_sovereignty.yaml**: Requires lineage for all data.
- **laws/human_intervention.yaml**: Limits human touch to critical reviews only.

## 🏗 Infrastructure & Policy

- **Terraform**: `infrastructure/main.tf` defines the GPU-ready infrastructure.
- **OPA Policies**: `policies/opa/` contains Rego policies for automated enforcement.
- **GitOps**: `infrastructure/manifests/applicationset.yaml` for ArgoCD.

## 🤖 Agents

- **AZR Agent**: `agents/azr_agent.py` implements the continuous improvement loop.

## 🧪 Testing & Reliability

- **Chaos Experiments**: `tests/chaos/experiments.yaml` defines scenarios like node failure and network partition.
- **Prometheus Rules**: `monitoring/prometheus/alerting_rules.yaml` alerts on constitutional violations.

## 🚀 Deployment

1. **Bootstrap Infrastructure**:

   ```bash
   cd infrastructure
   terraform init && terraform apply
   ```

2. **Install CLIs**:

   ```bash
   pip install -e predatorctl
   pip install -e google_agentctl
   ```

3. **Verify Constitution**:

   ```bash
   predatorctl system audit
   ```
