#!/usr/bin/env bash
# ================================================================
# Ultra-Router v5.0 — Деплой на NVIDIA сервер (194.177.1.240)
# Копіює конфіг + .env на сервер та запускає повний стек
#
# Використання:
#   ./deploy-ai-router.sh                 # деплой повного стеку
#   ./deploy-ai-router.sh --ollama-only   # тільки оновлення Ollama моделей
#   ./deploy-ai-router.sh --status        # перевірка статусу
# ================================================================
set -uo pipefail

NVIDIA_HOST="194.177.1.240"
NVIDIA_SSH_USER="${NVIDIA_SSH_USER:-root}"
NVIDIA_DEPLOY_DIR="/opt/ai-router"
ENV_FILE=".env.ultra-router"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SSH_CMD="ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${NVIDIA_SSH_USER}@${NVIDIA_HOST}"
SCP_CMD="scp -o StrictHostKeyChecking=no -o ConnectTimeout=10"

# ── Перевіряємо аргументи ─────────────────────────────────────────
MODE="deploy"
if [ "${1:-}" = "--ollama-only" ]; then MODE="ollama"; fi
if [ "${1:-}" = "--status" ]; then MODE="status"; fi

echo "Ultra-Router v5.0 — Деплой на NVIDIA (${NVIDIA_HOST})"
echo "════════════════════════════════════════════════════════════"

# ── Перевіряємо підключення до сервера ───────────────────────────
echo "Перевірка підключення до ${NVIDIA_HOST}..."
if ! ${SSH_CMD} "echo OK" >/dev/null 2>&1; then
    echo "ПОМИЛКА: Не вдалося підключитися до ${NVIDIA_HOST}"
    echo "         Перевірте SSH-ключі та доступність сервера."
    exit 1
fi
echo "Підключення успішне."

# ════════════════════════════════════════════════════════════════
# РЕЖИМ: status
# ════════════════════════════════════════════════════════════════
if [ "${MODE}" = "status" ]; then
    echo ""
    echo "Статус роутера на ${NVIDIA_HOST}:"
    ${SSH_CMD} "
        cd ${NVIDIA_DEPLOY_DIR} 2>/dev/null || { echo 'Не задеплоєно'; exit 0; }
        echo '--- Docker контейнери ---'
        docker compose -f docker-compose-router.yml ps 2>/dev/null || docker ps | grep ultra-router
        echo ''
        echo '--- Health check ---'
        curl -s http://localhost:4000/health/liveliness | head -1 || echo 'Недоступний'
        echo ''
        echo '--- Ollama моделі ---'
        ollama list 2>/dev/null || echo 'Ollama не встановлено'
    "
    exit 0
fi

# ════════════════════════════════════════════════════════════════
# РЕЖИМ: ollama-only
# ════════════════════════════════════════════════════════════════
if [ "${MODE}" = "ollama" ]; then
    echo ""
    echo "Оновлення Ollama моделей на ${NVIDIA_HOST}..."
    ${SSH_CMD} "
        set -e
        echo 'Завантаження qwen3:8b...'
        ollama pull qwen3:8b
        echo 'Завантаження deepseek-r1:7b...'
        ollama pull deepseek-r1:7b
        echo 'Завантаження gemma3:4b...'
        ollama pull gemma3:4b
        echo ''
        echo 'Встановлені моделі:'
        ollama list
    "
    echo "Ollama моделі оновлено!"
    exit 0
fi

# ════════════════════════════════════════════════════════════════
# РЕЖИМ: deploy (повний деплой)
# ════════════════════════════════════════════════════════════════

# ── Перевіряємо наявність .env ────────────────────────────────────
if [ ! -f "${SCRIPT_DIR}/${ENV_FILE}" ]; then
    echo "ПОМИЛКА: Файл ${ENV_FILE} не знайдено!"
    echo "         Виконайте: cp .env.example ${ENV_FILE} && nano ${ENV_FILE}"
    exit 1
fi

