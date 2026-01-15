---
description: Google AI Studio Integration Workflow
---

# Google AI Studio -> Predator AZR Workflow

This workflow describes how to manually transfer a suggestion from Google AI Studio (or Chat Interface) into the Predator AZR system for constitutional verification and execution.

## Prerequisite
- You have an "Advisory" output from Google AI Studio (code snippet, architecture idea).
- You have `predatorctl` v26 installed.

## 1. Create a Proposal File
Save the Google output into a YAML file, e.g., `google_optimization.yaml`.

```yaml
source: "google_ai_studio"
session_id: "GAI-2024-03-22-ALPHA"
type: "code_optimization"
description: "Vectorization of ETL loop for Axiom 15 compliance"
content: |
  # Proposed Change
  def process_batch(df):
      # OLD: for row in df...
      # NEW: Vectorized
      df['value'] = df['value'] * 1.05
actions:
  - type: "GITOPS_SYNC"
    target: "services/etl/processors.py"
```

## 2. Submit Proposal via CLI
Use the constitutional CLI to wrap this content in an AZR envelope.

```bash
# turbo
predatorctl google propose google_optimization.yaml
```

## 3. Verify Status
Check if the Arbiter has received it.

```bash
predatorctl arbiter history --limit 1
```

## 4. (Optional) Run Simulation
If the proposal involves code changes, run a constitution check.

```bash
predatorctl azr run --cycles 1
```
