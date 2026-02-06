#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔧 ПЕРЕЗАПУСК ФРОНТЕНДУ (коли контейнер "застряг")
# ═══════════════════════════════════════════════════════════════

SERVER="predator-server"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 ПЕРЕЗАПУСК PREDATOR FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "⏹️  Зупинка старого контейнера..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose down frontend 2>/dev/null || true
docker rm -f predator_frontend 2>/dev/null || true
ENDSSH

echo "✅ Старий контейнер видалено"
echo ""

echo "🚀 Запуск нового контейнера..."
ssh $SERVER << 'ENDSSH'
cd ~/predator-analytics
docker compose up -d frontend
echo ""
echo "Статус:"
docker compose ps frontend
ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ФРОНТЕНД ПЕРЕЗАПУЩЕНО!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Відкрийте: http://localhost:9080"
echo "⚠️  Зробіть Hard Reload: Cmd+Shift+R"
echo ""
