# Manual Deployment Guide for Predator v26 (Nezlamnist)

This guide provides step-by-step instructions to deploy the Constitutionally-Bound Predator Analytics v26 system.

## 📦 Components Included
- **predatorctl**: Command-line control plane with real-time Dashboard & Chaos engine.
- **google-agentctl**: Integrative runtime assistant (Proposal generation).
- **Arbiter Service**: Enforces constitutional axioms (Port 8091).
- **Truth Ledger Service**: Cryptographically verified audit log (Port 8092).
- **Orchestrator**: Sovereign AI Agent that obeys the Arbiter.

## 🚀 Deployment Steps

### 1. Upload Payload
Transfer the deployment package to your server:
```bash
scp -P 6666 predator_v26_release.tar.gz dima@194.177.1.240:~/predator-analytics/
```

### 2. Connect to Server
```bash
ssh -p 6666 dima@194.177.1.240
```

### 3. Install & Update
Inside the server:
```bash
cd ~/predator-analytics
tar -xzf predator_v26_release.tar.gz

# 1. Update Python Tools
source .venv/bin/activate
pip install -e predatorctl
pip install -e google_agentctl

# 2. Re-launch Services (Build new images)
docker compose down arbiter truth-ledger orchestrator
docker compose up -d --build arbiter truth-ledger orchestrator
```

### 4. Verify Sovereignty
Run the new live dashboard:
```bash
predatorctl system status
```
*Expected: All components 'healthy'.*

Run a chaos test to prove the constitution works:
```bash
predatorctl chaos run etl_truth
```
*Expected: SUCCESSS (Arbiter BLOCKED the violation).*

### 5. AI Autonomy
The Orchestrator will now automatically consult the Arbiter before running code.
Monitor its decisions:
```bash
docker compose logs -f arbiter
```
