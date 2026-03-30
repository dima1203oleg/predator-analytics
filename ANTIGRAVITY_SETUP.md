# 🎯 ANTIGRAVITY CODER — SETUP для ULTRA-ROUTER v55.3

## ✅ ULTRA-ROUTER готова до локального використання

**Статус:** ✅ **WORKING** на `http://localhost:4000`

**Моделі:**
- `ultra-router-coding`
- `ultra-router-fast` 
- `ultra-router-reasoning`
- `ultra-router-chat`

**Master Key:** `sk-antigravity-master-2026`

---

## 📝 Налаштування в Antigravity Coder

### VS Code → Extensions → Antigravity

1. **Settings (⚙️) → Models → Add Custom Model** ×4

#### Модель 1: Coding
```
Base URL: http://localhost:4000/v1
API Key: sk-antigravity-master-2026
Model ID: ultra-router-coding
Name: Ultra Router - Coding
```

#### Модель 2: Fast
```
Base URL: http://localhost:4000/v1
API Key: sk-antigravity-master-2026
Model ID: ultra-router-fast
Name: Ultra Router - Fast
```

#### Модель 3: Reasoning
```
Base URL: http://localhost:4000/v1
API Key: sk-antigravity-master-2026
Model ID: ultra-router-reasoning
Name: Ultra Router - Reasoning
```

#### Модель 4: Chat
```
Base URL: http://localhost:4000/v1
API Key: sk-antigravity-master-2026
Model ID: ultra-router-chat
Name: Ultra Router - Chat
```

---

## ⚙️ Конфігураційні файли

**Основні порти:**
- Frontend: http://localhost:3030 (Vite dev)
- Backend API: http://localhost:8090 (FastAPI)
- ULTRA-ROUTER: http://localhost:4000 (LiteLLM Proxy)
- Mock API: http://localhost:9080 (fallback)

**Файли конфігурації:**
- `.env.local` — локальна розробка
- `.env.remote` — сервер 194.177.1.240
- `deploy/litellm/config-antigravity.yaml` — моделі

---

## 🚀 Запуск

### Стартувати ULTRA-ROUTER (вже розпущена):
```bash
cd /Users/dima-mac/Documents/Predator_21/deploy/litellm
docker compose -f docker-compose-router.yml up -d
```

### Перевірити статус:
```bash
curl -H "Authorization: Bearer sk-antigravity-master-2026" \
  http://localhost:4000/v1/models | jq .
```

### Відключити:
```bash
docker compose -f docker-compose-router.yml down
```

---

## 📞 Для підключення до реального сервера

Коли сервер 194.177.1.240 стане доступним:

```bash
bash /Users/dima-mac/Documents/Predator_21/scripts/auto-connect-server.sh
```

Потім змініть в Antigravity:
```
Base URL: http://194.177.1.240:4000/v1
```

---

**Версія:** 55.3  
**Дата:** 30 березня 2026
