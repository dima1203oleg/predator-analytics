# ⚙️ DevOps Конфігурації — Predator Analytics v25.0

> GitOps, ArgoCD, GitHub Actions та Kubernetes конфігурації

---

## Зміст

1. [Огляд CI/CD Пайплайну](#огляд-cicd-пайплайну)
2. [GitHub Actions](#github-actions)
3. [ArgoCD GitOps](#argocd-gitops)
4. [Kubernetes Operators](#kubernetes-operators)
5. [Docker Конфігурації](#docker-конфігурації)
6. [Helm Charts](#helm-charts)
7. [Моніторинг та Алертинг](#моніторинг-та-алертинг)
8. [Secrets Management](#secrets-management)

---

## Огляд CI/CD Пайплайну

### Архітектура пайплайну

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │   Git    │───▶│  GitHub  │───▶│  Build   │───▶│  Push    │───▶│ ArgoCD │ │
│  │   Push   │    │  Actions │    │  Docker  │    │ Registry │    │  Sync  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│       │              │               │               │               │      │
│       │        ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐│
│       │        │   Lint    │   │   Test    │   │   Scan    │   │   Deploy  ││
│       │        │   Check   │   │   Suite   │   │  Security │   │    K8s    ││
│       │        └───────────┘   └───────────┘   └───────────┘   └───────────┘│
│       │                                                              │      │
│       └──────────────────────────────────────────────────────────────┘      │
│                              Feedback Loop                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Принципи

| Принцип | Реалізація |
|---------|------------|
| **GitOps** | Інфраструктура як код в Git |
| **Immutable** | Docker образи незмінні |
| **Declarative** | Бажаний стан описаний в YAML |
| **Self-Healing** | ArgoCD автоматично синхронізує |
| **Observable** | Всі етапи мають логи та метрики |

---

## GitHub Actions

### Структура Workflows

```
.github/workflows/
├── ci.yml                    # Основний CI (lint, test)
├── ci-cd-pipeline.yml        # Повний пайплайн
├── deploy-argocd.yml         # Деплой через ArgoCD
├── deploy-nvidia.yml         # Деплой на NVIDIA сервер
├── build-nvidia.yml          # Збірка для NVIDIA
├── nightly-rerun.yml         # Нічні тести
├── rollback.yml              # Ручний rollback
└── chaos-tests.yml           # Хаос тестування
```

### Основний CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PYTHON_VERSION: "3.12"
  NODE_VERSION: "20"

jobs:
  # Lint перевірки
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install ruff
        run: pip install ruff

      - name: Lint Python
        run: ruff check services/api-gateway/app/

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Lint TypeScript
        run: |
          cd apps/predator-analytics-ui
          npm ci
          npm run lint

  # Unit тести
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: pip

      - name: Install dependencies
        run: |
          cd services/api-gateway
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
        run: |
          cd services/api-gateway
          pytest tests/ -v --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./services/api-gateway/coverage.xml

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
          cache-dependency-path: apps/predator-analytics-ui/package-lock.json

      - name: Install dependencies
        run: |
          cd apps/predator-analytics-ui
          npm ci

      - name: Run tests
        run: |
          cd apps/predator-analytics-ui
          npm test -- --coverage

      - name: Build check
        run: |
          cd apps/predator-analytics-ui
          npm run build
```

### Build та Deploy Workflow

```yaml
# .github/workflows/ci-cd-pipeline.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

env:
  REGISTRY: ghcr.io
  IMAGE_NAME_BACKEND: ${{ github.repository }}/backend
  IMAGE_NAME_FRONTEND: ${{ github.repository }}/frontend

jobs:
  test:
    uses: ./.github/workflows/ci.yml

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push Backend
        uses: docker/build-push-action@v5
        with:
          context: .
          file: services/api-gateway/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./apps/predator-analytics-ui
          file: ./apps/predator-analytics-ui/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_FRONTEND }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  security-scan:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME_BACKEND }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: [build, security-scan]
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment || 'staging' }}

    steps:
      - uses: actions/checkout@v4

      - name: Update Helm values
        run: |
          cd helm/predator
          yq -i '.image.backend.tag = "${{ github.sha }}"' values.yaml
          yq -i '.image.frontend.tag = "${{ github.sha }}"' values.yaml

      - name: Commit and push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add helm/predator/values.yaml
          git commit -m "chore: deploy ${{ github.sha }} to ${{ inputs.environment || 'staging' }}"
          git push

      - name: Trigger ArgoCD Sync
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.ARGOCD_TOKEN }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.ARGOCD_SERVER }}/api/v1/applications/predator-analytics/sync"
```

### Rollback Workflow

```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      revision:
        description: 'Target revision (commit SHA or -1 for previous)'
        required: true
        default: '-1'
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Install ArgoCD CLI
        run: |
          curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
          chmod +x argocd
          sudo mv argocd /usr/local/bin/

      - name: Rollback via ArgoCD
        env:
          ARGOCD_SERVER: ${{ secrets.ARGOCD_SERVER }}
          ARGOCD_AUTH_TOKEN: ${{ secrets.ARGOCD_TOKEN }}
        run: |
          argocd app rollback predator-analytics ${{ inputs.revision }} \
            --grpc-web

      - name: Notify on Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            🔄 Rollback performed
            Revision: ${{ inputs.revision }}
            Reason: ${{ inputs.reason }}
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## ArgoCD GitOps

### Application Manifest

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-analytics
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default

  source:
    repoURL: https://github.com/org/predator-21
    targetRevision: main
    path: helm/predator
    helm:
      valueFiles:
        - values.yaml
        - values-production.yaml
      parameters:
        - name: global.environment
          value: production

  destination:
    server: https://kubernetes.default.svc
    namespace: predator

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false

    syncOptions:
      - CreateNamespace=true
      - PruneLast=true
      - ApplyOutOfSyncOnly=true
      - Validate=true

    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas  # Ігнорувати якщо HPA змінює
```

### Multi-Environment Setup

```yaml
# argocd/predator-nvidia.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-nvidia
  namespace: argocd
spec:
  project: predator-project
  source:
    repoURL: https://github.com/org/predator-21
    targetRevision: main
    path: helm/predator
    helm:
      valueFiles:
        - values.yaml
        - values-nvidia.yaml
  destination:
    server: https://nvidia-cluster.example.com
    namespace: predator
  syncPolicy:
    automated:
      selfHeal: true

---
# argocd/predator-oracle.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-oracle
  namespace: argocd
spec:
  project: predator-project
  source:
    repoURL: https://github.com/org/predator-21
    targetRevision: main
    path: helm/predator
    helm:
      valueFiles:
        - values.yaml
        - values-oracle.yaml
  destination:
    server: https://oracle-cluster.example.com
    namespace: predator
  syncPolicy:
    automated:
      selfHeal: true
```

### ArgoCD Project

```yaml
# argocd/project.yaml
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: predator-project
  namespace: argocd
spec:
  description: Predator Analytics Project

  sourceRepos:
    - 'https://github.com/org/predator-21'
    - 'https://charts.bitnami.com/bitnami'

  destinations:
    - namespace: predator
      server: '*'
    - namespace: monitoring
      server: '*'

  clusterResourceWhitelist:
    - group: ''
      kind: Namespace
    - group: 'networking.k8s.io'
      kind: Ingress

  namespaceResourceBlacklist:
    - group: ''
      kind: ResourceQuota

  roles:
    - name: developer
      description: Developer role
      policies:
        - p, proj:predator-project:developer, applications, get, predator-project/*, allow
        - p, proj:predator-project:developer, applications, sync, predator-project/*, allow
      groups:
        - developers

    - name: admin
      description: Admin role
      policies:
        - p, proj:predator-project:admin, applications, *, predator-project/*, allow
      groups:
        - admins
```

---

## Kubernetes Operators

### Auto-Remediation Operator

```python
# operators/auto_remediation/main.py
import kopf
import kubernetes
import logging

logger = logging.getLogger(__name__)

@kopf.on.startup()
def configure(settings: kopf.OperatorSettings, **_):
    settings.posting.level = logging.WARNING
    settings.watching.server_timeout = 120

@kopf.on.event('v1', 'pods', labels={'app.kubernetes.io/part-of': 'predator'})
async def handle_pod_event(event, logger, **kwargs):
    """Обробка подій подів"""
    pod = event['object']
    pod_name = pod['metadata']['name']
    namespace = pod['metadata']['namespace']

    if event['type'] == 'DELETED':
        logger.info(f"Pod {pod_name} deleted")
        return

    await check_pod_health(pod, namespace, logger)

async def check_pod_health(pod: dict, namespace: str, logger):
    """Перевірка здоров'я пода та auto-remediation"""
    pod_name = pod['metadata']['name']

    for status in pod.get('status', {}).get('containerStatuses', []):
        # Перевірка OOMKilled
        terminated = status.get('lastState', {}).get('terminated', {})
        if terminated.get('reason') == 'OOMKilled':
            logger.warning(f"Pod {pod_name} was OOMKilled")
            await handle_oom_kill(pod, namespace, logger)
            return

        # Перевірка CrashLoopBackOff
        waiting = status.get('state', {}).get('waiting', {})
        if waiting.get('reason') == 'CrashLoopBackOff':
            restart_count = status.get('restartCount', 0)
            if restart_count > 5:
                logger.error(f"Pod {pod_name} in CrashLoop with {restart_count} restarts")
                await handle_crash_loop(pod, namespace, logger)
                return

async def handle_oom_kill(pod: dict, namespace: str, logger):
    """Обробка OOMKill - збільшення ліміту пам'яті"""
    deployment_name = pod['metadata'].get('labels', {}).get('app')
    if not deployment_name:
        return

    # Отримати поточний deployment
    apps_v1 = kubernetes.client.AppsV1Api()
    deployment = apps_v1.read_namespaced_deployment(deployment_name, namespace)

    # Отримати поточний ліміт
    container = deployment.spec.template.spec.containers[0]
    current_limit = container.resources.limits.get('memory', '1Gi')

    # Обчислити новий ліміт (+50%)
    new_limit = increase_memory(current_limit, 1.5)
    logger.info(f"Increasing memory for {deployment_name}: {current_limit} -> {new_limit}")

    # Оновити deployment
    container.resources.limits['memory'] = new_limit
    apps_v1.patch_namespaced_deployment(
        deployment_name,
        namespace,
        deployment
    )

    # Створити event
    await create_event(namespace, deployment_name,
                       f"Auto-increased memory limit to {new_limit} due to OOMKill")

async def handle_crash_loop(pod: dict, namespace: str, logger):
    """Обробка CrashLoop - rollback через ArgoCD"""
    import aiohttp

    argocd_url = "http://argocd-server.argocd:80"
    app_name = "predator-analytics"

    async with aiohttp.ClientSession() as session:
        # Rollback до попередньої версії
        async with session.post(
            f"{argocd_url}/api/v1/applications/{app_name}/rollback",
            json={"revision": -1},
            headers={"Authorization": f"Bearer {get_argocd_token()}"}
        ) as resp:
            if resp.status == 200:
                logger.info(f"Rollback initiated for {app_name}")
            else:
                logger.error(f"Rollback failed: {await resp.text()}")

def increase_memory(current: str, factor: float) -> str:
    """Збільшити значення пам'яті"""
    import re
    match = re.match(r'(\d+)(\w+)', current)
    if match:
        value = int(match.group(1))
        unit = match.group(2)
        new_value = int(value * factor)
        return f"{new_value}{unit}"
    return current

async def create_event(namespace: str, name: str, message: str):
    """Створити Kubernetes Event"""
    v1 = kubernetes.client.CoreV1Api()
    event = kubernetes.client.CoreV1Event(
        metadata=kubernetes.client.V1ObjectMeta(
            name=f"{name}-remediation-{int(time.time())}",
            namespace=namespace
        ),
        reason="AutoRemediation",
        message=message,
        type="Normal",
        involved_object=kubernetes.client.V1ObjectReference(
            kind="Deployment",
            namespace=namespace,
            name=name
        )
    )
    v1.create_namespaced_event(namespace, event)
```

### Operator Deployment

```yaml
# operators/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: predator-operator
  namespace: predator-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: predator-operator
  template:
    metadata:
      labels:
        app: predator-operator
    spec:
      serviceAccountName: predator-operator
      containers:
        - name: operator
          image: ghcr.io/org/predator-operator:latest
          resources:
            limits:
              memory: 256Mi
              cpu: 200m
          env:
            - name: ARGOCD_TOKEN
              valueFrom:
                secretKeyRef:
                  name: argocd-credentials
                  key: token

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: predator-operator
  namespace: predator-system

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: predator-operator
rules:
  - apiGroups: [""]
    resources: ["pods", "events"]
    verbs: ["get", "list", "watch", "create"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "patch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: predator-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: predator-operator
subjects:
  - kind: ServiceAccount
    name: predator-operator
    namespace: predator-system
```

---

## Docker Конфігурації

### Backend Dockerfile

```dockerfile
# services/api-gateway/Dockerfile
FROM python:3.12-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies stage
FROM base as deps
COPY services/api-gateway/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM base as production
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

# Copy application
COPY services/api-gateway/app ./app
COPY libs ./libs

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# apps/predator-analytics-ui/Dockerfile
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine as production

# Copy build
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security headers
RUN echo 'add_header X-Frame-Options "SAMEORIGIN" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-Content-Type-Options "nosniff" always;' >> /etc/nginx/conf.d/security.conf && \
    echo 'add_header X-XSS-Protection "1; mode=block" always;' >> /etc/nginx/conf.d/security.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

---

## Helm Charts

### Chart Structure

```
helm/predator/
├── Chart.yaml
├── values.yaml
├── values-production.yaml
├── values-nvidia.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── deployment-backend.yaml
│   ├── deployment-frontend.yaml
│   ├── deployment-worker.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── serviceaccount.yaml
└── charts/
    ├── postgresql/
    └── redis/
```

### values.yaml

```yaml
# helm/predator/values.yaml
global:
  environment: staging
  domain: predator.example.com

replicaCount:
  backend: 3
  frontend: 2
  worker: 4

image:
  backend:
    repository: ghcr.io/org/predator-backend
    tag: latest
    pullPolicy: IfNotPresent
  frontend:
    repository: ghcr.io/org/predator-frontend
    tag: latest
    pullPolicy: IfNotPresent

resources:
  backend:
    requests:
      memory: "512Mi"
      cpu: "250m"
    limits:
      memory: "2Gi"
      cpu: "1000m"
  frontend:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "200m"
  worker:
    requests:
      memory: "1Gi"
      cpu: "500m"
    limits:
      memory: "4Gi"
      cpu: "2000m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "100m"
  hosts:
    - host: predator.example.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
  tls:
    - secretName: predator-tls
      hosts:
        - predator.example.com

probes:
  backend:
    liveness:
      path: /health/live
      initialDelaySeconds: 30
      periodSeconds: 10
    readiness:
      path: /health/ready
      initialDelaySeconds: 5
      periodSeconds: 5
    startup:
      path: /health/startup
      failureThreshold: 30
      periodSeconds: 10

podDisruptionBudget:
  enabled: true
  minAvailable: 1

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: predator-backend
          topologyKey: kubernetes.io/hostname

postgresql:
  enabled: true
  auth:
    postgresPassword: "${POSTGRES_PASSWORD}"
    database: predator_db

redis:
  enabled: true
  auth:
    enabled: false
```

### Backend Deployment Template

```yaml
# helm/predator/templates/deployment-backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "predator.fullname" . }}-backend
  labels:
    {{- include "predator.labels" . | nindent 4 }}
    app.kubernetes.io/component: backend
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount.backend }}
  {{- end }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      {{- include "predator.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: backend
  template:
    metadata:
      labels:
        {{- include "predator.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: backend
    spec:
      serviceAccountName: {{ include "predator.serviceAccountName" . }}
      containers:
        - name: backend
          image: "{{ .Values.image.backend.repository }}:{{ .Values.image.backend.tag }}"
          imagePullPolicy: {{ .Values.image.backend.pullPolicy }}
          ports:
            - name: http
              containerPort: 8000
              protocol: TCP

          livenessProbe:
            httpGet:
              path: {{ .Values.probes.backend.liveness.path }}
              port: http
            initialDelaySeconds: {{ .Values.probes.backend.liveness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.backend.liveness.periodSeconds }}

          readinessProbe:
            httpGet:
              path: {{ .Values.probes.backend.readiness.path }}
              port: http
            initialDelaySeconds: {{ .Values.probes.backend.readiness.initialDelaySeconds }}
            periodSeconds: {{ .Values.probes.backend.readiness.periodSeconds }}

          startupProbe:
            httpGet:
              path: {{ .Values.probes.backend.startup.path }}
              port: http
            failureThreshold: {{ .Values.probes.backend.startup.failureThreshold }}
            periodSeconds: {{ .Values.probes.backend.startup.periodSeconds }}

          resources:
            {{- toYaml .Values.resources.backend | nindent 12 }}

          envFrom:
            - configMapRef:
                name: {{ include "predator.fullname" . }}-config
            - secretRef:
                name: {{ include "predator.fullname" . }}-secrets

      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

---

## Моніторинг та Алертинг

### Prometheus ServiceMonitor

```yaml
# helm/predator/templates/servicemonitor.yaml
{{- if .Values.monitoring.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: {{ include "predator.fullname" . }}
  labels:
    {{- include "predator.labels" . | nindent 4 }}
spec:
  selector:
    matchLabels:
      {{- include "predator.selectorLabels" . | nindent 6 }}
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
{{- end }}
```

### Alerting Rules

```yaml
# infra/prometheus/rules/predator-alerts.yml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: predator-alerts
  labels:
    release: prometheus
spec:
  groups:
    - name: predator.rules
      rules:
        - alert: PredatorBackendDown
          expr: up{job="predator-backend"} == 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Predator Backend is down"
            description: "Predator Backend has been down for more than 1 minute."

        - alert: PredatorHighErrorRate
          expr: |
            sum(rate(http_requests_total{job="predator-backend",status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total{job="predator-backend"}[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High error rate on Predator Backend"
            description: "Error rate is {{ $value | humanizePercentage }}"

        - alert: PredatorHighLatency
          expr: |
            histogram_quantile(0.99,
              sum(rate(http_request_duration_seconds_bucket{job="predator-backend"}[5m])) by (le)
            ) > 1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High latency on Predator Backend"
            description: "P99 latency is {{ $value }}s"
```

---

## Secrets Management

### Sealed Secrets

```yaml
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Encrypt secret
kubeseal --format=yaml < secret.yaml > sealed-secret.yaml
```

### External Secrets Operator

```yaml
# external-secrets/secret-store.yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: predator
spec:
  provider:
    vault:
      server: "https://vault.example.com"
      path: "secret"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "predator-role"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: predator-secrets
  namespace: predator
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: SecretStore
    name: vault-backend
  target:
    name: predator-secrets
  data:
    - secretKey: DATABASE_PASSWORD
      remoteRef:
        key: predator/database
        property: password
    - secretKey: REDIS_PASSWORD
      remoteRef:
        key: predator/redis
        property: password
    - secretKey: ANTHROPIC_KEY
      remoteRef:
        key: predator/llm
        property: anthropic_key
```

---

## Швидкі команди

```bash
# ArgoCD login
argocd login argocd.example.com --username admin

# Sync application
argocd app sync predator-analytics

# Get app status
argocd app get predator-analytics

# Rollback
argocd app rollback predator-analytics <revision>

# Helm upgrade
helm upgrade predator ./helm/predator -n predator

# Kubectl apply
kubectl apply -k ./helm/predator/

# View pods
kubectl get pods -n predator -w
```

---

*© 2026 Predator Analytics — DevOps Team*
