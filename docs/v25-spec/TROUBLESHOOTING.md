# 🔧 Troubleshooting Guide — Predator v25.0

> **Версія:** 25.0
> **Оновлено:** 10.01.2026

---

## Зміст

1. [Швидка Діагностика](#1-швидка-діагностика)
2. [Frontend Проблеми](#2-frontend-проблеми)
3. [Backend Проблеми](#3-backend-проблеми)
4. [Database Проблеми](#4-database-проблеми)
5. [AI/ML Проблеми](#5-aiml-проблеми)
6. [DevOps Проблеми](#6-devops-проблеми)
7. [Network Проблеми](#7-network-проблеми)
8. [Performance Проблеми](#8-performance-проблеми)

---

## 1. Швидка Діагностика

### 🔍 Перевірка статусу системи

```bash
# Статус всіх сервісів
make status

# Або вручну
docker-compose ps

# Health check API
curl http://localhost/api/v1/health

# Детальний health check
curl http://localhost/api/v1/health/detailed
```

### 📊 Швидкі команди діагностики

| Команда | Опис |
|---------|------|
| `make logs` | Всі логи |
| `make logs-backend` | Тільки backend |
| `make logs-frontend` | Тільки frontend |
| `docker-compose logs -f --tail=100 api` | Останні 100 рядків API |

---

## 2. Frontend Проблеми

### ❌ Проблема: Біла сторінка після завантаження

**Симптоми:**
- Сторінка пуста
- Консоль показує JavaScript помилки

**Рішення:**

```bash
# 1. Перевірити build
cd apps/predator-analytics-ui
npm run build

# 2. Очистити кеш
rm -rf node_modules/.vite
rm -rf dist

# 3. Перезібрати
npm install
npm run build
```

**Перевірка:**
```bash
# Переконатися що index.html існує
ls -la dist/index.html
```

---

### ❌ Проблема: WebSocket не з'єднується

**Симптоми:**
- Real-time дані не оновлюються
- Консоль: `WebSocket connection failed`

**Діагностика:**
```bash
# Перевірити чи WS endpoint доступний
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost/ws/health
```

**Рішення:**
```bash
# 1. Перевірити nginx конфігурацію
cat nginx/nginx.conf | grep -A 10 "location /ws"

# 2. Перезапустити nginx
docker-compose restart nginx

# 3. Перевірити backend WS handler
docker-compose logs api | grep -i websocket
```

---

### ❌ Проблема: Стилі не завантажуються

**Симптоми:**
- UI виглядає "зламаним"
- CSS файли 404

**Рішення:**
```bash
# 1. Перевірити Tailwind build
npx tailwindcss -i ./src/index.css -o ./dist/output.css

# 2. Очистити кеш браузера
# Ctrl+Shift+R (hard refresh)

# 3. Перевірити public path
grep "base" vite.config.ts
```

---

### ❌ Проблема: 3D візуалізації не працюють

**Симптоми:**
- Three.js компоненти не рендеряться
- WebGL помилки

**Рішення:**
```javascript
// Перевірити WebGL підтримку
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
console.log('WebGL supported:', !!gl);
```

```bash
# Fallback на 2D
export VITE_DISABLE_3D=true
npm run build
```

---

## 3. Backend Проблеми

### ❌ Проблема: API повертає 500

**Діагностика:**
```bash
# 1. Перевірити логи
docker-compose logs api --tail=50

# 2. Перевірити traceback
docker-compose logs api 2>&1 | grep -A 20 "Traceback"

# 3. Перевірити змінні середовища
docker-compose exec api env | grep -E "(DATABASE|REDIS|API)"
```

**Типові причини:**

| Помилка | Причина | Рішення |
|---------|---------|---------|
| `ConnectionRefusedError` | DB не запущена | `docker-compose up -d postgres` |
| `RedisConnectionError` | Redis не запущений | `docker-compose up -d redis` |
| `ImportError` | Відсутня залежність | `pip install -r requirements.txt` |

---

### ❌ Проблема: Celery workers не працюють

**Симптоми:**
- Jobs застрягли в PENDING
- Немає обробки фонових задач

**Діагностика:**
```bash
# 1. Статус workers
docker-compose exec celery celery -A app.celery inspect active

# 2. Черга задач
docker-compose exec celery celery -A app.celery inspect reserved

# 3. Логи worker
docker-compose logs celery --tail=100
```

**Рішення:**
```bash
# Перезапустити workers
docker-compose restart celery

# Очистити чергу (УВАГА: видалить всі pending tasks)
docker-compose exec celery celery -A app.celery purge -f
```

---

### ❌ Проблема: Temporal workflows не виконуються

**Симптоми:**
- Workflows залишаються в статусі RUNNING
- Timeout помилки

**Діагностика:**
```bash
# 1. Статус Temporal
docker-compose logs temporal --tail=50

# 2. Перевірити workers
docker-compose logs temporal-worker --tail=50

# 3. UI Temporal (якщо доступний)
open http://localhost:8088
```

**Рішення:**
```bash
# 1. Перезапустити Temporal stack
docker-compose restart temporal temporal-worker

# 2. Перевірити namespace
docker-compose exec temporal tctl namespace list
```

---

### ❌ Проблема: LLM запити timeout

**Симптоми:**
- AI відповіді не приходять
- `TimeoutError` в логах

**Діагностика:**
```bash
# 1. Перевірити LiteLLM
curl http://localhost:4000/health

# 2. Перевірити API ключі
docker-compose exec api env | grep -E "(GROQ|GEMINI|OPENAI)_API_KEY"

# 3. Тест LLM
curl -X POST http://localhost:4000/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "groq/llama-3.1-8b-instant", "messages": [{"role": "user", "content": "test"}]}'
```

**Рішення:**
```bash
# 1. Збільшити timeout
export LLM_TIMEOUT=120

# 2. Змінити fallback модель
# Редагувати configs/litellm_config.yaml

# 3. Перезапустити
docker-compose restart litellm
```

---

## 4. Database Проблеми

### ❌ Проблема: PostgreSQL connection refused

**Діагностика:**
```bash
# 1. Статус контейнера
docker-compose ps postgres

# 2. Логи
docker-compose logs postgres --tail=50

# 3. Тест з'єднання
docker-compose exec postgres pg_isready -U predator
```

**Рішення:**
```bash
# 1. Перезапустити
docker-compose restart postgres

# 2. Перевірити volume
docker volume ls | grep postgres

# 3. Якщо corrupted - відновити з backup
./scripts/restore_db.sh latest
```

---

### ❌ Проблема: Redis OutOfMemory

**Симптоми:**
- `OOM command not allowed`
- Cache не працює

**Діагностика:**
```bash
# 1. Використання пам'яті
docker-compose exec redis redis-cli INFO memory

# 2. Кількість ключів
docker-compose exec redis redis-cli DBSIZE
```

**Рішення:**
```bash
# 1. Очистити застарілі ключі
docker-compose exec redis redis-cli FLUSHDB

# 2. Збільшити ліміт (docker-compose.yml)
# redis:
#   command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

# 3. Перезапустити
docker-compose restart redis
```

---

### ❌ Проблема: Qdrant vector search повільний

**Симптоми:**
- Пошук >5 секунд
- Timeout помилки

**Діагностика:**
```bash
# 1. Кількість векторів
curl http://localhost:6333/collections/threats

# 2. Metrics
curl http://localhost:6333/metrics
```

**Рішення:**
```bash
# 1. Оптимізувати колекцію
curl -X POST http://localhost:6333/collections/threats/index \
  -H "Content-Type: application/json" \
  -d '{"field_name": "vector", "field_schema": "keyword"}'

# 2. Збільшити ресурси в docker-compose.yml
```

---

## 5. AI/ML Проблеми

### ❌ Проблема: Model not found

**Симптоми:**
- `FileNotFoundError: model.pkl`
- ML predictions fail

**Рішення:**
```bash
# 1. Перевірити наявність моделі
ls -la models/

# 2. Завантажити з MinIO
mc cp minio/models/latest/ ./models/

# 3. Або перетренувати
make train-models
```

---

### ❌ Проблема: Hybrid search не працює

**Симптоми:**
- Пошук повертає пусті результати
- SPLADE помилки

**Діагностика:**
```bash
# 1. Перевірити індекси
curl http://localhost:9200/_cat/indices

# 2. Перевірити Qdrant
curl http://localhost:6333/collections
```

**Рішення:**
```bash
# Переіндексувати
make reindex-all
```

---

## 6. DevOps Проблеми

### ❌ Проблема: ArgoCD sync failed

**Симптоми:**
- Application "OutOfSync"
- Deployment не оновлюється

**Діагностика:**
```bash
# 1. Статус
argocd app get predator-analytics

# 2. Sync помилки
argocd app sync predator-analytics --dry-run
```

**Рішення:**
```bash
# 1. Force sync
argocd app sync predator-analytics --force

# 2. Hard refresh
argocd app refresh predator-analytics --hard

# 3. Rollback якщо потрібно
argocd app rollback predator-analytics
```

---

### ❌ Проблема: Pods CrashLoopBackOff

**Діагностика:**
```bash
# 1. Статус pods
kubectl get pods -n predator

# 2. Describe проблемного pod
kubectl describe pod <pod-name> -n predator

# 3. Логи
kubectl logs <pod-name> -n predator --previous
```

**Типові причини:**

| Причина | Рішення |
|---------|---------|
| OOMKilled | Збільшити memory limits |
| Liveness probe failed | Перевірити /healthz endpoint |
| Image pull error | Перевірити registry credentials |
| Config error | Перевірити ConfigMaps/Secrets |

---

## 7. Network Проблеми

### ❌ Проблема: CORS помилки

**Симптоми:**
- Browser console: `CORS policy blocked`

**Рішення:**
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "https://predator.ai"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### ❌ Проблема: SSL certificate помилки

**Діагностика:**
```bash
# Перевірити сертифікат
openssl s_client -connect predator.ai:443 -servername predator.ai

# Термін дії
echo | openssl s_client -connect predator.ai:443 2>/dev/null | openssl x509 -noout -dates
```

**Рішення:**
```bash
# Оновити Let's Encrypt
certbot renew --force-renewal
```

---

## 8. Performance Проблеми

### ❌ Проблема: Високий CPU usage

**Діагностика:**
```bash
# 1. Top processes
docker stats

# 2. Profiling
py-spy top --pid $(pgrep -f uvicorn)
```

**Рішення:**
- Додати caching (Redis)
- Оптимізувати queries
- Horizontal scaling (HPA)

---

### ❌ Проблема: Повільні database queries

**Діагностика:**
```sql
-- Slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

**Рішення:**
```sql
-- Додати індекси
CREATE INDEX CONCURRENTLY idx_threats_created ON threats(created_at);

-- Analyze
ANALYZE threats;
```

---

## 📞 Ескалація

Якщо проблема не вирішена:

1. **Зібрати діагностику:**
   ```bash
   make diagnostics > diagnostics_$(date +%Y%m%d).txt
   ```

2. **Створити issue:** з логами та steps to reproduce

3. **Slack канал:** #predator-support

4. **On-call:** Дивитись PagerDuty

---

*© 2026 Predator Analytics. Усі права захищено.*
