# 🚀 Інструкція з ручного деплойменту на NVIDIA Сервер

## Крок 1: Підключення до сервера

```bash
ssh -i ~/.ssh/id_ed25519_ngrok -p 18105 root@6.tcp.eu.ngrok.io
# Або з паролем: Dima@1203
```

---

## Крок 2: Підготовка середовища

```bash
# Перейти до робочої директорії
cd ~/predator-analytics

# Оновити git (якщо можливо)
git pull origin main

# АБО створити директорію, якщо її немає
mkdir -p ~/predator-analytics
cd ~/predator-analytics
```

---

## Крок 3: Завантажити критичні файли

### 3.1 Конфігурація API Ключів (.env)

Створіть файл `.env`:

```bash
nano .env
```

Вставте:

```env
# LLM Providers (ADD YOUR KEYS HERE)
GROQ_API_KEY=gsk_your_groq_api_key_here
GEMINI_API_KEY=AIzaSy_your_gemini_key_here
DEEPSEEK_API_KEY=sk-your_deepseek_key_here

# Database
DATABASE_URL=postgresql+asyncpg://predator:predator_password@postgres:5432/predator_db

# Redis & Services
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333
OPENSEARCH_URL=http://opensearch:9200
MINIO_ENDPOINT=minio:9000

# Security
SECRET_KEY=production-secret-key-change-me-in-prod
LLM_DEFAULT_PROVIDER=groq

# Environment
ENVIRONMENT=production
DEBUG=false
PRELOAD_MODELS=false
```

Зберегти: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 3.2 Тестові дані

```bash
# Створити директорію
mkdir -p sample_data

# Завантажити з Mac (на Mac виконайте):
scp -i ~/.ssh/id_ed25519_ngrok -P 18105 \
  /Users/dima-mac/Documents/Predator_21/sample_data/Березень_2024.xlsx \
  root@6.tcp.eu.ngrok.io:~/predator-analytics/sample_data/
```

---

### 3.3 Self-Improvement Orchestrator

```bash
# Створити директорію
mkdir -p ua-sources/app/services

# Завантажити код (на Mac):
scp -i ~/.ssh/id_ed25519_ngrok -P 18105 \
  /Users/dima-mac/Documents/Predator_21/ua-sources/app/services/si_orchestrator.py \
  root@6.tcp.eu.ngrok.io:~/predator-analytics/ua-sources/app/services/
```

---

### 3.4 Data Augmentor

```bash
# Створити директорію
mkdir -p ua-sources/app/services/ml

# Завантажити (на Mac):
scp -i ~/.ssh/id_ed25519_ngrok -P 18105 \
  /Users/dima-mac/Documents/Predator_21/ua-sources/app/services/ml/data_augmentor.py \
  root@6.tcp.eu.ngrok.io:~/predator-analytics/ua-sources/app/services/ml/
```

---

### 3.5 E2E Testing API

```bash
# Створити директорію
mkdir -p ua-sources/app/api/routers

# Завантажити (на Mac):
scp -i ~/.ssh/id_ed25519_ngrok -P 18105 \
  /Users/dima-mac/Documents/Predator_21/ua-sources/app/api/routers/e2e.py \
  root@6.tcp.eu.ngrok.io:~/predator-analytics/ua-sources/app/api/routers/
```

---

## Крок 4: Запуск Docker Compose

```bash
cd ~/predator-analytics

# Перевірити конфігурацію
cat .env | grep -E "GROQ|GEMINI|DEEPSEEK"

# Запустити сервіси
docker compose down  # Зупинити старі
docker compose up -d --build  # Побудувати і запустити

# Перевірити статус
docker compose ps
docker compose logs -f backend --tail 50
```

---

## Крок 5: Перевірка функціональності

### 5.1 Health Check

```bash
curl http://localhost:8000/health
# Очікується: {"status":"ok","version":"21.0.0"}
```

### 5.2 E2E API

```bash
curl http://localhost:8000/api/v1/e2e/health
# Очікується: {"status":"healthy",...}
```

### 5.3 Model Health (через API ключі)

```bash
curl http://localhost:8000/api/v1/e2e/model/groq/health
curl http://localhost:8000/api/v1/e2e/model/gemini/health
curl http://localhost:8000/api/v1/e2e/model/deepseek/health
```

Очікується `"status":"healthy"` для всіх.

---

## Крок 6: Запустити E2E Test Cycle

```bash
curl -X POST http://localhost:8000/api/v1/e2e/test-run \
  -H "Content-Type: application/json" \
  -d '{"run_id":"test-001","test_type":"full","generate_reports":true}'

# Перевірити статус
curl http://localhost:8000/api/v1/e2e/processing/status
```

---

## Крок 7: Згенерувати тестовий звіт

```bash
# PDF звіт
curl -X POST http://localhost:8000/api/v1/e2e/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"run_id":"test-001","format":"pdf"}' \
  | jq '.pdf_url'

# Markdown звіт  
curl -X POST http://localhost:8000/api/v1/e2e/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"run_id":"test-001","format":"markdown"}' \
  | jq '.markdown_url'
```

---

## Крок 8: Перевірка LLM Council

```bash
curl -X POST http://localhost:8000/api/v1/council/run \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Які переваги семантичного пошуку?",
    "models": ["groq","gemini","deepseek"],
    "synthesis_model": "gemini"
  }' | jq '.final_answer'
```

---

## Крок 9: Тестування завантаження даних

```bash
# Завантажити Excel файл
curl -X POST http://localhost:8000/api/v1/data/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample_data/Березень_2024.xlsx" \
  -F "dataset_type=customs"
```

---

## Крок 10: Моніторинг

```bash
# Prometheus метрики
curl http://localhost:9090/api/v1/query?query=up

# Grafana дашборд
# Відкрити: http://SERVER_IP:3001
# Логін: admin / predator123

# OpenSearch Dashboard
# Відкрити: http://SERVER_IP:5601
```

---

## 🚨 Troubleshooting

### Проблема: "No LLM provider available"

```bash
# Перевірити змінні оточення в контейнері
docker exec predator_backend env | grep -E "GROQ|GEMINI"

# Якщо порожньо - перезапустити з .env
docker compose down
docker compose up -d
```

### Проблема: Backend не стартує

```bash
# Переглянути логи
docker compose logs backend

# Перевірити залежності
docker exec predator_backend pip list | grep -E "reportlab|openai|google"
```

### Проблема: GPU не виявлено

```bash
# Перевірити NVIDIA
nvidia-smi

# Додати GPU до Docker (у docker-compose.yml):
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
#           count: 1
#           capabilities: [gpu]
```

---

## ✅ Чеклист успішного деплою

- [ ] `.env` файл створено з робочими ключами
- [ ] `sample_data/Березень_2024.xlsx` завантажено
- [ ] Docker Compose запущено без помилок
- [ ] `/health` endpoint повертає OK
- [ ] `/api/v1/e2e/health` повертає healthy
- [ ] Groq/Gemini/DeepSeek models status = healthy
- [ ] LLM Council працює корректно
- [ ] Prometheus/Grafana доступні
- [ ] OpenSearch Dashboard відкривається

---

**Версія:** v22.0  
**Дата:** 2025-12-10  
**Автор:** Predator Analytics Team
