#!/bin/bash
# Швидка діагностика UI та запуск виправлень

echo "🔍 PREDATOR UI DIAGNOSTICS"
echo "=========================="
echo ""

# Перевірка Docker
echo "1️⃣ Перевірка Docker..."
if docker ps &> /dev/null; then
    echo "✅ Docker запущений"
    echo ""
    echo "Контейнери:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
else
    echo "❌ Docker НЕ запущений!"
    echo ""
    echo "Запусти Docker:"
    echo "  docker compose up -d"
    echo ""
    exit 1
fi

# Перевірка Frontend
echo "2️⃣ Перевірка Frontend..."
FRONTEND_URL="http://localhost:3000"

if curl -s "$FRONTEND_URL" > /dev/null; then
    echo "✅ Frontend доступний: $FRONTEND_URL"
else
    echo "❌ Frontend недоступний!"
    echo ""
    echo "Перевір порт в docker-compose.yml"
    echo "Або спробуй: http://localhost:80"
    echo ""
fi

echo ""

# Тест кожної сторінки
echo "3️⃣ Тестування сторінок..."
echo ""

PAGES=(
    "/:Dashboard"
    "/search:Search Console"
    "/monitoring:Monitoring"
    "/dataset-studio:Dataset Studio"
    "/council:LLM Council"
    "/analytics:Analytics"
    "/settings:Settings"
    "/security:Security"
    "/agents:AI Agents"
    "/databases:Databases"
    "/infrastructure:Infrastructure"
)

FAILED=0
PASSED=0

for page in "${PAGES[@]}"; do
    IFS=':' read -r path name <<< "$page"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL$path" 2>/dev/null)

    if [ "$HTTP_CODE" == "200" ]; then
        echo "✅ $name ($path) - OK"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $name ($path) - Error $HTTP_CODE"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "=========================="
echo "Результат: $PASSED/$((PASSED + FAILED)) сторінок працюють"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️ Знайдено $FAILED проблемних сторінок!"
    echo ""
    echo "Запусти UI Guardian для автоматичного виправлення:"
    echo "  ./scripts/start_predator.sh"
    echo "  # Вибери: 2) Повна система"
    echo ""
    echo "Або запусти manual test:"
    echo "  python3 -c 'from backend.orchestrator.tasks.ui_guardian import UIGuardian; import asyncio; asyncio.run(UIGuardian().check_ui())' "
else
    echo "🎉 Всі сторінки працюють!"
fi

echo ""
echo "4️⃣ Перевірка Backend API..."

BACKEND_URL="http://localhost:8000"
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>/dev/null)

if [ "$HEALTH_CODE" == "200" ]; then
    echo "✅ Backend API доступний: $BACKEND_URL"
else
    echo "❌ Backend API недоступний! (Error: $HEALTH_CODE)"
    echo "   Перевір що backend container запущений"
fi

echo ""
echo "=========================="
echo "🚀 Готовий запустити auto-repair?"
echo ""
echo "Запусти:"
echo "  ./scripts/start_predator.sh"
echo ""
echo "Система сама:"
echo "  1. Знайде всі проблеми UI"
echo "  2. Згенерує виправлення"
echo "  3. Попросить твоє підтвердження в Telegram"
echo "  4. Застосує зміни"
echo ""
