# 🚀 Predator Analytics v25 — Деплой на NVIDIA Server

**Мета:** Запустити весь стек (frontend/backend/infra) на NVIDIA сервері, щоб зберегти ресурси Mac. Mac використовується тільки для доступу через браузер/SSH.

---

## 📋 Передумови на NVIDIA сервері

### Варіант A: Docker Compose (рекомендовано для швидкого старту)
```bash
# Перевірка
docker --version          # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+
git --version
```

### Варіант B: Kubernetes (production)
```bash
# Перевірка
kubectl version --client  # 1.25+
kubectl cluster-info      # Має бути підключення до кластера
helm version              # Helm 3.x (опціонально)
```

---

## 🔧 Варіант A: Docker Compose (найпростіший)

### 1. Клонування репо на сервер
```bash
# SSH на NVIDIA сервер
ssh dima@194.177.1.240 -p 6666

# Клонування
git clone https://github.com/dima1203oleg/predator-analytics.git
cd predator-analytics
```

### 2. Налаштування .env
```bash
# Створіть .env файл (або скопіюйте з .env.example)
cp .env.example .env
vim .env

# Мінімально необхідні змінні:
DATABASE_URL=postgresql+asyncpg://predator:predator_password@postgres:5432/predator_db
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000

# API ключі (якщо потрібні для LLM/ML)
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

### 3. Запуск стеку
```bash
# Збірка + запуск усіх сервісів
docker-compose up -d --build

# Перевірка статусу
docker-compose ps

# Логи (якщо потрібно)
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 4. Перевірка з Mac

**A. Додайте запис у `/etc/hosts` на Mac:**
```bash
# На Mac
sudo vim /etc/hosts

# Додайте:
194.177.1.240  predator.analytics.local
```

**B. Відкрийте браузер на Mac:**
```
http://predator.analytics.local:8092
```
або прямо по IP:
```
http://194.177.1.240:8092
```

**C. Перевірте Omniscience WebSocket:**
1. Відкрийте `http://194.177.1.240:8092/omniscience`
2. У правому верхньому куті має з'явитись індикатор **LINK: WS** (зелений) — це означає успішне WebSocket з'єднання
3. Якщо **LINK: POLLING** (блакитний) — WebSocket не працює, але polling fallback активний
4. Якщо **LINK: OFFLINE** (червоний) — немає зв'язку з backend

**D. Перевірте API health:**
```bash
# На Mac
curl http://194.177.1.240:8090/health
# Очікується: {"status":"healthy"}

curl http://194.177.1.240:8090/api/v25/metrics/realtime
# Очікується: JSON з метриками (ndcg, latency, throughput, error_rate)
```

### 5. Зупинка/перезапуск
```bash
# Зупинка
docker-compose down

# Перезапуск окремого сервісу
docker-compose restart backend
docker-compose restart frontend

# Повне видалення (включно з volumes)
docker-compose down -v
```

---

## 🎯 Варіант B: Kubernetes (production)

### 1. Клонування репо на сервер
```bash
ssh dima@194.177.1.240 -p 6666
git clone https://github.com/dima1203oleg/predator-analytics.git
cd predator-analytics
```

### 2. Налаштування secrets
```bash
# Оновіть паролі/ключі у k8s/secrets.yaml
vim k8s/secrets.yaml

# Згенеруйте безпечні паролі:
openssl rand -base64 32  # для POSTGRES_PASSWORD
openssl rand -base64 32  # для JWT_SECRET_KEY
```

### 3. Деплой через Kustomize
```bash
# Застосувати всі маніфести
kubectl apply -k k8s/

# Або використати deploy скрипт
chmod +x k8s/deploy.sh
./k8s/deploy.sh predator-analytics production
```

### 4. Перевірка статусу
```bash
# Pods
kubectl get pods -n predator-analytics

# Services
kubectl get svc -n predator-analytics

# Ingress
kubectl get ingress -n predator-analytics

# Логи backend
kubectl logs -f deployment/backend -n predator-analytics

# Логи frontend
kubectl logs -f deployment/frontend -n predator-analytics
```

