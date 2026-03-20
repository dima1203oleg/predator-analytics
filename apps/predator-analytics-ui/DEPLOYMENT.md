# 🚀 PREDATOR Analytics UI - Deployment Guide v55.1.0

> Повна інструкція з розгортання фронтенду PREDATOR Analytics

---

## 📋 Зміст

1. [Швидкий старт](#швидкий-старт)
2. [Локальна розробка](#локальна-розробка)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Моніторинг та логи](#моніторинг-та-логи)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Швидкий старт

### Локальний Docker Compose (Рекомендовано)

```bash
# 1. Перейти до директорії проекту
cd /Users/dima-mac/Documents/Predator_21

# 2. Запустити фронтенд контейнер
docker-compose -f docker-compose.frontend.yml up -d

# 3. Перевірити статус
docker ps --filter "name=predator-frontend"

# 4. Відкрити в браузері
open http://localhost:3030
```

### Зупинка та очищення

```bash
# Зупинити контейнер
docker-compose -f docker-compose.frontend.yml down

# Видалити контейнер та volumes
docker-compose -f docker-compose.frontend.yml down -v

# Видалити Docker образ
docker rmi predator-analytics-ui:v55.1.0-production
```

---

## 💻 Локальна розробка

### Вимоги

- **Node.js**: 20.x (Alpine)
- **npm**: 10.x
- **Docker**: 24.x+ (опціонально)
- **Git**: 2.x

### Встановлення залежностей

```bash
cd apps/predator-analytics-ui

# Встановити залежності
npm ci

# Перевірити TypeScript
npx tsc --noEmit

# Запустити dev сервер
npm run dev
```

### Доступні команди

```bash
# Development сервер (порт 3030)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint код
npm run lint

# E2E тести (Playwright)
npx playwright test

# E2E тести з UI
npx playwright test --ui
```

---

## 🐳 Docker Deployment

### Побудова Docker образу

```bash
cd apps/predator-analytics-ui

# Development образ
docker build -t predator-analytics-ui:dev .

# Production образ
docker build -t predator-analytics-ui:v55.1.0-production .
```

### Запуск контейнера

```bash
# Запустити з Docker Compose
docker-compose -f ../../docker-compose.frontend.yml up -d

# Або запустити напряму
docker run -d \
  --name predator-frontend \
  -p 3030:3030 \
  -e API_UPSTREAM=http://host.docker.internal:9080 \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  predator-analytics-ui:v55.1.0-production
```

### Перевірка health check

```bash
# Перевірити health endpoint
curl http://localhost:3030/health

# Очікуваний результат: "healthy"
```

---

## 🏭 Production Deployment

### Вимоги для Production

- ✅ TypeScript компіляція без помилок
- ✅ Vite build успішний
- ✅ Docker multi-stage build
- ✅ Non-root user (predator UID 1001)
- ✅ Health checks налаштовані
- ✅ Nginx оптимізовано (gzip, caching)
- ✅ Terser мініфікація
- ✅ Chunk splitting для vendor бібліотек

### Production Build

```bash
cd apps/predator-analytics-ui

# 1. Встановити production залежності
npm ci --only=production

# 2. Побудувати production bundle
npm run build

# 3. Перевірити dist/ директорію
ls -lh dist/

# 4. Побудувати Docker образ
docker build -t predator-analytics-ui:v55.1.0-production .
```

### Оптимізації Production Build

#### Bundle розміри (після оптимізації)

```
index.js:          435.78 kB (gzip: 108.13 kB)
vendor-echarts:  1,017.03 kB (gzip: 275.87 kB)
vendor-three:      616.72 kB (gzip: 183.18 kB)
vendor-react:      161.77 kB (gzip:  33.48 kB)
vendor-recharts:   162.31 kB (gzip:  52.75 kB)
```

#### Налаштування Vite (vite.config.ts)

- **Terser мініфікація**: `drop_console`, `drop_debugger`
- **Chunk splitting**: vendor бібліотеки розділені
- **Sourcemaps**: вимкнено для production
- **Chunk size limit**: 1500 kB

---

## ☸️ Kubernetes Deployment

### Helm Chart

```bash
cd deploy/helm/predator

# Встановити Helm chart
helm install predator-frontend . \
  --namespace predator \
  --create-namespace \
  --set frontend.image.tag=v55.1.0-production \
  --set frontend.replicas=2 \
  --set frontend.resources.limits.memory=512Mi \
  --set frontend.resources.limits.cpu=500m
```

### ArgoCD GitOps

```bash
# Застосувати ArgoCD application
kubectl apply -f deploy/argocd/predator/frontend.yaml

# Синхронізувати
argocd app sync predator-frontend

# Перевірити статус
argocd app get predator-frontend
```

### Kubernetes Resources

#### Deployment
- **Replicas**: 2 (мінімум для HA)
- **Image**: `predator-analytics-ui:v55.1.0-production`
- **Port**: 3030
- **User**: predator (UID 1001)

#### Service
- **Type**: ClusterIP
- **Port**: 3030
- **Target Port**: 3030

#### Ingress
- **Host**: `predator.example.com`
- **TLS**: Enabled (Let's Encrypt)
- **Annotations**: nginx ingress controller

#### HPA (Horizontal Pod Autoscaler)
- **Min replicas**: 2
- **Max replicas**: 5
- **Target CPU**: 70%
- **Target Memory**: 80%

#### NetworkPolicy
- **Ingress**: Дозволено від Ingress Controller
- **Egress**: Дозволено до core-api (порт 8000)

---

## 📊 Моніторинг та логи

### Docker Logs

```bash
# Переглянути логи
docker logs predator-frontend

# Слідкувати за логами в реальному часі
docker logs -f predator-frontend

# Останні 100 рядків
docker logs --tail 100 predator-frontend
```

### Kubernetes Logs

```bash
# Логи всіх подів
kubectl logs -n predator -l app=predator-frontend

# Логи конкретного поду
kubectl logs -n predator predator-frontend-xxxxx-xxxxx

# Слідкувати за логами
kubectl logs -n predator -l app=predator-frontend -f
```

### Metrics

```bash
# Prometheus metrics (якщо налаштовано)
curl http://localhost:3030/metrics

# Docker stats
docker stats predator-frontend

# Kubernetes metrics
kubectl top pod -n predator -l app=predator-frontend
```

### Health Checks

```bash
# Health endpoint
curl http://localhost:3030/health

# Nginx status (якщо налаштовано)
curl http://localhost:3030/nginx_status
```

---

## 🔧 Troubleshooting

### Проблема: Контейнер не запускається

**Симптоми:**
```
Error: ports are not available: exposing port TCP 0.0.0.0:3030
```

**Рішення:**
```bash
# Знайти процес на порту 3030
lsof -ti:3030

# Зупинити процес
kill -9 $(lsof -ti:3030)

# Або змінити порт у docker-compose.frontend.yml
ports:
  - "3031:3030"  # Використати інший порт
```

### Проблема: Nginx помилка DNS resolver

**Симптоми:**
```
nginx: [emerg] host not found in resolver "kube-dns.kube-system.svc.cluster.local"
```

**Рішення:**
```bash
# Перевірити nginx.conf
cat apps/predator-analytics-ui/nginx.conf | grep resolver

# Має бути:
resolver 127.0.0.11 valid=30s;

# Перебудувати образ
docker build -t predator-analytics-ui:v55.1.0-production .
```

### Проблема: API запити повертають 502

**Симптоми:**
```
GET /api/v1/system/metrics HTTP/1.1" 502
```

**Рішення:**
```bash
# Це нормально, якщо backend не запущений
# Фронтенд працює автономно з mock даними

# Для повної функціональності запустити backend:
docker-compose up -d backend
```

### Проблема: TypeScript помилки компіляції

**Симптоми:**
```
error TS2307: Cannot find module '@/components/ui/Skeleton'
```

**Рішення:**
```bash
# Перевірити наявність файлу
ls -la src/components/ui/Skeleton.tsx

# Якщо відсутній, створити компонент
# Або перевірити tsconfig.json paths
```

### Проблема: Build fails з memory error

**Симптоми:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Рішення:**
```bash
# Збільшити Node.js heap memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Або в package.json
"build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
```

---

## 📚 Додаткові ресурси

### Документація
- [CHANGELOG.md](./CHANGELOG.md) - Історія змін
- [README.md](./README.md) - Загальна інформація
- [AGENTS.md](../../AGENTS.md) - Правила розробки

### Скрипти
- `deploy/scripts/deploy_docker_compose.sh` - Автоматичний deployment
- `deploy/scripts/logs.sh` - Перегляд логів
- `deploy/scripts/cleanup.sh` - Очищення

### Конфігурація
- `vite.config.ts` - Vite конфігурація
- `nginx.conf` - Nginx конфігурація
- `Dockerfile` - Multi-stage Docker build
- `docker-compose.frontend.yml` - Docker Compose конфігурація

---

## ✅ Checklist для Production Deployment

- [ ] TypeScript компіляція без помилок (`npx tsc --noEmit`)
- [ ] Vite build успішний (`npm run build`)
- [ ] E2E тести пройдені (`npx playwright test`)
- [ ] Docker образ побудований (`docker build`)
- [ ] Health checks працюють (`curl http://localhost:3030/health`)
- [ ] Nginx конфігурація валідна
- [ ] Environment variables налаштовані
- [ ] Логи доступні та читабельні
- [ ] Metrics endpoint працює (якщо налаштовано)
- [ ] SSL/TLS сертифікати налаштовані (для production)
- [ ] Backup стратегія визначена
- [ ] Rollback план готовий

---

**Версія**: v55.1.0-production  
**Дата**: 2026-03-13  
**Автор**: PREDATOR Analytics Team  
**Ліцензія**: Proprietary
