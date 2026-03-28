#!/usr/bin/env bash
# ================================================================
# Ultra-Router — Скрипт запуску LiteLLM Proxy
# PREDATOR Analytics v55.1
# ================================================================
# Використання:
#   ./start-ultra-router.sh           — запуск з .env файлу
#   ./start-ultra-router.sh --stop    — зупинка контейнера
#   ./start-ultra-router.sh --status  — статус контейнера
#   ./start-ultra-router.sh --logs    — логи контейнера
# ================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/ultra-router-config.yaml"
ENV_FILE="${SCRIPT_DIR}/.env.ultra-router"
CONTAINER_NAME="litellm-ultra-router"
LITELLM_IMAGE="ghcr.io/berriai/litellm:main-stable"
PORT=4000

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ------------------------------------------------------------------
# Зупинка
# ------------------------------------------------------------------
if [[ "${1:-}" == "--stop" ]]; then
  log_info "Зупинка контейнера ${CONTAINER_NAME}..."
  docker stop "${CONTAINER_NAME}" 2>/dev/null && docker rm "${CONTAINER_NAME}" 2>/dev/null
  log_ok "Контейнер зупинено та видалено."
  exit 0
fi

# ------------------------------------------------------------------
# Статус
# ------------------------------------------------------------------
if [[ "${1:-}" == "--status" ]]; then
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    log_ok "Контейнер ${CONTAINER_NAME} працює"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  else
    log_warn "Контейнер ${CONTAINER_NAME} не запущено"
  fi
  exit 0
fi

# ------------------------------------------------------------------
# Логи
# ------------------------------------------------------------------
if [[ "${1:-}" == "--logs" ]]; then
  docker logs -f "${CONTAINER_NAME}" 2>/dev/null || log_error "Контейнер не знайдено"
  exit 0
fi

# ------------------------------------------------------------------
# Перевірка залежностей
# ------------------------------------------------------------------
if ! command -v docker &> /dev/null; then
  log_error "Docker не встановлено. Встановіть: https://docs.docker.com/get-docker/"
  exit 1
fi

if [[ ! -f "${CONFIG_FILE}" ]]; then
  log_error "Конфіг не знайдено: ${CONFIG_FILE}"
  exit 1
fi

# ------------------------------------------------------------------
# Перевірка .env файлу
# ------------------------------------------------------------------
if [[ ! -f "${ENV_FILE}" ]]; then
  log_warn ".env файл не знайдено: ${ENV_FILE}"
  log_info "Створюю шаблон .env файлу..."
  cat > "${ENV_FILE}" << 'ENVEOF'
# ================================================================
# Ultra-Router — API ключі (100% безплатні провайдери)
# ================================================================
# Отримай ключі на:
#   DeepSeek:    https://platform.deepseek.com/api_keys
#   Groq:        https://console.groq.com/keys
#   Gemini:      https://aistudio.google.com/apikey
#   Together AI: https://api.together.xyz/settings/api-keys
#   Mistral:     https://console.mistral.ai/api-keys
# ================================================================

LITELLM_MASTER_KEY=sk-antigravity-master-2026

# Провайдери
DEEPSEEK_API_KEY=your-deepseek-key-here
GROQ_API_KEY=your-groq-key-here
GEMINI_API_KEY=your-gemini-key-here
TOGETHER_API_KEY=your-together-key-here
MISTRAL_API_KEY=your-mistral-key-here
ENVEOF
  log_warn "Заповніть API ключі у файлі: ${ENV_FILE}"
  log_warn "Після заповнення запустіть скрипт повторно."
  exit 1
fi

# Перевірка що ключі заповнені
source "${ENV_FILE}"
MISSING_KEYS=()
[[ "${DEEPSEEK_API_KEY:-}" == "your-deepseek-key-here" || -z "${DEEPSEEK_API_KEY:-}" ]] && MISSING_KEYS+=("DEEPSEEK_API_KEY")
[[ "${GROQ_API_KEY:-}" == "your-groq-key-here" || -z "${GROQ_API_KEY:-}" ]] && MISSING_KEYS+=("GROQ_API_KEY")
[[ "${GEMINI_API_KEY:-}" == "your-gemini-key-here" || -z "${GEMINI_API_KEY:-}" ]] && MISSING_KEYS+=("GEMINI_API_KEY")
[[ "${TOGETHER_API_KEY:-}" == "your-together-key-here" || -z "${TOGETHER_API_KEY:-}" ]] && MISSING_KEYS+=("TOGETHER_API_KEY")
[[ "${MISTRAL_API_KEY:-}" == "your-mistral-key-here" || -z "${MISTRAL_API_KEY:-}" ]] && MISSING_KEYS+=("MISTRAL_API_KEY")

if [[ ${#MISSING_KEYS[@]} -gt 0 ]]; then
  log_error "Незаповнені API ключі: ${MISSING_KEYS[*]}"
  log_warn "Відредагуйте файл: ${ENV_FILE}"
  exit 1
fi

# ------------------------------------------------------------------
# Зупинка старого контейнера (якщо є)
# ------------------------------------------------------------------
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  log_info "Зупинка існуючого контейнера..."
  docker stop "${CONTAINER_NAME}" 2>/dev/null || true
  docker rm "${CONTAINER_NAME}" 2>/dev/null || true
fi

# ------------------------------------------------------------------
# Запуск LiteLLM Proxy
# ------------------------------------------------------------------
log_info "Запуск Ultra-Router на порту ${PORT}..."
echo ""

docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:4000" \
  --env-file "${ENV_FILE}" \
  -v "${CONFIG_FILE}:/app/config.yaml:ro" \
  --restart unless-stopped \
  "${LITELLM_IMAGE}" \
  --config /app/config.yaml

echo ""
log_ok "Ultra-Router запущено!"
echo ""
echo -e "  ${CYAN}Endpoint:${NC}   http://localhost:${PORT}/v1"
echo -e "  ${CYAN}Health:${NC}     http://localhost:${PORT}/health"
echo -e "  ${CYAN}Models:${NC}     http://localhost:${PORT}/v1/models"
echo -e "  ${CYAN}Dashboard:${NC}  http://localhost:${PORT}/ui"
echo ""
echo -e "  ${YELLOW}Antigravity Settings:${NC}"
echo -e "    Base URL:  ${GREEN}http://localhost:${PORT}/v1${NC}"
echo -e "    API Key:   ${GREEN}sk-antigravity-master-2026${NC}"
echo ""
echo -e "  Додайте 4 моделі в Antigravity → Settings → Models → Add Custom Model:"
echo -e "    1. ${CYAN}Ultra-Router (Coding)${NC}    → ultra-router-coding"
echo -e "    2. ${CYAN}Ultra-Router (Fast)${NC}      → ultra-router-fast"
echo -e "    3. ${CYAN}Ultra-Router (Reasoning)${NC} → ultra-router-reasoning"
echo -e "    4. ${CYAN}Ultra-Router (Chat)${NC}      → ultra-router-chat"
echo ""
log_info "Логи: ./start-ultra-router.sh --logs"
