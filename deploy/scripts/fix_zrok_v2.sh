#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# Глобальний фікс ZROK тунелів (API + K8s + SSH)
# ═══════════════════════════════════════════════════════════════════

set -e

ZROK_TOKEN="${ZROK_TOKEN:-}"
ZROK_BIN="${ZROK_BIN:-${HOME}/bin/zrok}"
PREDATOR_API_TARGET="${PREDATOR_API_TARGET:-http://127.0.0.1:8000}"
PREDATOR_K8S_TARGET="${PREDATOR_K8S_TARGET:-127.0.0.1:6443}"
PREDATOR_SSH_TARGET="${PREDATOR_SSH_TARGET:-127.0.0.1:6666}"
PREDATOR_API_SHARE="${PREDATOR_API_SHARE:-predator}"
PREDATOR_K8S_SHARE="${PREDATOR_K8S_SHARE:-predatork8s}"
PREDATOR_SSH_SHARE="${PREDATOR_SSH_SHARE:-predatorssh}"

# Створення директорії, якщо її ще немає.
mkdir -p ${HOME}/bin

# 1. Завантаження останньої версії zrok (v1.x+)
echo "📥 Перевірка/Оновлення zrok..."
ZROK_VERSION="1.1.11"
ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ]; then
    ZROK_PKG="zrok_${ZROK_VERSION}_linux_amd64.tar.gz"
else
    ZROK_PKG="zrok_${ZROK_VERSION}_linux_arm64.tar.gz"
fi

if [ ! -f "$ZROK_BIN" ] || [[ "$("$ZROK_BIN" version 2>/dev/null)" != *"$ZROK_VERSION"* ]]; then
    echo "⬇️  Завантаження v${ZROK_VERSION}..."
    wget -q "https://github.com/openziti/zrok/releases/download/v${ZROK_VERSION}/${ZROK_PKG}" -O /tmp/zrok.tar.gz
    tar -xzf /tmp/zrok.tar.gz -C /tmp
    mv /tmp/zrok "$ZROK_BIN"
    chmod +x "$ZROK_BIN"
fi

echo "✅ zrok версії $("$ZROK_BIN" version | head -n 1)"

# 2. Ініціалізація оточення.
echo "🔐 Авторизація оточення..."
if "$ZROK_BIN" status 2>/dev/null | grep -q "<<SET>>"; then
    echo "✅ zrok оточення вже активоване"
else
    if [ -z "$ZROK_TOKEN" ]; then
        echo "❌ ZROK_TOKEN не задано. Запустіть: ZROK_TOKEN=*** bash deploy/scripts/fix_zrok_v2.sh"
        exit 1
    fi
    "$ZROK_BIN" enable "$ZROK_TOKEN"
fi

# 3. Резервування публічного share для API (HTTP).
echo "🌐 Налаштування API Share (Public)..."
"$ZROK_BIN" reserve public "$PREDATOR_API_TARGET" --unique-name "$PREDATOR_API_SHARE" --backend-mode proxy || true

# 4. Резервування приватних shares для K8s та SSH (TCP).
echo "🛡️ Налаштування K8s та SSH (Private)..."
"$ZROK_BIN" reserve private "$PREDATOR_K8S_TARGET" --unique-name "$PREDATOR_K8S_SHARE" --backend-mode tcpTunnel || true
"$ZROK_BIN" reserve private "$PREDATOR_SSH_TARGET" --unique-name "$PREDATOR_SSH_SHARE" --backend-mode tcpTunnel || true

# 5. Створення systemd сервісів.
echo "⚙️  Створення systemd сервісів..."

create_service() {
    local name=$1
    local cmd=$2
    local desc=$3
    cat <<EOF | sudo tee /etc/systemd/system/${name}.service > /dev/null
[Unit]
Description=${desc}
After=network.target

[Service]
Type=simple
User=${USER}
Environment=HOME=${HOME}
ExecStart=${cmd}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    sudo systemctl daemon-reload
    sudo systemctl enable ${name}
    sudo systemctl restart ${name}
}

create_service "predator-api" "$ZROK_BIN share reserved $PREDATOR_API_SHARE --headless" "Predator API Zrok"
create_service "predator-k8s" "$ZROK_BIN share reserved $PREDATOR_K8S_SHARE --headless" "Predator K8s Zrok"
create_service "predator-ssh" "$ZROK_BIN share reserved $PREDATOR_SSH_SHARE --headless" "Predator SSH Zrok"

echo "✅ Сервіси налаштовані та запущені!"
echo "📊 Перевірка статусів:"
systemctl status predator-api predator-k8s predator-ssh --no-pager | grep "Active:"
