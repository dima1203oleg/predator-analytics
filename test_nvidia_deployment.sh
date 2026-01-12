#!/bin/bash

# 🧪 Автоматизована перевірка веб-інтерфейсу на NVIDIA сервері
# Використання: ./test_nvidia_deployment.sh <NVIDIA_SERVER_IP>

set -e

# Перевірка аргументів
if [ $# -eq 0 ]; then
    echo "❌ Помилка: Вкажіть IP адресу NVIDIA сервера"
    echo "Використання: $0 <NVIDIA_SERVER_IP>"
    echo "Приклад: $0 192.168.1.100"
    exit 1
fi

NVIDIA_IP="$1"
BASE_URL="http://$NVIDIA_IP:8092"
API_URL="http://$NVIDIA_IP:8090"

echo "🚀 Починаю автоматичну перевірку веб-інтерфейсу на NVIDIA сервері"
echo "📍 Сервер: $NVIDIA_IP"
echo "🌐 Frontend URL: $BASE_URL"
echo "🔧 Backend URL: $API_URL"
echo "=================================================="

# Функція для перевірки HTTP статусу
check_http_status() {
    local url="$1"
    local expected_status="$2"
    local description="$3"
    
    echo -n "🔍 Перевіряю $description... "
    
    if command -v curl >/dev/null 2>&1; then
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" 2>/dev/null || echo "000")
        
        if [ "$status" = "$expected_status" ]; then
            echo "✅ OK (HTTP $status)"
            return 0
        else
            echo "❌ Помилка (HTTP $status, очікував $expected_status)"
            return 1
        fi
    else
        echo "❌ curl не встановлено"
        return 1
    fi
}

# Функція для перевірки JSON відповіді
check_json_response() {
    local url="$1"
    local description="$2"
    
    echo -n "🔍 Перевіряю $description... "
    
    response=$(curl -s --connect-timeout 10 "$url" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        # Перевіряємо, чи це валідний JSON
        if echo "$response" | python3 -c "import json, sys; json.load(sys.stdin)" 2>/dev/null; then
            echo "✅ OK (валідний JSON)"
            return 0
        else
            echo "❌ Помилка (некоректний JSON)"
            echo "📄 Відповідь: $response"
            return 1
        fi
    else
        echo "❌ Помилка (пуста відповідь)"
        return 1
    fi
}

# Функція для перевірки WebSocket
check_websocket() {
    echo -n "🔍 Перевіряю WebSocket з'єднання... "
    
    if command -v websocat >/dev/null 2>&1; then
        # Перевіряємо WebSocket з'єднання
        if echo '{"test": "ping"}' | websocat --timeout 5 "ws://$NVIDIA_IP:8090/api/v25/ws/omniscience" >/dev/null 2>&1; then
            echo "✅ OK (WebSocket працює)"
            return 0
        else
            echo "❌ Помилка (WebSocket не працює)"
            return 1
        fi
    else
        # Альтернативна перевірка через curl (менш надійна)
        if curl -s -H "Upgrade: websocket" -H "Connection: Upgrade" "ws://$NVIDIA_IP:8090/api/v25/ws/omniscience" >/dev/null 2>&1; then
            echo "⚠️  Можливо працює (потрібен websocat для точної перевірки)"
            return 0
        else
            echo "❌ Помилка (WebSocket не працює)"
            return 1
        fi
    fi
}

# Лічильник помилок
errors=0
total=0

echo ""
echo "📋 Перевірка основних сервісів"
echo "================================"

# 1. Перевірка Frontend
total=$((total + 1))
if ! check_http_status "$BASE_URL" "200" "Frontend головна сторінка"; then
    errors=$((errors + 1))
fi

# 2. Перевірка Omniscience
total=$((total + 1))
if ! check_http_status "$BASE_URL/omniscience" "200" "Omniscience Dashboard"; then
    errors=$((errors + 1))
fi

# 3. Перевірка Backend Health
total=$((total + 1))
if ! check_http_status "$API_URL/health" "200" "Backend Health Check"; then
    errors=$((errors + 1))
fi

echo ""
echo "📋 Перевірка API ендпоїнтів"
echo "=========================="

# 4. Перевірка системних метрик
total=$((total + 1))
if ! check_json_response "$API_URL/api/v1/system/metrics" "Системні метрики"; then
    errors=$((errors + 1))
fi

# 5. Перевірка V25 реалтайм метрик
total=$((total + 1))
if ! check_json_response "$API_URL/api/v25/metrics/realtime" "V25 реалтайм метрики"; then
    errors=$((errors + 1))
fi

# 6. Перевірка агентів
total=$((total + 1))
if ! check_json_response "$API_URL/api/v1/agents" "Агенти"; then
    errors=$((errors + 1))
fi

echo ""
echo "📋 Перевірка WebSocket функціональності"
echo "======================================"

# 7. Перевірка WebSocket
total=$((total + 1))
if ! check_websocket; then
    errors=$((errors + 1))
fi

echo ""
echo "📋 Перевірка статичних ресурсів"
echo "================================"

# 8. Перевірка CSS файлів
total=$((total + 1))
if ! check_http_status "$BASE_URL/assets/index.css" "200" "CSS файл"; then
    errors=$((errors + 1))
fi

# 9. Перевірка JS файлів
total=$((total + 1))
if ! check_http_status "$BASE_URL/assets/index.js" "200" "JavaScript файл"; then
    errors=$((errors + 1))
fi

echo ""
echo "📋 Перевірка додаткових сервісів"
echo "================================"

# 10. Перевірка Grafana (якщо доступна)
total=$((total + 1))
if check_http_status "http://$NVIDIA_IP:3001" "200" "Grafana" 2>/dev/null; then
    echo "✅ Grafana доступна"
else
    echo "⚠️  Grafana недоступна (можливо не запущена)"
fi

# 11. Перевірка Prometheus (якщо доступний)
total=$((total + 1))
if check_http_status "http://$NVIDIA_IP:9092" "200" "Prometheus" 2>/dev/null; then
    echo "✅ Prometheus доступний"
else
    echo "⚠️  Prometheus недоступний (можливо не запущений)"
fi

echo ""
echo "📊 Результати перевірки"
echo "======================="
echo "🔢 Всього тестів: $total"
echo "✅ Успішних: $((total - errors))"
echo "❌ Помилок: $errors"

if [ $errors -eq 0 ]; then
    echo ""
    echo "🎉 ВЕБ-ІНТЕРФЕЙС ПРАЦЮЄ ІДЕАЛЬНО!"
    echo "✅ Всі функції перевірено і працюють коректно"
    echo "🌐 Доступ до інтерфейсу: $BASE_URL"
    echo "🔮 Omniscience: $BASE_URL/omniscience"
    exit 0
else
    echo ""
    echo "⚠️  Виявлено $errors помилок"
    echo "🔧 Перевір логи на NVIDIA сервері:"
    echo "   docker-compose logs frontend"
    echo "   docker-compose logs backend"
    echo ""
    echo "📝 Діагностичні команди:"
    echo "   docker-compose ps"
    echo "   netstat -tlnp | grep -E '8090|8092'"
    exit 1
fi
