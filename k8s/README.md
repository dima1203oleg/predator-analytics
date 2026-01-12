# Kubernetes Deployment - Predator Analytics v25.0

## 📋 Огляд

Повна Kubernetes конфігурація для розгортання Predator Analytics платформи.

## 📁 Структура файлів

```
k8s/
├── namespace.yaml          # Namespace з resource quotas
├── secrets.yaml            # Credentials для всіх сервісів
├── configmaps.yaml         # Конфігурації backend, frontend, nginx
├── storage.yaml            # StorageClass та PVCs
├── postgres.yaml           # PostgreSQL StatefulSet
├── redis.yaml              # Redis Deployment
├── opensearch.yaml         # OpenSearch StatefulSet + Dashboards
├── qdrant.yaml             # Qdrant vector DB
├── minio.yaml              # MinIO object storage
├── keycloak.yaml           # Keycloak auth
├── backend.yaml            # FastAPI backend + HPA + PDB
├── celery.yaml             # Celery worker + beat
├── frontend.yaml           # React frontend + HPA
├── monitoring.yaml         # Grafana + Prometheus
├── ml-services.yaml        # MLflow + Ollama
├── jobs.yaml               # CronJobs для backup
├── ingress.yaml            # Nginx Ingress + NetworkPolicy
├── kustomization.yaml      # Kustomize configuration
├── values-production.yaml  # Helm values for production
└── deploy.sh               # Deployment script
```

## 🚀 Швидкий старт

### Передумови

- Kubernetes cluster (K8s 1.25+ / K3s)
- kubectl налаштований
- Helm 3.x (опціонально)
- Ingress Controller (nginx-ingress)
- cert-manager (для TLS)

### Розгортання

```bash
# 1. Клонуйте репозиторій
git clone https://github.com/your-org/predator-analytics.git
cd predator-analytics

# 2. Оновіть secrets
vim k8s/secrets.yaml  # Замініть паролі та API ключі

# 3. Запустіть deploy скрипт
./k8s/deploy.sh predator-analytics production

# Або використовуйте kustomize
kubectl apply -k k8s/
```

## 📦 Компоненти

### Data Layer
| Сервіс | Image | Port | Опис |
|--------|-------|------|------|
| PostgreSQL | postgres:15-alpine | 5432 | Основна БД |
| Redis | redis:7-alpine | 6379 | Cache + Queue |
| OpenSearch | opensearch:2.11.0 | 9200 | Повнотекстовий пошук |
| Qdrant | qdrant/qdrant:latest | 6333 | Векторна БД |
| MinIO | minio/minio:latest | 9000 | Object Storage |

### Application Layer
| Сервіс | Replicas | Port | Опис |
|--------|----------|------|------|
| Backend | 3 (HPA: 2-10) | 8000 | FastAPI API |
| Frontend | 2 (HPA: 2-6) | 80 | React UI |
| Celery Worker | 2 (HPA: 1-8) | - | Background tasks |
| Celery Beat | 1 | - | Scheduler |

### Observability
| Сервіс | Port | Опис |
|--------|------|------|
| Grafana | 3000 | Dashboards |
| Prometheus | 9090 | Metrics |
| MLflow | 5000 | ML tracking |

## 🔐 Secrets Management

**Важливо!** Перед деплоєм змініть паролі в `secrets.yaml`:

```yaml
# Згенеруйте безпечні паролі
openssl rand -base64 32  # для POSTGRES_PASSWORD
openssl rand -base64 32  # для MINIO_ROOT_PASSWORD
```

Для production рекомендується використовувати:
- HashiCorp Vault
- External Secrets Operator
- Sealed Secrets

## 🌐 Ingress

Налаштуйте DNS записи:

| Домен | Сервіс |
|-------|--------|
| predator.analytics.local | Frontend + API |
| api.predator.analytics.local | Backend API |
| grafana.predator.analytics.local | Grafana |
| opensearch.predator.analytics.local | OpenSearch Dashboards |
| minio.predator.analytics.local | MinIO Console |
| keycloak.predator.analytics.local | Keycloak Admin |

