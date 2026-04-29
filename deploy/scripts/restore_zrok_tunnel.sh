#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# Скрипт відновлення ZROK тунелю на NVIDIA сервері
# ═══════════════════════════════════════════════════════════════════
#
# ВИКОРИСТАННЯ: bash deploy/scripts/restore_zrok_tunnel.sh
#
# Запустіть цей скрипт через SSH на NVIDIA сервері (194.177.1.240):
#   ssh user@194.177.1.240 'bash -s' < deploy/scripts/restore_zrok_tunnel.sh
# ═══════════════════════════════════════════════════════════════════

set -e

ZROK_TOKEN="${ZROK_TOKEN:-}"
SHARE_NAME="${PREDATOR_API_SHARE:-predator}"
BACKEND_TARGET="${PREDATOR_API_TARGET:-http://192.168.88.254:80}"   # Nginx з LiteLLM + API
LOG_FILE="/tmp/zrok_predator.log"
PID_FILE="/tmp/zrok_predator.pid"

echo "🦅 ══════════════════════════════════════════════════"
echo "   PREDATOR — Відновлення ZROK тунелю"
echo "   Share: ${SHARE_NAME}"
echo "═══════════════════════════════════════════════════════"

# 1. Перевірка наявності zrok
if ! command -v zrok &>/dev/null; then
    echo "❌ zrok не знайдено. Встановлення..."
    ZROK_VERSION="${ZROK_VERSION:-1.1.11}"
    ARCH=$(uname -m)
    if [ "$ARCH" == "x86_64" ]; then
        ZROK_PKG="zrok_${ZROK_VERSION}_linux_amd64.tar.gz"
    else
        ZROK_PKG="zrok_${ZROK_VERSION}_linux_arm64.tar.gz"
    fi
    wget -q "https://github.com/openziti/zrok/releases/download/v${ZROK_VERSION}/${ZROK_PKG}" -O /tmp/zrok.tar.gz
    tar -xzf /tmp/zrok.tar.gz --wildcards '*/zrok' -O > /usr/local/bin/zrok
    chmod +x /usr/local/bin/zrok
    echo "✅ zrok встановлено!"
fi

# 2. Зупинка старого процесу якщо є
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    kill "$OLD_PID" 2>/dev/null && echo "⏹️  Зупинено старий процес PID=${OLD_PID}" || true
    rm -f "$PID_FILE"
fi
pkill -f "zrok share" 2>/dev/null || true
sleep 1

# 3. Ініціалізація середовища (якщо не ініціалізовано)
zrok status 2>/dev/null | grep -q "<<SET>>" || {
    if [ -z "$ZROK_TOKEN" ]; then
        echo "❌ ZROK_TOKEN не задано. Запустіть: ZROK_TOKEN=*** bash deploy/scripts/restore_zrok_tunnel.sh"
        exit 1
    fi
    echo "🔑 Ініціалізація ZROK середовища..."
    zrok enable "${ZROK_TOKEN}" || echo "⚠️ Середовище вже ініціалізовано (пропускаємо)"
}

# 4. Перевірка чи зарезервований share 'predator' існує
echo "🔍 Перевірка резерву '${SHARE_NAME}'..."
if zrok status 2>/dev/null | grep -q "$SHARE_NAME"; then
    echo "✅ Зарезервований share '${SHARE_NAME}' знайдено. Підключення..."
    MODE="reserved"
else
    echo "⚠️ Зарезервований share не знайдено. Спроба резервування..."
    zrok reserve public \
        --backend-mode proxy \
        --unique-name "${SHARE_NAME}" \
        "${BACKEND_TARGET}" && MODE="reserved" || MODE="public"
fi

# 5. Запуск тунелю
echo ""
echo "🌐 Запуск ZROK тунелю..."
rm -f "$LOG_FILE"

if [ "$MODE" == "reserved" ]; then
    nohup zrok share reserved "${SHARE_NAME}" \
        --headless \
        --override-endpoint "${BACKEND_TARGET}" > "$LOG_FILE" 2>&1 &
else
    nohup zrok share public "${BACKEND_TARGET}" \
        --backend-mode proxy \
        --headless > "$LOG_FILE" 2>&1 &
fi

echo $! > "$PID_FILE"
echo "🔄 Процес PID=$(cat $PID_FILE) запущено. Очікування URL..."

# 6. Зчитування публічного URL
PUBLIC_URL=""
for i in $(seq 1 30); do
    sleep 1
    if [ -f "$LOG_FILE" ]; then
        URL=$(grep -oE 'https://[a-z0-9_\-]+\.share\.zrok\.io' "$LOG_FILE" | head -1)
        if [ -n "$URL" ]; then
            PUBLIC_URL="$URL"
            break
        fi
        # Перевірка на помилку
        if grep -q "service.*not found" "$LOG_FILE"; then
            echo "❌ Помилка: сервіс не знайдено в Ziti мережі."
            echo "   Деталі: $(grep 'service.*not found' "$LOG_FILE")"
            break
        fi
    fi
done

# 7. Результат
echo ""
echo "═══════════════════════════════════════════════════════"
if [ -n "$PUBLIC_URL" ]; then
    echo "✅ ZROK тунель активний!"
    echo "   URL:     ${PUBLIC_URL}"
    echo "   API:     ${PUBLIC_URL}/api/v1"
    echo "   Health:  ${PUBLIC_URL}/health"
    echo ""
    echo "📋 Скопіюйте до .env.local на Mac:"
    echo "─────────────────────────────────"
    echo "VITE_API_URL=${PUBLIC_URL}/api/v1"
    echo "VITE_LITELLM_URL=${PUBLIC_URL}/v1"
    echo "VITE_ENABLE_MOCK_API=false"
    echo "VITE_MODE=remote"
    echo "─────────────────────────────────"
    echo ""
    echo "   Записую URL у файл ${HOME}/.zrok/predator_share.txt"
    echo "$PUBLIC_URL" > "${HOME}/.zrok/predator_share.txt"
    echo "✅ Готово! [PID=$(cat $PID_FILE)]"
else
    echo "❌ URL не отримано. Логи:"
    cat "$LOG_FILE"
    echo ""
    echo "💡 Рекомендація: видаліть і перестворіть резерв:"
    echo "   zrok release ${SHARE_NAME}"
    echo "   zrok reserve public --backend-mode proxy --unique-name ${SHARE_NAME} ${BACKEND_TARGET}"
fi
echo "═══════════════════════════════════════════════════════"
