#!/bin/bash
# AUTO_DEPLOY_IMAC.sh - v60.5-ELITE
echo "🚀 Активація Predator Analytics Full Stack..."

# 1. Очищення MacBook
echo "🧹 Звільнення порту 3030 на MacBook..."
lsof -ti:3030 | xargs kill -9 2>/dev/null || true

# 2. Пошук доступного IP аймака
echo "🔍 Пошук доступного IP для iMac..."
IMAC_IPS=("192.168.0.200" "10.8.0.1" "192.168.0.199" "192.168.0.114" "178.214.200.25")
IMAC_IP=""

for ip in "${IMAC_IPS[@]}"; do
    echo "⚡ Перевірка $ip..."
    if nc -z -G 2 "$ip" 22 2>/dev/null; then
        IMAC_IP="$ip"
        echo "✅ Знайдено робочий IP: $IMAC_IP"
        break
    fi
done

if [ -z "$IMAC_IP" ]; then
    echo "⚠️  Жоден IP не відповідає на порт 22. Використовую дефолтний: 10.8.0.1"
    IMAC_IP="10.8.0.1"
fi

echo "🌌 Надсилання команд на iMac ($IMAC_IP)..."
echo "⚠️  Запуск синхронізації та бекенду (пароль '1204')..."

# Оновлюємо .env.local для Vite Proxy на знайдений IP
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

# Синхронізуємо код на iMac через rsync із sshpass
export SSHPASS='1204'
sshpass -e rsync -az --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='dist' \
    -e "ssh -o StrictHostKeyChecking=no" \
    /Users/Shared/Predator_60/ \
    dmytrokizima@$IMAC_IP:~/Predator_60/

# Запускаємо Python Backend та K3D (повний стек)
cat deploy/scripts/deploy_imac_full_stack.sh | sshpass -e ssh -o StrictHostKeyChecking=no dmytrokizima@$IMAC_IP "cat > ~/bootstrap.sh && chmod +x ~/bootstrap.sh && bash ~/bootstrap.sh"

# Запускаємо Python Core-API (використовуємо /usr/bin/nohup бо brew PATH перекриває системний)
sshpass -e ssh -o StrictHostKeyChecking=no dmytrokizima@$IMAC_IP "export PATH=\"/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH\"; cd ~/Predator_60/services/core-api && python3 -m venv .venv && source .venv/bin/activate && pip install -q -r requirements.txt && pip install -q -e ../../libs/predator-common && /usr/bin/nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 > ~/predator_api.log 2>&1 &"

# 3. Запуск UI на MacBook у новому вікні Терміналу
echo "🎨 Запуск веб-інтерфейсу на MacBook (у новому вікні)..."
osascript -e "tell application \"Terminal\" to do script \"cd /Users/Shared/Predator_60/apps/predator-analytics-ui && npm run dev\""

echo "🏁 ПРОЦЕС ПІШОВ!"
echo "🔗 UI відкриється автоматично: http://localhost:3030"
echo "🔗 iMac API: http://$IMAC_IP:8000/api/v1"
