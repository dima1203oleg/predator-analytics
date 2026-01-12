# Predator Analytics v26 User Guide

Welcome to the Predator Analytics Control Plane.

## 🟢 Quick Status Check
```bash
./scripts/predatorctl.py system status
```

## 🔍 Verification (The "Are we truthful?" Check)
Runs a full suite of integrity checks on Constitution, Ledger, and Services.
```bash
./scripts/predatorctl.py verify
```

## ⚖️ ETL & Arbiter
Submit jobs and check Arbiter decisions.
```bash
# Submit Job
./scripts/predatorctl.py etl submit --job-file my_job.json

# Check Ledger Chain
./scripts/predatorctl.py ledger verify
```

## 🧪 Chaos Engineering (Resilience)
Test if the system is truly unbreakable.
```bash
# Run generic Smoke Test
./scripts/predatorctl.py chaos run smoke

# Simulate Network Partition (Requires sudo/docker access)
./scripts/predatorctl.py chaos run network_partition
```

## 🤖 AZR (Autonomous Zone Recovery)
Manually trigger the self-healing agent loop.
```bash
./scripts/predatorctl.py azr run
```

---
**Remember Axiom 5:** "If you can't do it via CLI, it doesn't exist."
