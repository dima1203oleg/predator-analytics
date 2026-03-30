# Ultra-Router v5.0 — Universal Hybrid AI Router

Єдина точка входу до всіх LLM для екосистеми PREDATOR Analytics.

## Архітектура

```
Cline / Aider / Python-скрипти
         │
         ▼
  localhost:4000 (завжди)
         │
   ┌─────┴──────────────────────────┐
   │  start-ultra-router.sh перевіряє │
   └─────┬──────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │  NVIDIA 194.177.1.240 доступний?    │
    └────┬──────────────┬─────────────────┘
         │ ТАК          │ НІ
         ▼              ▼
   SSH-тунель    Локальний LiteLLM
   → NVIDIA:4000  (тільки хмара)
   (Повний стек:  (Gemini+Groq+Mistral)
    Ollama теж!)
```

## Моделі

| Назва | Провайдер | Призначення |
|---|---|---|
| `ultra-router-chat` | Gemini 2.5 Flash | Чат, українська, прості питання |
| `ultra-router-fast` | Groq Llama 3.3 70B ×2 | Vibe Coding, складний аналіз |
| `ultra-router-coding` | Mistral Codestral ×2 | Генерація коду, рефакторинг |
| `ultra-router-local` | Ollama (qwen3/deepseek/gemma) | Безлімітний резерв (NVIDIA) |
| `ultra-router-auto` | Всі провайдери | Least-busy автовибір |

## Швидкий старт

### 1. Підготовка .env
```bash
cp .env.example .env.ultra-router
nano .env.ultra-router  # заповніть API ключі
```

### 2. Запуск на Mac (розумний режим)
```bash
chmod +x start-ultra-router.sh stop-ultra-router.sh test-router.sh
./start-ultra-router.sh
```
Скрипт автоматично:
- Перевіряє NVIDIA `194.177.1.240:4000`
- Якщо доступний → SSH-тунель (повний стек + Ollama)
- Якщо недоступний → локальний LiteLLM (тільки хмарні API)

### 3. Деплой на NVIDIA сервер
```bash
chmod +x deploy-ai-router.sh
./deploy-ai-router.sh
```

### 4. Зупинка
```bash
./stop-ultra-router.sh
```

### 5. Тестування
```bash
./test-router.sh                          # localhost
./test-router.sh http://194.177.1.240:4000  # NVIDIA
```

## Налаштування Cline

| Параметр | Значення |
|---|---|
| Provider | OpenAI Compatible |
| Base URL | `http://localhost:4000/v1` |
| API Key | значення з `.env.ultra-router` → `LITELLM_MASTER_KEY` |

Всі моделі вже додані в Antigravity `settings.json`.

## Налаштування Aider

Файл `.aider.conf.yml` вже створено в корені проекту.
```bash
aider  # автоматично підхопить конфіг
```

## Моніторинг (тільки NVIDIA)

| Сервіс | URL |
|---|---|
| Grafana | `http://194.177.1.240:3001` (admin/predator2026) |
| Prometheus | `http://194.177.1.240:9090` |
| LiteLLM health | `http://194.177.1.240:4000/health` |

## Конфіги

| Файл | Призначення |
|---|---|
| `config-antigravity.yaml` | NVIDIA (всі моделі + Ollama fallback) |
| `config-mac-local.yaml` | Mac fallback (тільки хмарні API) |
| `docker-compose-router.yml` | NVIDIA повний стек |
| `docker-compose-mac.yml` | Mac легкий стек |

## Failover-ланцюжок

```
ultra-router-chat/fast/coding/auto
         │ помилка / rate-limit
         ▼
  ultra-router-local
    ├── Ollama qwen3:8b    (якщо NVIDIA доступний)
    ├── Ollama deepseek-r1:7b
    ├── Ollama gemma3:4b
    └── Groq/Mistral       (якщо MAC LOCAL режим)
```
