#!/usr/bin/env bash
set -euo pipefail

ROOT="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
WORKDIR="$ROOT/deploy/litellm"
ENVFILE="$ROOT/services/core-api/.env.remote"

echo "============================================================"
echo "🚀 Universal AI Router v5.0 - Налаштування для PREDATOR   "
echo "============================================================"
echo "Цей скрипт автоматично налаштує LiteLLM Proxy (ULTRA-ROUTER)"
echo "та підготує його для інтеграції з Antigravity Coder."
echo "------------------------------------------------------------"
echo "Будуть перезаписані файли:"
echo "  - $WORKDIR/config-antigravity.yaml"
echo "  - $WORKDIR/docker-compose-router.yml"
echo "Змінні буде додано до (якщо відсутні):"
echo "  - $ENVFILE"
echo "------------------------------------------------------------"
echo ""
read -p "Натисніть Enter для продовження або Ctrl+C для скасування..."

# --- 1. Перезапис config-antigravity.yaml ---
echo "1️⃣  Перезаписую config-antigravity.yaml..."
mkdir -p "$WORKDIR"
cat > "$WORKDIR/config-antigravity.yaml" <<'YAML_CONFIG'
# Universal AI Router v5.0 config for PREDATOR
# Antigravity-ready with 5 model groups (API + Local Ollama)

# --- Define individual models / providers ---
model_list:
  # API Group: CHAT (Gemini)
  - model_name: ultra-router-chat
    litellm_params:
      model: gemini/gemini-2.5-flash
      api_key: ${GEMINI_API_KEY}
      api_base: https://generativelanguage.googleapis.com/v1beta
      timeout: 10
      stream: true # Enable streaming

  # API Group: FAST (Groq x2 keys for redundancy/higher limits)
  - model_name: ultra-router-fast-groq-1
    litellm_params:
      model: groq/llama-3.3-70b-versatile
      api_key: ${GROQ_API_KEY_1}
      api_base: https://api.groq.com/openai/v1
      timeout: 10
      stream: true
  - model_name: ultra-router-fast-groq-2
    litellm_params:
      model: groq/llama-3.3-70b-versatile
      api_key: ${GROQ_API_KEY_2}
      api_base: https://api.groq.com/openai/v1
      timeout: 10
      stream: true

  # API Group: CODING (Mistral x2 keys)
  - model_name: ultra-router-coding-mistral-1
    litellm_params:
      model: mistral/codestral-latest
      api_key: ${MISTRAL_API_KEY_1}
      api_base: https://api.mistral.ai/v1
      timeout: 15
      stream: true
  - model_name: ultra-router-coding-mistral-2
    litellm_params:
      model: mistral/codestral-latest
      api_key: ${MISTRAL_API_KEY_2}
      api_base: https://api.mistral.ai/v1
      timeout: 15
      stream: true

  # LOCAL Group: Unlimited (Ollama on NVIDIA Server)
  - model_name: ultra-router-local-qwen3
    litellm_params:
      model: ollama/qwen3:8b
      api_base: http://194.177.1.240:11434
      timeout: 60 # Longer timeout for local/larger models
      stream: true
  - model_name: ultra-router-local-deepseek-r1
    litellm_params:
      model: ollama/deepseek-r1:7b
      api_base: http://194.177.1.240:11434
      timeout: 60
      stream: true
  - model_name: ultra-router-local-gemma3
    litellm_params:
      model: ollama/gemma3:4b
      api_base: http://194.177.1.240:11434
      timeout: 60
      stream: true

# --- Define Antigravity-specific model groups/routes ---
  # These are the models Antigravity will see and use
  - model_name: ultra-router-chat # Simple chat
    litellm_params:
      model: router # Use the LiteLLM router for dynamic selection
      routing_strategy: "least-busy" # Route to the least busy model from the list below
      model_list: ["ultra-router-chat"] # Only Gemini for this group
      fallbacks: ["ultra-router-local-qwen3"] # Fallback to local if Gemini fails
      
  - model_name: ultra-router-fast # Vibe coding, quick creative
    litellm_params:
      model: router
      routing_strategy: "least-busy"
      model_list: ["ultra-router-fast-groq-1", "ultra-router-fast-groq-2"]
      fallbacks: ["ultra-router-local-deepseek-r1"]
      
  - model_name: ultra-router-coding # Pure code, refactoring
    litellm_params:
      model: router
      routing_strategy: "least-busy"
      model_list: ["ultra-router-coding-mistral-1", "ultra-router-coding-mistral-2"]
      fallbacks: ["ultra-router-local-deepseek-r1"]
      
  - model_name: ultra-router-auto # Dynamic selection based on complexity
    litellm_params:
      model: complexity-router # LiteLLM's built-in complexity router
      config:
        tiers:
          SIMPLE: ultra-router-chat
          MEDIUM: ultra-router-coding
          COMPLEX: ultra-router-fast
          REASONING: ultra-router-fast
        custom_markers:
          - "покроково"
          - "розбери"
          - "аналізуй"
          - "що буде якщо"
          - "напиши код"
          - "рефактори"
          - "step by step"
          - "explain"
          - "algorithm"
        default_model: ultra-router-chat
        fallback_on_error: ultra-router-local-qwen3
        
  - model_name: ultra-router-local # Direct access to local Ollama (unlimited)
    litellm_params:
      model: router
      routing_strategy: "least-busy"
      model_list: ["ultra-router-local-qwen3", "ultra-router-local-deepseek-r1", "ultra-router-local-gemma3"]
      # No fallbacks for local models, as they are already the last resort

