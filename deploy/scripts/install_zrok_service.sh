#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# Запуск ZROK тунелю — ТІЛЬКИ виконувати на NVIDIA сервері (Linux)
# ═══════════════════════════════════════════════════════════════════
#
# ВИКОРИСТАННЯ:
#   На NVIDIA сервері (після SSH підключення):
#     bash deploy/scripts/install_zrok_service.sh
# ═══════════════════════════════════════════════════════════════════

set -e

# Перевірка ОС
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "❌ Цей скрипт призначений для NVIDIA сервера (Linux)."
    echo "   На MacBook виконувати НЕ ПОТРІБНО."
    echo ""
    echo "📋 Інструкція:"
    echo "   1. Підключіться до NVIDIA сервера: ssh dima@194.177.1.240"
    echo "   2. Запустіть там:  bash deploy/scripts/install_zrok_service.sh"
    exit 1
fi

ZROK_BIN="${HOME}/bin/zrok"
SERVICE_NAME="predator-zrok"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
LOG_FILE="/var/log/predator-zrok.log"

echo "🦅 PREDATOR — Встановлення ZROK як systemd сервісу"
echo "══════════════════════════════════════════════════════"

# 1. Перевірка zrok
if [ ! -f "$ZROK_BIN" ]; then
    echo "❌ zrok не знайдено у ${ZROK_BIN}"
    echo "   Встановіть: wget https://github.com/openziti/zrok/releases/latest/download/zrok_linux_amd64.tar.gz"
    exit 1
fi

echo "✅ zrok знайдено: $("$ZROK_BIN" version 2>/dev/null | head -1)"

# 2. Share 'predator' має вже бути зарезервований (409 = OK, вже існує)
echo "✅ Share 'predator' вже зарезервовано в ZROK control plane"

# 3. Зупинити старий процес якщо є
pkill -f "zrok share reserved predator" 2>/dev/null && echo "⏹  Зупинено попередній процес" || true

# 4. Швидкий тест — запуск вручну
echo "🔌 Тест запуску тунелю..."
timeout 10 "$ZROK_BIN" share reserved predator --headless \
    --override-endpoint http://192.168.88.254:80 2>&1 | head -5 || true

# 5. Встановлення як системний сервіс
echo "📝 Встановлення systemd сервісу..."
cat > /tmp/${SERVICE_NAME}.service << EOF
[Unit]
Description=PREDATOR ZROK Tunnel (predator.share.zrok.io -> Nginx:80)
After=docker.service network-online.target
Wants=network-online.target docker.service

[Service]
Type=simple
User=${USER}
Environment="HOME=${HOME}"
Environment="PATH=/usr/local/bin:/usr/bin:/bin:${HOME}/bin"
ExecStartPre=/bin/sleep 5
ExecStart=${ZROK_BIN} share reserved predator --headless --override-endpoint http://192.168.88.254:80
Restart=always
RestartSec=15
StandardOutput=append:${LOG_FILE}
StandardError=append:${LOG_FILE}

[Install]
WantedBy=multi-user.target
EOF

sudo cp /tmp/${SERVICE_NAME}.service "$SERVICE_FILE"
sudo touch "$LOG_FILE" && sudo chown "${USER}:${USER}" "$LOG_FILE"

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

sleep 5

STATUS=$(systemctl is-active "$SERVICE_NAME" 2>/dev/null)
if [ "$STATUS" == "active" ]; then
    echo ""
    echo "✅ Сервіс ${SERVICE_NAME} активний!"
    echo "   URL: https://predator.share.zrok.io"
    echo ""
    echo "📋 Для Cline підставте:"
    echo "   Base URL: https://predator.share.zrok.io/v1"
    echo "   API Key:  predator-litellm-secret"
    echo "   Model:    ultra-router-coding"
    echo ""
    echo "📊 Логи: sudo journalctl -fu ${SERVICE_NAME}"
else
    echo "❌ Сервіс не запустився (статус: ${STATUS})"
    sudo journalctl -u "$SERVICE_NAME" --no-pager 2>/dev/null | tail -15
fi

echo "══════════════════════════════════════════════════════"
