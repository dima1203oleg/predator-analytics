# 🚀 ULTRA-ROUTER v5.0 Setup Guide

> **ТЗ 5.0 - Universal AI Router v5.0** — повна реалізація

## Статус ✅

```
✅ Docker image: ultra-router:v5.0 (built 68.7s)
✅ Container: ultra-router-v5.0 (port 4000)
✅ Configuration: deploy/litellm/config-antigravity.yaml (9 model entries)
✅ 4 активні групи моделей + infinite Ollama fallback
✅ Git commit: b70caaa5
```

## 5 Модельних груп

| Група | Модель | Клієнти | Статус |
|-------|--------|---------|--------|
| **chat** | Gemini 2.5 Flash | Простий чат | 🟢 Active |
| **fast** | Groq Llama 3.3 70B ×2 | Швидке вивірення | 🟢 Active |
| **coding** | Mistral Codestral ×2 | Рефакторинг коду | 🟢 Active |
| **auto** | Complexity Router | Universal (auto-select) | 🟢 Active |
| **local** | Ollama (unlimited) | Fallback (Free) | 🟢 Fallback |

## Як налаштувати

### 1️⃣ Додай реальні API ключі

Оновити `/Services/core-api/.env.remote` або `.env.server`:

```bash
# Gemini (отримати на https://console.cloud.google.com)
GEMINI_API_KEY="AIzaSy..."

# Groq (отримати на https://console.groq.com)
GROQ_API_KEY_1="gsk_..."
GROQ_API_KEY_2="gsk_..."

# Mistral (отримати на https://console.mistral.ai)
MISTRAL_API_KEY_1="sk-..."
MISTRAL_API_KEY_2="sk-..."

# LiteLLM Master Key (для авторизації)
LITELLM_MASTER_KEY="sk-antigravity-master-2026"
```

### 2️⃣ Перезавантаж контейнер

```bash
cd /Users/dima-mac/Documents/Predator_21
docker compose -f deploy/litellm/docker-compose-router.yml restart
```

### 3️⃣ Перевір моделі

```bash
curl -H "Authorization: Bearer sk-antigravity-master-2026" \
  http://localhost:4000/v1/models | jq '.data | map(.id)'
```

**Очікуваний результат:**
```json
[
  "ultra-router-chat",
  "ultra-router-fast",
  "ultra-router-coding",
  "ultra-router-auto"
]
```

### 4️⃣ Тестуй Chat Completion

```bash
curl -X POST \
  -H "Authorization: Bearer sk-antigravity-master-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ultra-router-auto",
    "messages": [{"role": "user", "content": "Привіт!"}]
  }' \
  http://localhost:4000/v1/chat/completions
```

## Antigravity Integration (опціонально)

Додай 4 моделі в Antigravity UI → Settings → Models:

```
1. Model ID: ultra-router-chat
   Base URL: http://localhost:4000/v1
   API Key: sk-antigravity-master-2026
   
2. Model ID: ultra-router-fast
   Base URL: http://localhost:4000/v1
   API Key: sk-antigravity-master-2026
   
3. Model ID: ultra-router-coding
   Base URL: http://localhost:4000/v1
   API Key: sk-antigravity-master-2026
   
4. Model ID: ultra-router-auto
   Base URL: http://localhost:4000/v1
   API Key: sk-antigravity-master-2026
```

## Файли конфігу

| Файл | Назва | Статус |
|------|-------|--------|
| `deploy/litellm/config-antigravity.yaml` | LiteLLM Proxy конфіг | ✅ v5.0 |
| `deploy/litellm/docker-compose-router.yml` | Docker Compose | ✅ v5.0 |
| `deploy/litellm/Dockerfile` | Multi-stage image | ✅ Fixed |
| `services/core-api/.env.remote` | Environment vars | 📝 Потребує ключів |

## Routing Logic

```yaml
routing_strategy: least-busy
fallback_strategy: exponential_backoff

Fallback Chain:
  ultra-router-chat → ultra-router-local (Ollama)
  ultra-router-fast → ultra-router-local
  ultra-router-coding → ultra-router-local
  ultra-router-auto → ultra-router-local (or direct to auto)
```

## Ollama Integration (NVIDIA Server)

Для infinite local fallback використовується Ollama на 194.177.1.240:11434

Доступні моделі:
- `qwen3:8b` — fast reasoning
- `deepseek-r1:7b` — medium reasoning
- `gemma3:4b` — lightweight

## Troubleshooting

**Контейнер не стартує?**
```bash
docker logs ultra-router-v5.0
```

**API ключі не дійсні?**
```bash
# Перевір .env переменні
docker compose -f deploy/litellm/docker-compose-router.yml config | grep API_KEY
```

**Modeles не реєструються?**
```bash
# Перезавантаж конфіг
docker compose -f deploy/litellm/docker-compose-router.yml restart
```

## Посилання

- LiteLLM Proxy: https://docs.litellm.ai/docs/proxy/quick_start
- Groq API: https://console.groq.com
- Mistral API: https://console.mistral.ai
- Google AI Studio: https://aistudio.google.com/app
- Ollama: https://ollama.ai

---

**Git commit:** `b70caaa5` — "feat(ultra-router): ТЗ 5.0 з 4 активними группами + infinite Ollama fallback"
