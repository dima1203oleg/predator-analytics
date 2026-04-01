# 🚀 PREDATOR Analytics UI - Deployment Guide v4.0.0

> Повна інструкція з розгортання PREDATOR Analytics v4.0 "Навігатор Прибутку"

---

## 📋 Зміст

1. [Швидкий старт](#швидкий-старт)
2. [Локальна розробка](#локальна-розробка)
3. [Docker Deployment](#docker-deployment)
4. [Production Deployment](#production-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Моніторинг та логи](#моніторинг-та-логи)
8. [Performance Optimization](#performance-optimization)
9. [Security Configuration](#security-configuration)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Швидкий старт

### Prerequisites
- Node.js 18+
- Docker 20+
- Kubernetes 1.24+

### Quick Commands
```bash
# Install dependencies
npm ci

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:unit

# Docker build
docker build -t predator-analytics-ui:v4.0.0 .

# Deploy to Kubernetes
kubectl apply -f k8s/
```

---

## 🏗️ V4.0 Production Optimizations

### Performance Features
- ✅ **Lazy Loading**: 15+ heavy components
- ✅ **Virtualization**: 10,000+ items
- ✅ **Canvas Rendering**: Graphs with 1000+ nodes
- ✅ **Bundle Splitting**: Optimized chunks
- ✅ **Service Worker**: PWA support

### Monitoring & Analytics
- ✅ **Health Checks**: `/health` endpoint
- ✅ **Performance Metrics**: Real-time monitoring
- ✅ **Error Tracking**: Comprehensive logging
- ✅ **Business KPI**: User behavior analytics
- ✅ **Memory Monitoring**: Leak detection

### Security Hardening
- ✅ **Non-root Container**: Security best practices
- ✅ **CSP Headers**: XSS protection
- ✅ **Rate Limiting**: DDoS protection
- ✅ **Input Sanitization**: XSS prevention
- ✅ **HTTPS Only**: Secure communication

---

## 🐳 Docker Deployment

### Multi-stage Build
```dockerfile
# Optimized for production
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY . .
RUN npm run build && rm -rf node_modules ~/.npm

FROM nginx:alpine AS runner
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh

# Security: non-root user
RUN addgroup -g 1001 -S predator && \
    adduser -S predator -u 1001 && \
    chown -R predator:predator /usr/share/nginx/html /var/cache/nginx /var/log/nginx

USER predator
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh || exit 1
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Production Commands
```bash
# Build optimized image
docker build -t predator-analytics-ui:v4.0.0 .

# Run with security constraints
docker run -d \
  --name predator-analytics-ui \
  -p 8080:8080 \
  -u 1001 \
  --read-only \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/run \
  -e NODE_ENV=production \
  predator-analytics-ui:v4.0.0

# Health check
curl http://localhost:8080/health
```

---

## ☸️ Kubernetes Deployment

### Production Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predator-analytics-ui
  namespace: predator-analytics
  labels:
    app: predator-analytics-ui
    version: v4.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: predator-analytics-ui
  template:
    metadata:
      labels:
        app: predator-analytics-ui
        version: v4.0.0
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: predator-analytics-ui
        image: registry.predator.analytics/predator-analytics-ui:v4.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
        env:
        - name: NODE_ENV
          value: "production"
        - name: API_BASE_URL
          value: "https://api.predator.analytics"
        - name: REACT_APP_ANALYTICS_ENDPOINT
          value: "https://analytics.predator.analytics/events"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 2
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /var/cache/nginx
      volumes:
      - name: tmp
        emptyDir: {}
      - name: cache
        emptyDir: {}
      nodeSelector:
        kubernetes.io/os: linux
      tolerations:
      - key: "dedicated"
        operator: "Equal"
        value: "predator-analytics"
        effect: "NoSchedule"
```

### Service & Ingress
```yaml
apiVersion: v1
kind: Service
metadata:
  name: predator-analytics-ui-service
  namespace: predator-analytics
spec:
  selector:
    app: predator-analytics-ui
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: predator-analytics-ui-ingress
  namespace: predator-analytics
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/ssl-protocols: "TLSv1.2 TLSv1.3"
    nginx.ingress.kubernetes.io/ssl-ciphers: "ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - predator.analytics
    secretName: predator-analytics-tls
  rules:
  - host: predator.analytics
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: predator-analytics-ui-service
            port:
              number: 80
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: PREDATOR Analytics v4.0 CI/CD

on:
  push:
    branches: [ main, develop, 'v4.0' ]
  pull_request:
    branches: [ main, develop ]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Type check
        run: npm run type-check
      - name: Lint
        run: npm run lint
      - name: Security audit
        run: npm audit --audit-level=moderate

  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Unit tests
        run: npm run test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    name: Build & Security
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - name: Build application
        run: npm run build
      - name: Security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Add deployment script here

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, test]
    if: github.ref == 'refs/heads/v4.0'
    environment: production
    steps:
      - name: Download build
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add deployment script here
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          text: 'PREDATOR Analytics v4.0 deployed to production! 🚀'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 📊 Моніторинг та логи

### Health Monitoring
```bash
# Basic health check
curl https://predator.analytics/health

# Detailed health status
curl https://predator.analytics/health/detailed

# System metrics
curl https://predator.analytics/metrics
```

### Application Logs
```bash
# View all logs
kubectl logs -f deployment/predator-analytics-ui -n predator-analytics

# View specific pod logs
kubectl logs -f pod/predator-analytics-ui-xxx -n predator-analytics

# View previous deployment logs
kubectl logs -f deployment/predator-analytics-ui -n predator-analytics --previous
```

### Performance Monitoring
```typescript
// Built-in performance monitoring
import { healthMonitor } from './utils/health-monitor';

// Get system health
const health = await healthMonitor.getSystemHealth();
console.log('System Health:', health);

// Start monitoring
healthMonitor.startMonitoring();
```

### Analytics Integration
```typescript
// User behavior tracking
import { analytics } from './utils/analytics';

// Track navigation
analytics.trackNavigationClick('intelligence', 'osint', 'analyst');

// Track business KPI
analytics.trackBusinessKPI('roi_widget_click', 1, {
  widgetType: 'roi_dashboard',
  userRole: 'analyst'
});

// Track performance
analytics.trackPerformance({
  pageLoad: 1200,
  firstContentfulPaint: 800,
  largestContentfulPaint: 1500,
  firstInputDelay: 50,
  cumulativeLayoutShift: 0.1
});
```

---

## ⚡ Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Check bundle composition
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Performance Metrics
```typescript
// Performance monitoring
import { usePerformanceLogger } from './utils/logger';

const { startTiming } = usePerformanceLogger('NavigationComponent');

// Measure render time
const timing = startTiming('render');
// ... component renders ...
timing.end({ itemCount: 1000 });
```

### Memory Management
```typescript
// Memory monitoring
import { logger } from './utils/logger';

// Track memory usage
const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
logger.logMemoryUsage('VirtualList', memoryMB, {
  itemCount: 10000,
  renderTime: 150
});
```

---

## 🔒 Security Configuration

### Content Security Policy
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.predator.analytics https://analytics.predator.analytics; frame-ancestors 'none';" always;
```

### Security Headers
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Rate Limiting
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=static:10m rate=20r/s;

server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
    
    location / {
        limit_req zone=static burst=50 nodelay;
    }
}
```

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Slow Initial Load
```bash
# Check bundle size
npm run build:analyze

# Optimize dependencies
npm audit fix
npm ci --only=production

# Check network
curl -I https://predator.analytics
```

#### 2. Memory Leaks
```bash
# Check memory usage
kubectl top pods -n predator-analytics

# Monitor memory trends
kubectl exec -it deployment/predator-analytics-ui -- node -e "console.log(JSON.stringify(process.memoryUsage()))"

# Restart deployment
kubectl rollout restart deployment/predator-analytics-ui -n predator-analytics
```

#### 3. High Error Rate
```bash
# Check recent logs
kubectl logs --since=1h deployment/predator-analytics-ui -n predator-analytics

# Check health status
curl https://predator.analytics/health/detailed

# Check metrics
kubectl port-forward svc/prometheus-server 9090:80
```

#### 4. Performance Issues
```bash
# Check performance metrics
curl https://predator.analytics/metrics

# Analyze bundle
npm run build:analyze

# Check CDN caching
curl -I https://predator.analytics/static/js/main.js
```

### Debug Mode
```bash
# Enable debug logging
kubectl set env deployment/predator-analytics-ui DEBUG=true -n predator-analytics

# Check configuration
kubectl exec -it deployment/predator-analytics-ui -- env | grep NODE_ENV

# Access pod shell
kubectl exec -it deployment/predator-analytics-ui -- /bin/sh
```

---

## 📈 Success Metrics

### Performance Targets
- ✅ **Page Load Time**: < 3s
- ✅ **Time to Interactive**: < 2s
- ✅ **First Contentful Paint**: < 1s
- ✅ **Error Rate**: < 1%
- ✅ **Uptime**: > 99.9%

### Business KPIs
- ✅ **User Engagement**: > 80%
- ✅ **Task Completion**: > 90%
- ✅ **User Satisfaction**: > 4.5/5
- ✅ **Support Tickets**: < 5/week

### Technical Metrics
- ✅ **Test Coverage**: > 85%
- ✅ **Security Score**: > 95/100
- ✅ **Accessibility Score**: > 95/100
- ✅ **Performance Score**: > 90/100

---

## 📞 Support & Monitoring

### Monitoring Dashboards
- **Grafana**: https://grafana.predator.analytics
- **Prometheus**: https://prometheus.predator.analytics
- **Logs**: https://logs.predator.analytics

### Alerting Channels
- **Slack**: #predator-analytics-alerts
- **Email**: alerts@predator.analytics
- **PagerDuty**: PREDATOR-ANALYTICS

### Documentation
- **API Docs**: https://docs.predator.analytics/api
- **Architecture**: https://docs.predator.analytics/architecture
- **User Guide**: https://docs.predator.analytics/user-guide

---

*Generated: $(date)*
*Version: 4.0.0*
*Environment: Production Ready*

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