# --- Global LiteLLM Proxy Settings ---
litellm_settings:
  master_key: ${LITELLM_MASTER_KEY}
  # Use `least-busy` for high availability / load balancing across multiple keys
  # `priority` is also an option if you want a strict order
  routing_strategy: "least-busy" 
  num_retries: 5
  request_timeout: 30 # Global timeout
  # fallback_strategy: exponential_backoff # Can be enabled for more advanced fallback logic

  # Fallback logic for API groups, if all API keys fail, route to local
  fallbacks:
    - {"ultra-router-chat": ["ultra-router-local"]}
    - {"ultra-router-fast": ["ultra-router-local"]}
    - {"ultra-router-coding": ["ultra-router-local"]}
  
  # Default fallback if no specific fallback is defined or all defined fail
  default_fallbacks: ultra-router-local # Routes to any available local model

server:
  host: "0.0.0.0"
  port: 4000
  litellm_master_key: ${LITELLM_MASTER_KEY} # Explicitly set master key for server
  enable_health_check: true
  health_check_interval: 10 # seconds
YAML_CONFIG
echo "✅ config-antigravity.yaml (v5.0) створений."

# --- 2. Перезапис docker-compose-router.yml ---
echo "2️⃣  Перезаписую docker-compose-router.yml..."
cat > "$WORKDIR/docker-compose-router.yml" <<'YAML_COMPOSE'
version: "3.9"
services:
  ultra-router:
    # Use the official LiteLLM image for stability and latest features
    image: ghcr.io/berriai/litellm:stable
    container_name: ultra-router-v55.3
    ports:
      - "4000:4000"
    environment:
      # Pass all necessary API keys as environment variables to the container
      # This allows LiteLLM to pick them up directly
      LITELLM_MASTER_KEY: "${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}"
      GEMINI_API_KEY: "${GEMINI_API_KEY:-gemini_TEST_KEY}"
      GROQ_API_KEY_1: "${GROQ_API_KEY_1:-groq_TEST_KEY_1}"
      GROQ_API_KEY_2: "${GROQ_API_KEY_2:-groq_TEST_KEY_2}"
      MISTRAL_API_KEY_1: "${MISTRAL_API_KEY_1:-mistral_TEST_KEY_1}"
      MISTRAL_API_KEY_2: "${MISTRAL_API_KEY_2:-mistral_TEST_KEY_2}"
      TOGETHER_API_KEY: "${TOGETHER_API_KEY:-together_TEST_KEY}"
      # OLLAMA_API_BASE for local models is set in config-antigravity.yaml
      LOG_LEVEL: "INFO"
      PYTHONUNBUFFERED: "1" # Ensures Python logs are flushed immediately
    volumes:
      # Mount the config file into the container
      - ./config-antigravity.yaml:/app/config.yaml:ro
      # Mount a local directory for logs
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 20s # Give more time for LiteLLM to start and load models

networks:
  predator-network:
    driver: bridge
YAML_COMPOSE
echo "✅ docker-compose-router.yml оновлений."

# --- 3. Оновлення .env.remote (тільки додавання, якщо немає) ---
echo "3️⃣  Додаю/оновлю змінні в $ENVFILE (додаються, якщо відсутні)..."
# Створюємо файл, якщо його не існує
touch "$ENVFILE"
# Додаємо ключі з placeholder'ами, якщо їх немає
grep -q "^LITELLM_MASTER_KEY=" "$ENVFILE" || echo 'LITELLM_MASTER_KEY="sk-antigravity-master-2026"' >> "$ENVFILE"
grep -q "^GEMINI_API_KEY=" "$ENVFILE" || echo 'GEMINI_API_KEY="gemini_YOUR_KEY"' >> "$ENVFILE"
grep -q "^GROQ_API_KEY_1=" "$ENVFILE" || echo 'GROQ_API_KEY_1="groq_YOUR_KEY_1"' >> "$ENVFILE"
grep -q "^GROQ_API_KEY_2=" "$ENVFILE" || echo 'GROQ_API_KEY_2="groq_YOUR_KEY_2"' >> "$ENVFILE"
grep -q "^MISTRAL_API_KEY_1=" "$ENVFILE" || echo 'MISTRAL_API_KEY_1="mistral_YOUR_KEY_1"' >> "$ENVFILE"
grep -q "^MISTRAL_API_KEY_2=" "$ENVFILE" || echo 'MISTRAL_API_KEY_2="mistral_YOUR_KEY_2"' >> "$ENVFILE"
grep -q "^TOGETHER_API_KEY=" "$ENVFILE" || echo 'TOGETHER_API_KEY="together_YOUR_KEY"' >> "$ENVFILE"
echo "✅ $ENVFILE оновлений."

