#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🛠 PREDATOR V45 - BACKEND FIX (CRONITER & REBUILD)
# ═══════════════════════════════════════════════════════════════

set -e

SERVER="predator-server"
REMOTE_ROOT="~/predator-analytics"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛠 ФІКС БЕКЕНДУ: Встановлення croniter та перебудова"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Синхронізація requirements.txt
echo "📤 Крок 1: Синхронізація requirements.txt..."
rsync -avz services/api_gateway/requirements.txt $SERVER:$REMOTE_ROOT/services/api_gateway/requirements.txt

# 2. Синхронізація коду (на всякий випадок)
echo "📤 Крок 2: Синхронізація коду бекенду..."
rsync -avz services/api_gateway/app/ $SERVER:$REMOTE_ROOT/services/api_gateway/app/

# 3. Перебудова бекенду БЕЗ кешу
echo "🏗️ Крок 3: Перебудова контейнера backend (без кешу)..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose build --no-cache backend
echo "🚀 Запуск бекенду..."
docker compose up -d backend
echo "⏳ Очікування запуску (5 сек)..."
sleep 5
echo "📊 Статус контейнерів:"
docker compose ps backend
echo ""
echo "📝 Останні логи бекенду:"
docker compose logs --tail=20 backend
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ФІКС ЗАВЕРШЕНО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Перевірте http://localhost:9080 через 30 секунд."
