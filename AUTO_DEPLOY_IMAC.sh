#!/bin/bash
# AUTO_DEPLOY_IMAC.sh - v60.6-ELITE
# Повний автоматичний деплой PREDATOR на iMac Compute Node
# Виправлено: SSH auth, nohup path, ML залежності, Docker перевірка

set -euo pipefail

echo "🚀 Активація Predator Analytics Full Stack..."

# ─── Конфігурація ───────────────────────────────────────────────
IMAC_USER="dmytrokizima"
IMAC_PASS="1204"
# SSH опції: тільки пароль (без ключів), без перевірки хоста
SSH_OPTS="-o StrictHostKeyChecking=no -o PubkeyAuthentication=no -o PreferredAuthentications=password -o ConnectTimeout=10"

export SSHPASS="$IMAC_PASS"

# ─── 1. Очищення MacBook ────────────────────────────────────────
echo "🧹 Звільнення порту 3030 на MacBook..."
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# ─── 2. Пошук доступного IP iMac ───────────────────────────────
echo "🔍 Пошук доступного IP для iMac..."
IMAC_IPS=("192.168.0.200" "10.8.0.1" "192.168.0.199" "192.168.0.114")
IMAC_IP=""

for ip in "${IMAC_IPS[@]}"; do
    echo "⚡ Перевірка $ip..."
    if nc -z -G 3 "$ip" 22 2>/dev/null; then
        IMAC_IP="$ip"
        echo "✅ Знайдено робочий IP: $IMAC_IP"
        break
    fi
done

if [ -z "$IMAC_IP" ]; then
    echo "⚠️  Жоден IP не відповідає. Використовую дефолтний: 192.168.0.200"
    IMAC_IP="192.168.0.200"
fi

# Функція для виконання SSH-команд
imac_ssh() {
    sshpass -e ssh $SSH_OPTS "${IMAC_USER}@${IMAC_IP}" "$1"
}

echo "🌌 Надсилання команд на iMac ($IMAC_IP)..."

# ─── 3. Оновлення .env.local (Vite Proxy) ──────────────────────
echo "📝 Оновлення .env.local..."
cat <<EOF > /Users/Shared/Predator_60/apps/predator-analytics-ui/.env.local
# ✅ Route through Vite Proxy -> iMac Core API (port 8000)
VITE_API_URL=/api/v1
VITE_LITELLM_URL=/v1
VITE_ENABLE_MOCK_API=false
VITE_MODE=remote
VITE_PREDATOR_NODE=SOVEREIGN
VITE_BACKEND_PROXY_TARGET=http://$IMAC_IP:8000
EOF

# ─── 4. Синхронізація коду через rsync ──────────────────────────
echo "📦 Синхронізація коду на iMac..."
sshpass -e rsync -az --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='dist' \
    --exclude='coverage' \
    -e "ssh $SSH_OPTS" \
    /Users/Shared/Predator_60/ \
    "${IMAC_USER}@${IMAC_IP}:~/Predator_60/"

# ─── 5. Перевірка Docker на iMac ───────────────────────────────
echo "🐳 Перевірка Docker на iMac..."
if ! imac_ssh "docker ps >/dev/null 2>&1"; then
    echo "🏗️ Docker не запущено. Запуск Colima..."
    imac_ssh "export PATH='/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH'; colima start --cpu 4 --memory 6 --disk 60 2>&1 || echo 'Colima вже запущена або помилка, продовжуємо...'"
    echo "⏳ Очікування Docker (15с)..."
    sleep 15
fi

# ─── 6. Зупинка старого uvicorn (якщо є) ───────────────────────
echo "🔄 Зупинка старого API-процесу..."
imac_ssh "pkill -f 'uvicorn app.main:app' 2>/dev/null || true"
sleep 2

# ─── 7. Встановлення залежностей + запуск uvicorn ───────────────
echo "🐍 Встановлення Python-залежностей та запуск Core API..."
imac_ssh "export PATH='/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH'
cd ~/Predator_60/services/core-api
python3.12 -m venv .venv 2>/dev/null || python3 -m venv .venv
source .venv/bin/activate
pip install -q -r requirements.txt 2>&1 | tail -5
pip install -q -e ../../libs/predator-common 2>&1 | tail -3
echo '✅ Залежності встановлено. Запуск uvicorn...'
/usr/bin/nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 > ~/predator_api.log 2>&1 &
sleep 4
echo '--- Лог uvicorn ---'
cat ~/predator_api.log | tail -20
"

# ─── 8. Запуск K3d кластера (фон, якщо Docker працює) ──────────
echo "☸️ Запуск K3d кластера з 8 DBs (фонове завдання)..."
imac_ssh "export PATH='/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH'
if docker ps >/dev/null 2>&1; then
    /usr/bin/nohup bash ~/Predator_60/deploy/scripts/deploy_imac_full_stack.sh > ~/k3d_deploy.log 2>&1 &
    echo '✅ K3d деплой запущено у фоні'
else
    echo '⚠️ Docker недоступний — K3d пропущено, API працює автономно'
fi
" || echo "⚠️ K3d крок пропущено"

# ─── 9. Запуск UI на MacBook ────────────────────────────────────
echo "🎨 Запуск веб-інтерфейсу на MacBook (у новому вікні)..."
osascript -e "tell application \"Terminal\" to do script \"cd /Users/Shared/Predator_60/apps/predator-analytics-ui && npm run dev\""

# ─── 10. Фінальний статус ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "🏁 PREDATOR ELITE — ДЕПЛОЙ ЗАВЕРШЕНО!"
echo "═══════════════════════════════════════════"
echo "🔗 UI:       http://localhost:3030"
echo "🔗 iMac API: http://$IMAC_IP:8000/api/v1"
echo "📋 Лог API:  ssh $IMAC_USER@$IMAC_IP 'cat ~/predator_api.log'"
echo "📋 Лог K3d:  ssh $IMAC_USER@$IMAC_IP 'cat ~/k3d_deploy.log'"
echo "═══════════════════════════════════════════"
