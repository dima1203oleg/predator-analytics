#!/usr/bin/env bash
# 🦅 PREDATOR Analytics v63.0-ELITE — Telegram Status Ping
# Автоматичний звіт про стан сервера NVIDIA (dima@dev)
# Канонічна локалізація: УКРАЇНСЬКА (HR-03)

set -euo pipefail

# 1. Знаходження директорії проекту та завантаження .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Спроба завантажити змінні оточення з .env
ENV_FILE="$PROJECT_ROOT/.env"
if [ -f "$ENV_FILE" ]; then
    # Експортуємо змінні, ігноруючи коментарі та пусті рядки
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
fi

# Дефолтні значення якщо .env не знайдено або пустий
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_ADMIN_ID="${TELEGRAM_ADMIN_ID:-1020504147}" # Канонічний ID з налаштувань

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ Помилка: TELEGRAM_BOT_TOKEN не встановлено у .env файлі!" >&2
    exit 1
fi

# 2. Збір метрик системи
HOSTNAME=$(hostname)
IP_ADDR=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
UPTIME_STR=$(uptime -p)

# CPU Load
CPU_LOAD=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')

# RAM Usage
RAM_FREE_OUT=$(free -m)
RAM_TOTAL=$(echo "$RAM_FREE_OUT" | awk '/^Mem:/ {print $2}')
RAM_USED=$(echo "$RAM_FREE_OUT" | awk '/^Mem:/ {print $3}')
RAM_PERCENT=$(awk "BEGIN {print int(($RAM_USED/$RAM_TOTAL)*100)}")

# Disk Usage (Root partition)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')

# GPU Stats (NVIDIA-SMI)
GPU_INFO="Н/Д ⚠️"
if command -v nvidia-smi &> /dev/null; then
    GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | head -n1)
    GPU_TEMP=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits | head -n1)
    GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits | head -n1)
    GPU_VRAM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits | head -n1)
    GPU_VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | head -n1)
    GPU_INFO="${GPU_NAME} | 🌡️ ${GPU_TEMP}°C | 📊 Утилізація: ${GPU_UTIL}% | 💾 VRAM: ${GPU_VRAM_USED}/${GPU_VRAM_TOTAL} MiB"
fi

# Docker & Services Status
DOCKER_STATUS="АКТИВНИЙ ✅"
if ! systemctl is-active --quiet docker 2>/dev/null; then
    DOCKER_STATUS="ОФЛАЙН ⚠️"
fi

# 3. Формування повідомлення (100% українська мова відповідно до HR-03, HR-04)
MSG="🦅 *PREDATOR Analytics v63.0-ELITE*
🔔 *ПІНГ СТАТУСУ СЕРВЕРА*

🖥️ *Вузол:* \`${HOSTNAME}\` (\`${IP_ADDR}\`)
⏱️ *Аптайм:* \`${UPTIME_STR}\`

📊 *МЕТРИКИ СИСТЕМИ:*
├─ *Завантаження CPU:* \`${CPU_LOAD}\`
├─ *Оперативна пам'ять:* \`${RAM_PERCENT}%\` (\`${RAM_USED} МБ\` / \`${RAM_TOTAL} МБ\`)
└─ *Дисковий простір (/):* \`${DISK_USAGE}\`

🎮 *NVIDIA GPU СТАТУС:*
└─ \`${GPU_INFO}\`

🛡️ *ІНФРАСТРУКТУРА:*
├─ *Контейнери Docker:* \`${DOCKER_STATUS}\`
└─ *Статус зв'язку:* \`ОПТИМАЛЬНО ✅\`

📅 _Час генерації: $(date '+%Y-%m-%d %H:%M:%S %Z')_"

# URL-кодування повідомлення
ENCODED_MSG=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$MSG'''))")

# 4. Надсилання повідомлення в Telegram
URL="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
RESPONSE=$(curl -s -X POST "$URL" -d "chat_id=${TELEGRAM_ADMIN_ID}&text=${ENCODED_MSG}&parse_mode=Markdown" || echo "FAILED")

if [[ "$RESPONSE" == *"\"ok\":true"* ]]; then
    echo "✅ Статус-пінг успішно надіслано в Telegram!"
else
    echo "❌ Помилка надсилання повідомлення в Telegram!" >&2
    echo "Відповідь сервера: $RESPONSE" >&2
    exit 1
fi