### 5. Налаштування доступу з Mac

**A. Port-forward (тимчасовий доступ):**
```bash
# На Mac (через SSH тунель або kubectl)
kubectl port-forward -n predator-analytics svc/frontend 8092:80
kubectl port-forward -n predator-analytics svc/backend 8090:8000

# Відкрийте браузер:
http://localhost:8092
```

**B. Ingress (production):**

Якщо у вас є Ingress Controller (nginx-ingress) та DNS/hosts:

```bash
# На Mac додайте у /etc/hosts:
194.177.1.240  predator.analytics.local api.predator.analytics.local

# Відкрийте браузер:
https://predator.analytics.local
```

**C. Перевірте Omniscience WebSocket:**
1. Відкрийте `https://predator.analytics.local/omniscience`
2. Індикатор **LINK: WS** (зелений) — WebSocket працює через Ingress
3. Якщо **LINK: POLLING** — перевірте Ingress annotations (вже виправлено у `k8s/ingress.yaml`)

**D. Перевірте API health:**
```bash
# Через Ingress
curl https://predator.analytics.local/api/health

# Або через port-forward
curl http://localhost:8090/health
```

### 6. Масштабування (опціонально)
```bash
# Збільшити кількість backend реплік
kubectl scale deployment/backend --replicas=5 -n predator-analytics

# Перевірити HPA (Horizontal Pod Autoscaler)
kubectl get hpa -n predator-analytics
```

### 7. Видалення
```bash
# Видалити всі ресурси
kubectl delete namespace predator-analytics
```

---

## 🔍 Troubleshooting

### WebSocket не працює (LINK: POLLING замість WS)

**Docker Compose:**
- Перевірте, що `docker/nginx.conf` містить `proxy_set_header Upgrade/Connection` для `/api/`
- Перезапустіть frontend: `docker-compose restart frontend`

**Kubernetes:**
- Перевірте Ingress annotations у `k8s/ingress.yaml` (вже виправлено)
- Перезастосуйте Ingress: `kubectl apply -f k8s/ingress.yaml -n predator-analytics`
- Перевірте логи Ingress Controller: `kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx`

### Backend не стартує

```bash
# Docker Compose
docker-compose logs backend

# Kubernetes
kubectl logs -f deployment/backend -n predator-analytics
kubectl describe pod <backend-pod-name> -n predator-analytics
```

Типові причини:
- Postgres не готовий → почекайте 30-60 сек
- Неправильний DATABASE_URL → перевірте .env або secrets
- Відсутні API ключі → додайте у .env (GEMINI_API_KEY, GROQ_API_KEY)

### Frontend показує 502 Bad Gateway

- Backend ще не стартував → почекайте або перевірте `docker-compose ps` / `kubectl get pods`
- Неправильний proxy у nginx.conf → перевірте `proxy_pass http://backend:8000`

---

## 📊 Моніторинг

### Grafana (якщо розгорнуто)
```
# Docker Compose
http://194.177.1.240:3001
# Логін: admin / admin

# Kubernetes
kubectl port-forward -n predator-analytics svc/grafana 3000:3000
# http://localhost:3000
```

### Prometheus
```
# Docker Compose
http://194.177.1.240:9092

# Kubernetes
kubectl port-forward -n predator-analytics svc/prometheus 9090:9090
```

---

## ✅ Чеклист успішного деплою

- [ ] Backend відповідає на `/health` → `{"status":"healthy"}`
- [ ] Frontend доступний через браузер
- [ ] Omniscience UI відкривається (`/omniscience`)
- [ ] Індикатор **LINK: WS** (зелений) — WebSocket працює
- [ ] Метрики оновлюються в реальному часі (CPU, Memory, NDCG, Latency)
- [ ] Grafana/Prometheus доступні (опціонально)

---

**Готово!** 🎉 Тепер весь стек працює на NVIDIA сервері, а Mac використовується тільки для доступу через браузер.
