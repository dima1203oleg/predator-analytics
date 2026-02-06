#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔍 ПЕРЕВІРКА ПОТОЧНОЇ ВЕРСІЇ WEB-ІНТЕРФЕЙСУ
# ═══════════════════════════════════════════════════════════════

SERVER="predator-server"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 ПЕРЕВІРКА ВЕРСІЇ PREDATOR WEB-ІНТЕРФЕЙСУ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Локальна версія (сирці)
echo "📁 ЛОКАЛЬНА ВЕРСІЯ (код):"
if [ -f "apps/predator-analytics-ui/index.html" ]; then
    LOCAL_VERSION=$(grep -o "PREDATOR v[0-9]*" apps/predator-analytics-ui/index.html | head -1)
    echo "   $LOCAL_VERSION"
else
    echo "   ❌ Не знайдено index.html"
fi
echo ""

# Версія на сервері (що роздає Nginx)
echo "🌐 ВЕРСІЯ НА СЕРВЕРІ (що бачить користувач):"
SERVER_VERSION=$(ssh $SERVER 'docker exec predator_frontend cat /usr/share/nginx/html/index.html 2>/dev/null | grep -o "PREDATOR v[0-9]*" | head -1' 2>/dev/null)
if [ -n "$SERVER_VERSION" ]; then
    echo "   $SERVER_VERSION"

    # Порівняння
    if [ "$LOCAL_VERSION" = "$SERVER_VERSION" ]; then
        echo "   ✅ Співпадає з локальною версією"
    else
        echo "   ⚠️  НЕ співпадає! Локально: $LOCAL_VERSION"
        echo "   💡 Запустіть: ./scripts/deploy-v30-clean.sh"
    fi
else
    echo "   ❌ Не вдалося отримати версію з сервера"
    echo "   💡 Перевірте, чи запущений тунель: ./scripts/server-tunnel.sh status"
fi
echo ""

# Статус контейнера
echo "🐳 СТАТУС DOCKER КОНТЕЙНЕРА:"
ssh $SERVER 'docker compose ps frontend' 2>/dev/null || echo "   ❌ Не вдалося підключитися до сервера"
echo ""

# Доступність інтерфейсу
echo "🌍 ДОСТУПНІСТЬ:"
echo "   Локальний тунель:  http://localhost:9080"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9080 | grep -q "200\|301\|302"; then
    echo "   ✅ Доступний"
else
    echo "   ❌ Недоступний (запустіть тунель)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