```bash
# Для локального тестування додайте в /etc/hosts
127.0.0.1 predator.analytics.local api.predator.analytics.local grafana.predator.analytics.local
```

## 📊 Scaling

```bash
# Manual scaling
kubectl scale deployment/backend --replicas=5 -n predator-analytics

# View HPA status
kubectl get hpa -n predator-analytics

# Autoscaling налаштовано для:
# - Backend: 70% CPU → scale up
# - Frontend: 70% CPU → scale up
# - Celery: 75% CPU → scale up
```

## 🔄 Updates

```bash
# Rolling update
kubectl set image deployment/backend backend=predator/ua-sources:v25.1 -n predator-analytics

# Check rollout status
kubectl rollout status deployment/backend -n predator-analytics

# Rollback if needed
kubectl rollout undo deployment/backend -n predator-analytics
```

## 📈 Monitoring

### Перевірка здоров'я

```bash
# Pod status
kubectl get pods -n predator-analytics

# Events
kubectl get events -n predator-analytics --sort-by='.lastTimestamp'

# Logs
kubectl logs -f deployment/backend -n predator-analytics
kubectl logs -f deployment/celery-worker -n predator-analytics

# Resource usage
kubectl top pods -n predator-analytics
kubectl top nodes
```

### Grafana Dashboards

Доступні за адресою: `http://grafana.predator.analytics.local`

- **System Overview**: CPU, Memory, Network
- **API Metrics**: Request rate, Latency, Errors
- **Search Performance**: OpenSearch queries
- **ML Models**: Inference time, Model versions

## 🛡️ Security

### Network Policies

Увімкнено NetworkPolicy для ізоляції трафіку:
- Backend може з'єднуватись тільки з БД та cache
- Frontend може з'єднуватись тільки з Backend
- External traffic через Ingress

### Pod Security

```yaml
# Рекомендовані налаштування
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  capabilities:
    drop: ["ALL"]
```

## 🔧 Troubleshooting

### Pod не стартує

```bash
# Перевірте events
kubectl describe pod <pod-name> -n predator-analytics

# Перевірте logs
kubectl logs <pod-name> -n predator-analytics --previous
```

### Database connection issues

```bash
# Port-forward для доступу
kubectl port-forward svc/postgres 5432:5432 -n predator-analytics

# Перевірте з'єднання
psql -h localhost -U predator -d predator_db
```

### OpenSearch issues

```bash
# Перевірте cluster health
kubectl exec -it opensearch-0 -n predator-analytics -- curl localhost:9200/_cluster/health?pretty

# Перевірте indices
kubectl exec -it opensearch-0 -n predator-analytics -- curl localhost:9200/_cat/indices?v
```

## 📋 Maintenance

### Backup

Автоматичний backup налаштовано через CronJob:
- База даних: щодня о 2:00 AM
- Ретенція: 7 днів

```bash
# Manual backup
kubectl create job --from=cronjob/database-backup manual-backup-$(date +%Y%m%d) -n predator-analytics
```

### Cleanup

```bash
# Видалення старих pods
kubectl delete pod --field-selector=status.phase==Succeeded -n predator-analytics

# Очищення PVCs
kubectl delete pvc <pvc-name> -n predator-analytics

# Повне видалення
kubectl delete namespace predator-analytics
```

## 🔗 Корисні команди

```bash
# Exec в pod
kubectl exec -it deployment/backend -n predator-analytics -- bash

# Port forwarding
kubectl port-forward svc/backend 8000:8000 -n predator-analytics
kubectl port-forward svc/grafana 3000:3000 -n predator-analytics

# Copy files
kubectl cp local-file.txt predator-analytics/backend-xxx:/app/

# Secret decoding
kubectl get secret predator-db-credentials -n predator-analytics -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

---

**Ready for production deployment!** 🚀
