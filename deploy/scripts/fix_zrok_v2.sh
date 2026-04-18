#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# 🦅 PREDATOR Analytics v56.5-ELITE
# Глобальний фікс ZROK тунелів (API + K8s + SSH)
# ═══════════════════════════════════════════════════════════════════

set -e

ZROK_TOKEN="1eeje4um7yvA"
ZROK_BIN="${HOME}/bin/zrok"

# Створення директорії якщо немає
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

# 2. Ініціалізація оточення
echo "🔐 Авторизація оточення..."
"$ZROK_BIN" disable 2>/dev/null || true
"$ZROK_BIN" enable "$ZROK_TOKEN" || echo "⚠️  Оточення вже активоване або помилка"

# 3. Резервування та запуск Public Share для API (HTTP)
echo "🌐 Налаштування API Share (Public)..."
# Видаляємо стару резервацію якщо є (може знадобитись допомога в UI або інший запуск)
"$ZROK_BIN" release predator 2>/dev/null || true

# Резервуємо знову
"$ZROK_BIN" reserve public http://127.0.0.1:8000 --unique-name predator --backend-mode proxy || true

# 4. Резервування Private Share для K8s та SSH (TCP)
echo "🛡️ Налаштування K8s та SSH (Private)..."
"$ZROK_BIN" reserve private 127.0.0.1:6443 --unique-name predatork8s --backend-mode tcpTunnel || true
"$ZROK_BIN" reserve private 127.0.0.1:6666 --unique-name predatorssh --backend-mode tcpTunnel || true

# 5. Створення systemd сервісів
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

create_service "predator-api" "$ZROK_BIN share reserved predator --headless" "Predator API Zrok"
create_service "predator-k8s" "$ZROK_BIN share reserved predatork8s --headless" "Predator K8s Zrok"
create_service "predator-ssh" "$ZROK_BIN share reserved predatorssh --headless" "Predator SSH Zrok"

echo "✅ Сервіси налаштовані та запущені!"
echo "📊 Перевірка статусів:"
systemctl status predator-api predator-k8s predator-ssh --no-pager | grep "Active:"
