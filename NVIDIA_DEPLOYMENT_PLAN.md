# 🚀 NVIDIA Server Deployment Plan (v56.1)

**Status:** ⏳ Awaiting Network Access  
**Your Public IP:** 185.130.54.65  
**Target Server:** 194.177.1.240:6666 (dima user)  
**SSH Key:** ~/.ssh/id_ed25519_dev or ~/.ssh/id_predator_v4

---

## 📋 Pre-Deployment Checklist

### Phase 1: Network Access (CRITICAL)
- [ ] **Option A (Recommended):** Request VPN credentials from admin
  - Provide public IP: `185.130.54.65`
  - Provide reason: "PREDATOR Analytics v56.1 backend deployment"
  
- [ ] **Option B:** Request firewall whitelist
  - Public IP: `185.130.54.65`
  - Port: `6666` (SSH)
  - Direction: Inbound to 194.177.1.240
  
- [ ] **Option C:** Establish SSH tunnel from bastion host (if available)
  ```bash
  # On accessible machine:
  ssh -R 6666:194.177.1.240:6666 your-user@your-home-ip
  ```

### Phase 2: Verify SSH Access
Once network access established:

```bash
# Test 1: Basic connectivity
ssh -v predator-server -o ConnectTimeout=5 whoami
# Expected output: dima

# Test 2: Docker availability
ssh predator-server docker --version
# Expected output: Docker version 24.0+ (or similar)

# Test 3: Service health
ssh predator-server docker ps --format "table {{.Names}}\t{{.Status}}"
# Expected output: List of running services
```

### Phase 3: Backend Configuration

```bash
# On Mac (local machine):

# 1. Backup current local config
cd /Users/dima-mac/Documents/Predator_21
cp services/core-api/.env services/core-api/.env.local.backup

# 2. Review remote config
cat services/core-api/.env.remote

# 3. Switch to remote backend
bash scripts/switch-to-remote.sh

# 4. Verify config applied
echo "API_URL set to:" && grep -i "database_url\|kafka" services/core-api/.env | head -5
```

### Phase 4: Backend Deployment

```bash
# SSH into NVIDIA server
ssh predator-server << 'REMOTE_COMMANDS'

# Navigate to deployment dir
cd /app/predator_21 || cd ~/predator_21 || mkdir -p ~/predator_21

# Clone/pull latest code (if using git)
# git pull origin main

# Create remote .env
cat > .env.server << 'ENV'
# Copy contents from services/core-api/.env.remote
ENV

# Start backend services
docker-compose -f docker-compose.prod.yml up -d

# Verify services started
docker-compose ps

# Check API health
curl -s http://localhost:8090/api/v1/health | jq .

REMOTE_COMMANDS
```

### Phase 5: Frontend Configuration

```bash
# On Mac:

# 1. Update frontend .env
cp apps/predator-analytics-ui/.env apps/predator-analytics-ui/.env.local
cp apps/predator-analytics-ui/.env.remote apps/predator-analytics-ui/.env

# 2. Verify VITE_API_URL points to remote
grep VITE_API_URL apps/predator-analytics-ui/.env

# 3. Rebuild frontend (if needed)
cd apps/predator-analytics-ui
npm run build

# 4. Verify build
ls -la dist/ | head -10
```

---

## 🔧 Configuration Details

### Backend Environment (Remote Server)

**File:** `services/core-api/.env.remote`

```ini
# Database
DATABASE_URL=postgresql+asyncpg://predator:password@194.177.1.240:5432/predator_analytics

# Cache & Queue
REDIS_URL=redis://194.177.1.240:6379/0
KAFKA_BROKERS=194.177.1.240:9092

# Graphs & Search
NEO4J_URI=bolt://194.177.1.240:7687
OPENSEARCH_URL=http://194.177.1.240:9200
QDRANT_URL=http://194.177.1.240:6333

# Storage
MINIO_ENDPOINT=194.177.1.240:9000

# AI/ML
OLLAMA_API_URL=http://194.177.1.240:11434
LITELLM_API_URL=http://194.177.1.240:8090

# Monitoring
PROMETHEUS_URL=http://194.177.1.240:9090
GRAFANA_URL=http://194.177.1.240:3000
```

### Frontend Environment (Local Mac)

**File:** `apps/predator-analytics-ui/.env.remote`

```ini
VITE_API_URL=http://194.177.1.240:8090/api/v1
VITE_V45_API_URL=http://194.177.1.240:8090/api/v45
VITE_WS_URL=ws://194.177.1.240:8090/ws
VITE_ENABLE_MOCK_API=false
```

---

## 📊 Deployment Progress Tracker