# --- 4. Запуск Docker Compose ---
echo "4️⃣  Перезапускаю ULTRA-ROUTER через Docker Compose..."
cd "$WORKDIR"
docker compose down || true # Зупиняємо старий контейнер, якщо є
docker compose up -d --build # Запускаємо новий, збірка (якщо Dockerfile змінився)

echo "Чекаю 25 секунд на старт контейнера і ініціалізацію моделей..."
sleep 25

# --- 5. Перевірки ---
echo "============================================================"
echo "📊 РЕЗУЛЬТАТИ ПЕРЕВІРОК ULTRA-ROUTER v5.0                 "
echo "============================================================"

echo ""
echo "=== Docker Container Status ==="
docker ps --filter "name=ultra-router-v55.3" --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" || true

echo ""
echo "=== Last 200 lines of Docker Logs ==="
docker logs ultra-router-v55.3 --tail 200 || true

echo ""
echo "=== Health Endpoint (http://localhost:4000/health) ==="
curl -sS http://localhost:4000/health || true
echo ""

echo ""
echo "=== /v1/models (http://localhost:4000/v1/models) ==="
curl -sS http://localhost:4000/v1/models || true
echo ""

echo ""
echo "=== Test Completion Request (ultra-router-coding) ==="
echo "(Очікується відповідь від моделі, або 'invalid key' якщо ключі тестові)"
curl -sS -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-antigravity-master-2026" \
  -d '{"model":"ultra-router-coding","messages":[{"role":"user","content":"Напиши функцію на Python, що сортує список чисел"}],"max_tokens":120}' || true
echo ""

echo "============================================================"
echo "✅ НАЛАШТУВАННЯ ЗАВЕРШЕНО. ПЕРЕВІРТЕ РЕЗУЛЬТАТИ ВИЩЕ.     "
echo "============================================================"

echo ""
echo "--- НАСТУПНІ КРОКИ (для Antigravity Coder) ---"
echo "1. Заповніть реальні API ключі у файлі: $ENVFILE"
echo "2. Перезапустіть Docker Compose (виконайте цей скрипт ще раз)."
echo "3. Додайте 5 моделей в Antigravity UI (див. інструкції нижче)."
echo ""

echo "--- Інструкції для Antigravity UI ---"
echo "Перейдіть в Antigravity Coder (VS Code)."
echo "Відкрийте 'Settings' (⚙️) → 'Models'."
echo "Натисніть 'Add Custom Model' 5 разів і налаштуйте:"
echo ""
echo "Модель 1: Ultra-Router (Chat)"
echo "  Base URL: http://localhost:4000/v1"
echo "  API Key: sk-antigravity-master-2026"
echo "  Model ID: ultra-router-chat"
echo ""
echo "Модель 2: Ultra-Router (Fast)"
echo "  Base URL: http://localhost:4000/v1"
echo "  API Key: sk-antigravity-master-2026"
echo "  Model ID: ultra-router-fast"
echo ""
echo "Модель 3: Ultra-Router (Coding)"
echo "  Base URL: http://localhost:4000/v1"
echo "  API Key: sk-antigravity-master-2026"
echo "  Model ID: ultra-router-coding"
echo ""
echo "Модель 4: Ultra-Router (Auto)"
echo "  Base URL: http://localhost:4000/v1"
echo "  API Key: sk-antigravity-master-2026"
echo "  Model ID: ultra-router-auto"
echo ""
echo "Модель 5: Ultra-Router (Local)"
echo "  Base URL: http://localhost:4000/v1"
echo "  API Key: sk-antigravity-master-2026"
echo "  Model ID: ultra-router-local"
echo ""
echo "Після додавання всіх моделей натисніть 'Refresh models' в Antigravity."
echo ""
echo "------------------------------------------------------------"
echo "  PREDATOR Analytics Universal AI Router v5.0 готовий!     "
echo "------------------------------------------------------------"