# ── Крок 1: Створюємо директорію на сервері ───────────────────────
echo ""
echo "Крок 1/5: Підготовка директорії ${NVIDIA_DEPLOY_DIR}..."
${SSH_CMD} "mkdir -p ${NVIDIA_DEPLOY_DIR}/logs ${NVIDIA_DEPLOY_DIR}/grafana/provisioning/datasources ${NVIDIA_DEPLOY_DIR}/grafana/provisioning/dashboards ${NVIDIA_DEPLOY_DIR}/grafana/dashboards ${NVIDIA_DEPLOY_DIR}/ssl"

# ── Крок 2: Копіюємо конфігурацію ────────────────────────────────
echo "Крок 2/5: Копіюємо конфігурацію..."
${SCP_CMD} \
    "${SCRIPT_DIR}/config-antigravity.yaml" \
    "${SCRIPT_DIR}/docker-compose-router.yml" \
    "${SCRIPT_DIR}/prometheus.yml" \
    "${SCRIPT_DIR}/nginx.conf" \
    "${NVIDIA_SSH_USER}@${NVIDIA_HOST}:${NVIDIA_DEPLOY_DIR}/"

${SCP_CMD} -r \
    "${SCRIPT_DIR}/grafana/" \
    "${NVIDIA_SSH_USER}@${NVIDIA_HOST}:${NVIDIA_DEPLOY_DIR}/"

# ── Крок 3: Копіюємо .env ─────────────────────────────────────────
echo "Крок 3/5: Копіюємо .env (без виводу в лог)..."
${SCP_CMD} \
    "${SCRIPT_DIR}/${ENV_FILE}" \
    "${NVIDIA_SSH_USER}@${NVIDIA_HOST}:${NVIDIA_DEPLOY_DIR}/.env.ultra-router"

# ── Крок 4: Перевіряємо Ollama + Docker на сервері ───────────────
echo "Крок 4/5: Перевірка Ollama та Docker на сервері..."
${SSH_CMD} "
    # Перевірка Docker
    if ! command -v docker &>/dev/null; then
        echo 'УВАГА: Docker не встановлено — встановлюємо...'
        curl -fsSL https://get.docker.com | sh
    fi

    # Перевірка Ollama
    if ! command -v ollama &>/dev/null; then
        echo 'УВАГА: Ollama не встановлено — встановлюємо...'
        curl -fsSL https://ollama.com/install.sh | sh
        systemctl enable ollama --now 2>/dev/null || ollama serve &
        sleep 3
    fi

    # Перевірка моделей Ollama
    MODELS=\$(ollama list 2>/dev/null | awk '{print \$1}' | tail -n +2)
    for model in qwen3:8b deepseek-r1:7b gemma3:4b; do
        if ! echo \"\$MODELS\" | grep -q \"\$model\"; then
            echo \"Завантаження \$model...\"
            ollama pull \"\$model\" &
        else
            echo \"OK: \$model вже встановлено\"
        fi
    done
    wait
"

# ── Крок 5: Запускаємо стек ───────────────────────────────────────
echo "Крок 5/5: Запуск Ultra-Router стеку..."
${SSH_CMD} "
    cd ${NVIDIA_DEPLOY_DIR}
    docker compose -f docker-compose-router.yml down 2>/dev/null || true
    docker compose -f docker-compose-router.yml pull --quiet
    docker compose -f docker-compose-router.yml up -d --force-recreate

    echo 'Очікуємо запуск (~30 сек)...'
    for i in \$(seq 1 10); do
        sleep 3
        if curl -s --connect-timeout 2 http://localhost:4000/health/liveliness >/dev/null 2>&1; then
            echo 'Router готовий!'
            break
        fi
        echo \"  Спроба \${i}/10...\"
    done
"

# ── Підсумок ──────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════════════════"
echo " ДЕПЛОЙ ЗАВЕРШЕНО"
echo ""
echo " NVIDIA Router : http://${NVIDIA_HOST}:4000"
echo " Grafana       : http://${NVIDIA_HOST}:3001"
echo " Prometheus    : http://${NVIDIA_HOST}:9090"
echo ""
echo " Для Mac (через тунель):"
echo "   ./start-ultra-router.sh"
echo ""
echo " Перевірка:"
echo "   ./test-router.sh http://${NVIDIA_HOST}:4000"
echo "   ./deploy-ai-router.sh --status"
echo "════════════════════════════════════════════════════════════"