| Phase | Task | Status | Est. Time |
|-------|------|--------|-----------|
| Network | Request VPN/whitelist | ⏳ PENDING | 24-48h |
| Network | Verify SSH access | ⏳ BLOCKED | 5 min |
| Config | Review remote .env | ✅ READY | 2 min |
| Config | Switch backend config | ⏳ BLOCKED | 1 min |
| Deploy | SSH into server | ⏳ BLOCKED | 1 min |
| Deploy | Start Docker services | ⏳ BLOCKED | 3-5 min |
| Deploy | Verify health check | ⏳ BLOCKED | 1 min |
| Frontend | Update UI config | ✅ READY | 1 min |
| Frontend | Rebuild UI | ⏳ BLOCKED | 5 min |
| Verify | Test API endpoints | ⏳ BLOCKED | 5 min |

---

## 🔐 PIN Server (Port 6666) Status

**Current:** ❌ Unreachable (Firewall blocking)

### Diagnosis
```
Host: 194.177.1.240
Port: 6666
User: dima
Auth: SSH key

Result: Operation timed out
Cause: Firewall (ISP or server-side)
```

### Once Connected, Verify:
```bash
# Test 1: SSH shell access
ssh predator-server whoami
# Expected: dima

# Test 2: Remote command execution
ssh predator-server "cat /etc/os-release | head -2"
# Expected: Ubuntu 22.04 LTS (or similar)

# Test 3: Docker on remote
ssh predator-server docker ps --all
# Expected: List of containers

# Test 4: Backend health
ssh predator-server curl -s http://localhost:8090/api/v1/health
# Expected: {"status": "operational", "version": "56.1"}
```

---

## 🚨 Troubleshooting Guide

### Issue: `Operation timed out` (Port 6666)
**Cause:** Firewall blocking
**Solution:** 
1. Request VPN access
2. Or ask admin to whitelist IP 185.130.54.65
3. Or use SSH tunnel from accessible machine

### Issue: `Permission denied (publickey)`
**Cause:** Wrong SSH key
**Solution:**
```bash
# Try alternate key
ssh -i ~/.ssh/id_predator_v4 predator-server whoami

# Or specify key explicitly
SSH_KEY_PATH=~/.ssh/id_ed25519_dev ssh -i "$SSH_KEY_PATH" predator-server whoami
```

### Issue: Services won't start on NVIDIA server
**Cause:** Missing dependencies or Docker not running
**Solution:**
```bash
ssh predator-server << 'CMD'
# Check Docker
sudo systemctl status docker

# Check disk space
df -h /

# Check CPU/Memory
free -h

# View logs
docker-compose logs core-api | tail -50
CMD
```

---

## 📞 Admin Contact Info

When requesting network access, provide this template:

```
Subject: PREDATOR Analytics v56.1 - Network Access Request

Dear Admin,

I need to deploy PREDATOR Analytics backend v56.1 to the NVIDIA server.

Details:
- Deployment Machine: My MacBook Pro
- Public IP: 185.130.54.65
- Target: 194.177.1.240:6666 (SSH as user "dima")
- Preferred Access: VPN credentials OR IP whitelist
- Timeline: [Your timeline]

Please provide either:
1. VPN credentials to access 194.177.1.240 from my location
2. OR whitelist 185.130.54.65 for port 6666

Thank you!
```

---

## 🎯 Success Criteria

✅ **Deployment is successful when:**
1. `ssh predator-server whoami` returns `dima`
2. `ssh predator-server docker ps` shows running services
3. `curl -s http://194.177.1.240:8090/api/v1/health` returns health check
4. Frontend on `http://localhost:3030` shows data from remote API
5. All PREDATOR services are running:
   - PostgreSQL (5432)
   - Redis (6379)
   - Neo4j (7687)
   - OpenSearch (9200)
   - Qdrant (6333)

---

## 📅 Timeline Estimate

| Activity | Time | Notes |
|----------|------|-------|
| Network access request | 24-48h | Admin approval needed |
| SSH verification | 5 min | Once firewall opens |
| Backend config switch | 2 min | `bash scripts/switch-to-remote.sh` |
| Service deployment | 5-10 min | Docker pull + startup |
| Health checks | 5 min | Verify all endpoints |
| Frontend rebuild | 5 min | `npm run build` |
| **Total** | **~1 hour** | (After network access) |

---

## 🔗 Quick Commands Reference

```bash
# Get server status
ssh predator-server "docker ps && echo '---' && free -h && df -h"

# View backend logs
ssh predator-server "docker-compose logs -f core-api"

# Restart services
ssh predator-server "docker-compose restart"

# Execute SQL on remote
ssh predator-server "psql -h localhost -U predator -d predator_analytics -c 'SELECT version();'"

# Ping API from remote
ssh predator-server "curl -s http://localhost:8090/api/v1/health | jq"
```

---

**Ready to proceed once you establish network access!**
