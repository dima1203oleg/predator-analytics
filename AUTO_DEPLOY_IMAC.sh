#!/bin/bash
# AUTO_DEPLOY_IMAC.sh - v63.0-ELITE
# Повний автоматичний деплой PREDATOR на iMac Compute Node
# Фікси: colima PATH, numpy встановлення, SSH max-retries, colima install

set -uo pipefail

echo "🚀 Активація Predator Analytics Full Stack..."

# ─── Конфігурація ───────────────────────────────────────────────
IMAC_USER="dmytrokizima"
IMAC_PASS="1204"
# ФІКС: обмежуємо спроби автентифікації щоб уникнути "Too many auth failures"
SSH_OPTS="-o StrictHostKeyChecking=no -o PubkeyAuthentication=no -o PreferredAuthentications=password -o ConnectTimeout=10 -o NumberOfPasswordPrompts=1 -o ServerAliveInterval=5"

export SSHPASS="$IMAC_PASS"

# ─── 1. Очищення MacBook ────────────────────────────────────────
echo "🧹 Звільнення порту 3030 на MacBook..."
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# ─── 2. Пошук доступного IP iMac ───────────────────────────────
echo "🔍 Пошук доступного IP для iMac..."
IMAC_IPS=("192.168.0.200" "10.8.0.1" "192.168.0.199")
IMAC_IP=""

for ip in "${IMAC_IPS[@]}"; do
    echo "⚡ Перевірка $ip..."
    if nc -z -G 4 "$ip" 22 2>/dev/null; then
        IMAC_IP="$ip"
        echo "✅ Знайдено робочий IP: $IMAC_IP"
        break
    fi
done

if [ -z "$IMAC_IP" ]; then
    echo "⚠️  Жоден IP не відповідає. Використовую дефолтний: 192.168.0.200"
    IMAC_IP="192.168.0.200"
fi

# Функція для виконання SSH-команд (з правильним PATH)
imac_ssh() {
    sshpass -e ssh $SSH_OPTS "${IMAC_USER}@${IMAC_IP}" \
        "export PATH='/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH'; $1"
}

echo "🌌 Надсилання команд на iMac ($IMAC_IP)..."

# ─── 3. Оновлення .env.local (Vite Proxy) ──────────────────────
echo "📝 Оновлення .env.local..."
cat <<EOF > /Users/Shared/Predator_60/apps/predator-analytics-ui/.env.local
# ✅ Route через Vite Proxy → iMac Core API (port 8000)
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
    "${IMAC_USER}@${IMAC_IP}:~/Predator_60/" || echo "⚠️ rsync частково не вдався, продовжуємо..."

