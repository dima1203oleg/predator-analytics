#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔧 ВИПРАВЛЕННЯ ПОРТУ ФРОНТЕНДУ
# ═══════════════════════════════════════════════════════════════

SERVER="predator-server"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 ВИПРАВЛЕННЯ ПОРТУ ФРОНТЕНДУ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📤 Синхронізація docker-compose.yml на сервер..."
rsync -avz docker-compose.yml $SERVER:~/predator-analytics/

echo "✅ Конфіг оновлено"
echo ""

echo "🔄 Перезапуск фронтенду з правильним портом (80)..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose down frontend
docker compose up -d frontend
echo ""
echo "Статус:"
docker compose ps frontend
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ПОРТ ВИПРАВЛЕНО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Тепер інтерфейс має працювати на: http://localhost:9080"
echo "⚠️  Зробіть Hard Reload: Cmd+Shift+R"
echo ""
