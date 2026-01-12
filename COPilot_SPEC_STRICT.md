# Predator Analytics v25.0 - Copilot STRICT Specification

## MANDATORY RULES

### 1. NO localhost in production
- FORBIDDEN: `localhost`, `127.0.0.1` for external access
- REQUIRED: `0.0.0.0` for service binding
- REQUIRED: Static IP or Domain for public access

### 2. Service URLs MUST be configurable
```yaml
# CORRECT
FRONTEND_URL=https://predator.analytics.local
API_BASE_URL=https://predator.analytics.local/api
OPENSEARCH_URL=http://opensearch:9200
QDRANT_URL=http://qdrant:6333
MLFLOW_URL=http://mlflow:5000

# FORBIDDEN
http://localhost:3000
http://127.0.0.1:8000
```

### 3. Container binding rules
```yaml
# CORRECT
HOST=0.0.0.0
PORT=8000

# FORBIDDEN
HOST=localhost
HOST=127.0.0.1
```

## ARCHITECTURE

### Core Components
- Frontend: React + Vite (port 3000)
- Backend: FastAPI (port 8000)
- Database: PostgreSQL (port 5432)
- Cache: Redis (port 6379)
- Search: OpenSearch (port 9200)
- Vector: Qdrant (port 6333)
- MLOps: MLflow (port 5000)
- Proxy: Nginx (ports 80/443)

### Network Topology
```
Internet → Nginx (LoadBalancer) → Services
         → Frontend (ClusterIP)
         → Backend (ClusterIP)
         → Grafana (ClusterIP)
```

## DEPLOYMENT PATTERNS

### Kubernetes (Production)
```bash
# Deploy
helm install predator-analytics ./helm/predator-analytics \
  --values helm/predator-analytics/values-production.yaml \
  --namespace predator-analytics \
  --create-namespace

# URLs
Frontend: https://predator.analytics.local
API: https://api.predator.analytics.local
Grafana: https://grafana.predator.analytics.local
```

### Docker Compose (Development)
```bash
# Production mode
docker-compose -f docker-compose.prod.yml up -d

# URLs
Frontend: https://predator.analytics.local
API: http://predator.analytics.local/api
```

## ENVIRONMENT VARIABLES

### Required for ALL deployments
```bash
# Static IP/Domain
SERVER_IP=192.168.1.100
DOMAIN=predator.analytics.local

# Service URLs
FRONTEND_URL=https://predator.analytics.local
API_BASE_URL=https://predator.analytics.local/api
OPENSEARCH_URL=http://opensearch:9200
QDRANT_URL=http://qdrant:6333
MLFLOW_URL=http://mlflow:5000
REDIS_URL=redis://redis:6379/0

# Security
JWT_SECRET_KEY=your-secret-key
CORS_ORIGINS=https://predator.analytics.local
```

## CODE PATTERNS

### FastAPI Backend
```python
# CORRECT
app = FastAPI()
uvicorn.run(app, host="0.0.0.0", port=8000)

# FORBIDDEN
uvicorn.run(app, host="localhost", port=8000)
```

### Frontend Configuration
```javascript
// CORRECT
const API_BASE = process.env.VITE_API_URL || 'https://predator.analytics.local/api';

// FORBIDDEN
const API_BASE = 'http://localhost:8000';
```

### Dockerfile
```dockerfile
# CORRECT
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# FORBIDDEN
CMD ["uvicorn", "app.main:app", "--host", "localhost", "--port", "8000"]
```

## VALIDATION CHECKLIST

### Pre-deployment
- [ ] No `localhost` in environment variables
- [ ] All services bind to `0.0.0.0`
- [ ] Static IP/Domain configured
- [ ] SSL certificates configured
- [ ] Health checks implemented

### Post-deployment
- [ ] Frontend accessible via domain
- [ ] API responding to external requests
- [ ] Monitoring dashboards accessible
- [ ] Autoscaling enabled
- [ ] SSL working

## COPilot ACTIONS REQUIRED

### When seeing localhost
1. Replace with `0.0.0.0` for service binding
2. Replace with Static IP/Domain for external access
3. Add environment variable for configuration

### When creating services
1. Use `0.0.0.0` binding
2. Add health checks
3. Configure external access
4. Add monitoring

### When configuring networking
1. Use ClusterIP for internal services
2. Use LoadBalancer for external access
3. Configure Ingress for HTTPS
4. Add SSL certificates

## EMERGENCY RULES

### If localhost detected in production
```bash
# IMMEDIATE ACTION
sed -i 's/localhost/0.0.0.0/g' config.yaml
sed -i 's/127.0.0.1/0.0.0.0/g' config.yaml
```

### If service not accessible externally
```bash
# CHECK BINDING
kubectl logs deployment/predator-backend | grep "host="
# SHOULD SHOW: host=0.0.0.0
```

## FINAL VALIDATION

### System is READY when:
1. All services bind to `0.0.0.0`
2. No `localhost` in configuration
3. External access via Static IP/Domain works
4. SSL certificates valid
5. Monitoring operational

### Copilot MUST reject:
- Any `localhost` reference in production code
- Services binding to `127.0.0.1`
- Hardcoded URLs without environment variables
- Missing health checks
- No external access configuration

## QUICK DEPLOYMENT COMMANDS

```bash
# 1. Set Static IP (PRODUCTION SERVER)
export SERVER_IP="194.177.1.240"
export DOMAIN="predator.analytics.local"

# 2. Deploy to Kubernetes
helm upgrade --install predator-analytics ./helm/predator-analytics \
  --values helm/predator-analytics/values-production.yaml \
  --namespace predator-analytics \
  --create-namespace \
  --set global.staticIP=$SERVER_IP \
  --set global.domain=$DOMAIN

# 3. Verify deployment
kubectl get pods -n predator-analytics
kubectl get ingress -n predator-analytics

# 4. Access services
echo "Frontend: https://$DOMAIN"
echo "API: https://api.$DOMAIN"
echo "Grafana: https://grafana.$DOMAIN"
```

## END OF STRICT SPECIFICATION

Copilot MUST follow these rules EXACTLY. No exceptions.
