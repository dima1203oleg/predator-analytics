#!/usr/bin/env bash
# 🦅 PREDATOR Analytics v65.7-ELITE — zrok SSH Tunnel для NVIDIA
# Запускається на сервері, створює зворотний zrok тунель для SSH
# Надсилання URL в Telegram для віддаленого доступу

set -euo pipefail

TOKEN="${ZROK_TOKEN:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_ADMIN_ID="${TELEGRAM_ADMIN_ID:-1020504147}"
TUNNEL_NAME="nvidia-ssh-$(date +%s)"
ZROK_LOG="/tmp/zrok-ssh.log"

echo "=== PREDATOR zrok SSH Tunnel ==="

# 1. Перевірити zrok
if ! command -v zrok &>/dev/null; then
    echo "❌ zrok не встановлено. Встановлення..."
    curl -sL https://github.com/openziti/zrok/releases/latest/download/zrok-linux-amd64.tar.gz | tar -xzf - -C /tmp/
    sudo mv /tmp/zrok /usr/local/bin/ 2>/dev/null || mv /tmp/zrok ~/bin/ 2>/dev/null || true
fi

# 2. Enable (якщо токен є)
if [ -n "$TOKEN" ]; then
    zrok enable "$TOKEN" 2>/dev/null || true
fi

# 3. Зупинити попередній тунель
pkill -f "zrok.*share.*22" 2>/dev/null || true
sleep 1

# 4. Створити тунель
echo "[1/3] Створення zrok тунелю для SSH (порт 22)..."
nohup zrok share private 127.0.0.1:22 --backend-mode tcpTunnel > "$ZROK_LOG" 2>&1 &
ZROK_PID=$!
sleep 5

# 5. Отримати URL
ZROK_URL=$(grep -oP 'https://[a-zA-Z0-9]+\.share\.zrok\.io' "$ZROK_LOG" 2>/dev/null | head -1)

if [ -z "$ZROK_URL" ]; then
    echo "⚠️ URL не знайдено в логах. Перевірка через API..."
    ZROK_URL=$(zrok status 2>/dev/null | grep -oP 'https://[a-zA-Z0-9]+\.share\.zrok\.io' | head -1)
fi

# 6. Надіслати в Telegram
if [ -n "$ZROK_URL" ] && [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    echo "[2/3] URL: $ZROK_URL"
    MSG="🦅 *PREDATOR zrok SSH Tunnel*

🔗 *URL:* \`$ZROK_URL\`
📍 *Сервер:* \`$(hostname)\`
⏰ *Час:* \`$(date '+%Y-%m-%d %H:%M:%S')\`

*Підключення:*
\`\`\`
ssh -o ProxyCommand='zrok proxy tcpTunnel $ZROK_URL' dima@localhost
\`\`\`"

    ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$MSG'''))")
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d "chat_id=${TELEGRAM_ADMIN_ID}&text=${ENCODED}&parse_mode=Markdown" >/dev/null
    echo "[3/3] ✅ URL надіслано в Telegram"
else
    echo "⚠️ URL не отримано або TELEGRAM_BOT_TOKEN не встановлено"
    echo "Лог:"
    cat "$ZROK_LOG"
fi

# 7. Додати deploy key
DEPLOY_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICM36ucGJ5XcZNB1USfIOnQfn+0EnWjq9Ob0WyHCvKf+ predator-nvidia-deploy"
mkdir -p ~/.ssh
if ! grep -qF "$DEPLOY_KEY" ~/.ssh/authorized_keys 2>/dev/null; then
    echo "$DEPLOY_KEY" >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo "✅ Deploy key додано"
else
    echo "✅ Deploy key вже існує"
fi

echo "=== Готово ==="
