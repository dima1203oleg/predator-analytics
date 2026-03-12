# 🚀 Локальне розгортання фронтенду PREDATOR Analytics v55

Цей документ описує як розгорнути фронтенд локально у k3s кластері з автоматичною синхронізацією та перезапуском.

## 📋 Передумови

- **k3d** (k3s in Docker) — встановлено
- **kubectl** — встановлено
- **Docker** — встановлено
- **Helm 3** — встановлено
- **git** — встановлено

### Встановлення інструментів (macOS)

```bash
# k3d
brew install k3d

# kubectl
brew install kubectl

# Helm
brew install helm

# Docker Desktop (якщо не встановлено)
brew install --cask docker
```

## 🎯 Швидкий старт (3 кроки)

### 1️⃣ Створити k3d кластер та встановити ArgoCD

```bash
cd /Users/dima-mac/Documents/Predator_21/deploy/scripts
./deploy_local_k3d.sh
```

Цей скрипт:
- ✅ Створює k3d кластер `predator-local`
- ✅ Встановлює ArgoCD
- ✅ Застосовує ArgoCD Application manifests
- ✅ Виводить інструкції доступу

**Очікуваний час:** 3-5 хвилин

### 2️⃣ Синхронізувати фронтенд локально

```bash
./sync_frontend_local.sh
```

Цей скрипт:
- ✅ Будує Docker образ фронтенду локально
- ✅ Завантажує образ у k3d кластер
- ✅ Розгортає фронтенд через Helm
- ✅ Чекає готовності deployment

**Очікуваний час:** 2-3 хвилини

### 3️⃣ Отримати доступ до фронтенду

```bash
# Фронтенд буде доступний за адресою:
http://localhost:3030
```

## 🔄 Автоматичний перезапуск при зупинці/запуску контейнера

### Сценарій 1: Зупинити та запустити k3d кластер

```bash
# Зупинити кластер
k3d cluster stop predator-local

# Запустити кластер (фронтенд автоматично перезапуститься)
k3d cluster start predator-local

# Перевірити статус
kubectl get pods -n predator -l app=frontend
```

### Сценарій 2: Перезапустити тільки фронтенд

```bash
./restart_frontend_local.sh
```

Цей скрипт:
- ✅ Видаляє поточні frontend pods
- ✅ Kubernetes автоматично створює нові pods
- ✅ Чекає готовності deployment

## 📊 Моніторинг та налагодження

### Переглянути статус фронтенду

```bash
# Список pods
kubectl get pods -n predator -l app=frontend

# Детальна інформація
kubectl describe pod -n predator -l app=frontend

# Логи фронтенду
kubectl logs -n predator -l app=frontend -f

# Спостерігати за змінами в реальному часі
./watch_frontend.sh
```

### Доступ до ArgoCD UI

```bash
# Port-forward ArgoCD
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Відкрити в браузері
https://localhost:8080

# Отримати пароль
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d && echo
```

## 🔧 Конфігурація

### Helm Values для локального розгортання

Основні параметри у `deploy/helm/predator/values.yaml`:

```yaml
frontend:
  enabled: true
  replicaCount: 2
  image:
    repository: ghcr.io/dima1203oleg/predator-analytics-ui
    tag: v55.0.0
  service:
    type: LoadBalancer
    port: 80
    targetPort: 3030
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
```

### Змінити кількість реплік

```bash
kubectl scale deployment predator-frontend -n predator --replicas=3
```

### Переглянути ресурси

```bash
kubectl top pods -n predator -l app=frontend
kubectl top nodes
```

## 🐳 Docker образ

### Локальна побудова образу

```bash
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui

# Побудувати образ
docker build -t predator-analytics-ui:local .

# Завантажити у k3d
k3d image import predator-analytics-ui:local -c predator-local
```

### Використання образу з GHCR

```bash
# Образ автоматично завантажується з GitHub Container Registry
# при розгортанні через Helm
```

## 🔐 Безпека

### Non-root User (HR-05)

Dockerfile використовує non-root користувача `predator` (UID: 1001):

```dockerfile
RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001
USER predator
```

### Security Context у Kubernetes

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
```

## 📈 Масштабування

### Автоматичне масштабування (HPA)

```bash
# Переглянути HPA статус
kubectl get hpa -n predator

# Переглянути метрики
kubectl top pods -n predator -l app=frontend
```

### Ручне масштабування

```bash
# Збільшити до 5 реплік
kubectl scale deployment predator-frontend -n predator --replicas=5

# Зменшити до 1 реплік
kubectl scale deployment predator-frontend -n predator --replicas=1
```

## 🗑️ Очищення

### Видалити фронтенд deployment

```bash
kubectl delete deployment predator-frontend -n predator
```

### Видалити весь predator namespace

```bash
kubectl delete namespace predator
```

### Видалити k3d кластер

```bash
k3d cluster delete predator-local
```

## 🔗 GitOps та ArgoCD

### Автоматична синхронізація

ArgoCD автоматично синхронізує фронтенд при змінах у Git:

```bash
# Переглянути статус синхронізації
kubectl get application -n argocd

# Примусова синхронізація
argocd app sync predator-frontend
```

### GitHub Actions CI/CD

При push до `main` гілки:

1. ✅ Будується Docker образ
2. ✅ Образ завантажується до GHCR
3. ✅ ArgoCD автоматично синхронізує deployment

## 📝 Логи та діагностика

### Переглянути логи nginx

```bash
kubectl logs -n predator -l app=frontend -c frontend --tail=100
```

### Перевірити health checks

```bash
# Liveness probe
kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].status.conditions[?(@.type=="Ready")]}'

# Readiness probe
kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].status.containerStatuses[0].ready}'
```

### Отримати shell доступ до контейнера

```bash
kubectl exec -it -n predator $(kubectl get pod -n predator -l app=frontend -o jsonpath='{.items[0].metadata.name}') -- sh
```

## 🆘 Розв'язання проблем

### Фронтенд не доступний

```bash
# Перевірити pods
kubectl get pods -n predator -l app=frontend

# Перевірити service
kubectl get svc -n predator -l app=frontend

# Перевірити логи
kubectl logs -n predator -l app=frontend -f
```

### Образ не завантажується

```bash
# Перевірити образ у k3d
k3d image list

# Перевірити pull policy
kubectl get deployment predator-frontend -n predator -o jsonpath='{.spec.template.spec.containers[0].imagePullPolicy}'
```

### ArgoCD не синхронізує

```bash
# Перевірити Application статус
kubectl get application -n argocd predator-frontend

# Переглянути детальну інформацію
kubectl describe application -n argocd predator-frontend

# Переглянути ArgoCD логи
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f
```

## 📚 Корисні команди

```bash
# Переглянути весь стан кластера
kubectl get all -n predator

# Переглянути Helm releases
helm list -n predator

# Перевірити Helm values
helm get values predator -n predator

# Оновити Helm deployment
helm upgrade predator deploy/helm/predator -n predator

# Видалити Helm release
helm uninstall predator -n predator
```

## 🎓 Додаткова інформація

- **Dockerfile**: `apps/predator-analytics-ui/Dockerfile`
- **Helm Chart**: `deploy/helm/predator/`
- **ArgoCD Manifests**: `deploy/argocd/predator/`
- **Скрипти**: `deploy/scripts/`
- **GitHub Actions**: `.github/workflows/frontend-ci-cd.yml`

---

**Версія**: v55.0.0  
**Останнє оновлення**: 2026-03-12  
**Автор**: PREDATOR Analytics Team
