#!/bin/bash
# ===========================================
# 🦁 PREDATOR V30 - ПОВНИЙ ЗАПУСК СИСТЕМИ
# ===========================================

set -e

PROJECT_ROOT="/Users/dima-mac/Documents/Predator_21"
UI_DIR="$PROJECT_ROOT/apps/predator-analytics-ui"
BACKEND_PORT=9080
FRONTEND_PORT=3030

echo "🦁 ============================================"
echo "   PREDATOR Analytics V30 - Повний Запуск"
echo "============================================"
echo ""

# Функція для перевірки порту
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Функція для очищення портів
cleanup_ports() {
    echo "🧹 Очищення портів..."
    lsof -ti :$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti :$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    sleep 2
}

# Крок 1: Очищення
cleanup_ports

# Крок 2: Запуск Mock API (якщо backend не працює)
echo "📡 Перевірка backend на порту $BACKEND_PORT..."
if ! check_port $BACKEND_PORT; then
    echo "⚠️  Backend не знайдено. Запускаємо Mock API..."

    # Перевірка залежностей для mock API
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        echo "📦 Встановлення залежностей для Mock API..."
        cd "$PROJECT_ROOT"
        npm install express cors ws 2>/dev/null || {
            echo "⚠️  Не вдалося встановити залежності. Продовжуємо без Mock API..."
        }
    fi

    # Запуск Mock API у фоні
    cd "$PROJECT_ROOT"
    node mock-api-server.mjs > /tmp/predator-mock-api.log 2>&1 &
    MOCK_API_PID=$!
    echo "✅ Mock API запущено (PID: $MOCK_API_PID)"
    echo "📋 Логи: /tmp/predator-mock-api.log"
    sleep 3
else
    echo "✅ Backend вже працює на порту $BACKEND_PORT"
fi

# Крок 3: Підготовка UI
echo ""
echo "🎨 Підготовка UI..."
cd "$UI_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 Встановлення залежностей UI..."
    npm install --legacy-peer-deps || {
        echo "❌ Помилка встановлення залежностей"
        exit 1
    }
fi

# Крок 4: Налаштування змінних середовища
export VITE_BACKEND_PROXY_TARGET="http://localhost:$BACKEND_PORT"
export VITE_API_URL="/api/v1"

# Крок 5: Запуск UI
echo ""
echo "🚀 Запуск UI на порту $FRONTEND_PORT..."
echo ""
echo "============================================"
echo "✅ PREDATOR V30 готовий до роботи!"
echo "============================================"
echo ""
echo "🌐 UI:      http://localhost:$FRONTEND_PORT"
echo "📡 API:     http://localhost:$BACKEND_PORT"
echo ""
echo "📊 Нові Features:"
echo "   • AI Copilot - інтелектуальний помічник"
echo "   • Smart Risk Radar - 360° моніторинг ризиків"
echo "   • Dashboard Builder - персональні дашборди"
echo ""
echo "💡 Натисніть Ctrl+C для зупинки"
echo "============================================"
echo ""

# Запуск Vite
npx vite --port $FRONTEND_PORT --host --clearScreen false

# Cleanup при виході
trap "echo ''; echo '🛑 Зупинка PREDATOR V30...'; kill $MOCK_API_PID 2>/dev/null || true; exit 0" INT TERM