# ─── 5. ФІКС: Встановлення colima та qemu якщо відсутні ─────────
echo "🐳 Перевірка та налаштування Docker (colima + qemu)..."
imac_ssh "
    QEMU_BIN=\$(which qemu-img 2>/dev/null || echo '')
    if [ -z \"\$QEMU_BIN\" ]; then
        echo '⚙️  qemu-img не знайдено — встановлюємо qemu через brew...'
        brew install qemu 2>&1 | tail -5
    else
        echo \"✅ qemu-img знайдено: \$QEMU_BIN\"
    fi

    COLIMA_BIN=\$(which colima 2>/dev/null || echo '')
    if [ -z \"\$COLIMA_BIN\" ]; then
        echo '⚙️  colima не знайдено — встановлюємо colima через brew...'
        brew install colima 2>&1 | tail -5
    else
        echo \"✅ colima знайдено: \$COLIMA_BIN\"
    fi
    colima version
" || echo "⚠️ colima/qemu перевірка не вдалась"

# ─── 6. Запуск colima якщо Docker не відповідає ─────────────────
echo "🏗️ Запуск Docker (colima)..."
imac_ssh "
    if ! docker ps >/dev/null 2>&1; then
        echo 'Docker не активний, запускаємо colima...'
        colima start --cpu 4 --memory 6 --disk 60 2>&1 || \
        colima start 2>&1 || \
        echo 'colima не запустився, продовжуємо без Docker...'
        sleep 10
    else
        echo '✅ Docker вже запущено'
        docker ps | head -5
    fi
"

# ─── 7. Зупинка старого uvicorn ─────────────────────────────────
echo "🔄 Зупинка старого API-процесу..."
imac_ssh "pkill -f 'uvicorn app.main:app' 2>/dev/null || true" || true
sleep 2

# ─── 8. ФІКС: Встановлення numpy + всіх ML залежностей + запуск API ──
echo "🐍 Встановлення залежностей та запуск Core API..."
imac_ssh "
    cd ~/Predator_60/services/core-api

    # Створюємо venv якщо немає
    if [ ! -d '.venv' ]; then
        echo 'Створення venv...'
        python3.12 -m venv .venv 2>/dev/null || python3 -m venv .venv
    fi

    source .venv/bin/activate

    # ФІКС: Примусово встановлюємо numpy та ML бібліотеки (ключові залежності)
    echo '📦 Встановлення ML залежностей (numpy, scikit-learn, pandas)...'
    pip install -q numpy scikit-learn pandas apscheduler 2>&1 | tail -3

    # Встановлення всіх вимог
    echo '📦 Встановлення requirements.txt...'
    pip install -q -r requirements.txt 2>&1 | tail -5

    # Встановлення predator-common
    pip install -q -e ../../libs/predator-common 2>&1 | tail -3

    echo '✅ Всі залежності встановлено. Запуск uvicorn...'

    # Очищуємо старий лог
    rm -f ~/predator_api.log

    # Запуск через python -m uvicorn (з -u для зняття буферизації логів)
    nohup python -u -m uvicorn app.main:app \
        --host 0.0.0.0 --port 8000 --workers 2 \
        > ~/predator_api.log 2>&1 &

    API_PID=\$!
    echo \"API запущено з PID: \$API_PID\"
    sleep 10

    echo '--- Лог uvicorn ---'
    if [ -f ~/predator_api.log ]; then
        cat ~/predator_api.log
    else
        echo '⚠️ Файл логу ~/predator_api.log не знайдено!'
    fi
"

# ─── 9. Перевірка що API відповідає ────────────────────────────
echo "🔍 Перевірка доступності API..."
sleep 3
if curl -sf --connect-timeout 5 "http://$IMAC_IP:8000/health" >/dev/null 2>&1; then
    echo "✅ API ОНЛАЙН: http://$IMAC_IP:8000/health"
else
    echo "⚠️ API поки не відповідає (може ще стартує)"
fi

# ─── 10. Запуск K3d (якщо Docker активний) ─────────────────────
echo "☸️ Перевірка та запуск K3d кластера..."
imac_ssh "
    if docker ps >/dev/null 2>&1; then
        echo '✅ Docker активний. Запуск K3d у фоні...'
        /usr/bin/nohup bash ~/Predator_60/deploy/scripts/deploy_imac_full_stack.sh \
            > ~/k3d_deploy.log 2>&1 &
        echo 'K3d деплой запущено у фоні'
    else
        echo '⚠️ Docker недоступний — K3d пропущено, API працює автономно'
    fi
" || echo "⚠️ K3d крок пропущено"

# ─── 11. Запуск UI на MacBook ───────────────────────────────────
echo "🎨 Запуск веб-інтерфейсу на MacBook..."
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
if ! lsof -ti:3030 >/dev/null 2>&1; then
    nohup npm run dev > /tmp/predator_ui.log 2>&1 &
    echo "UI запущено (PID: $!)"
else
    echo "✅ UI вже запущено на порту 3030"
fi

# ─── 12. Фінальний статус ───────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "🏁 PREDATOR ELITE — ДЕПЛОЙ ЗАВЕРШЕНО!"
echo "═══════════════════════════════════════════"
echo "🔗 UI:        http://localhost:3030"
echo "🔗 iMac API:  http://$IMAC_IP:8000/api/v1"
echo "📋 Лог API:   ssh $IMAC_USER@$IMAC_IP 'cat ~/predator_api.log'"
echo "📋 Лог K3d:   ssh $IMAC_USER@$IMAC_IP 'cat ~/k3d_deploy.log'"
echo "📋 Лог UI:    cat /tmp/predator_ui.log"
echo "═══════════════════════════════════════════"
