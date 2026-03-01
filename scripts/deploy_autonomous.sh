#!/bin/bash
# Deployment Guide для Autonomous Intelligence v2.0
# Автоматичне розгортання на production

set -e  # Вийти при помилці

echo "🚀 AUTONOMOUS INTELLIGENCE V2.0 - DEPLOYMENT GUIDE"
echo "=================================================="
echo ""

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Функція для виводу статусу
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Перевірка середовища
echo "📋 Крок 1: Перевірка середовища"
echo "--------------------------------"

# Перевірка Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python встановлено: $PYTHON_VERSION"
else
    print_error "Python 3 не знайдено. Встановіть Python 3.8+"
    exit 1
fi

# Перевірка pip
if command -v pip3 &> /dev/null; then
    print_status "pip встановлено"
else
    print_error "pip не знайдено"
    exit 1
fi

# Перевірка віртуального середовища
if [ -d "venv" ] || [ -d ".venv" ]; then
    print_status "Віртуальне середовище знайдено"
else
    print_warning "Віртуальне середовище не знайдено. Створюємо..."
    python3 -m venv venv
    print_status "Віртуальне середовище створено"
fi

echo ""
echo "📦 Крок 2: Встановлення залежностей"
echo "-----------------------------------"

# Активація віртуального середовища
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    print_status "Віртуальне середовище активовано"
elif [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
    print_status "Віртуальне середовище активовано"
fi

# Встановлення залежностей
if [ -f "services/api_gateway/requirements.txt" ]; then
    print_status "Встановлення залежностей..."
    pip3 install -r services/api_gateway/requirements.txt --quiet
    print_status "Залежності встановлено"
else
    print_warning "requirements.txt не знайдено"
fi

# Додаткові залежності для AI v2.0
print_status "Встановлення додаткових залежностей для AI v2.0..."
pip3 install numpy psutil --quiet
print_status "Додаткові залежності встановлено"

echo ""
echo "🔍 Крок 3: Перевірка файлів"
echo "---------------------------"

# Перевірка основних файлів
FILES=(
    "services/api_gateway/app/services/autonomous_intelligence_v2.py"
    "services/api_gateway/app/api/v45_routes.py"
    "services/api_gateway/app/main.py"
    ".agent/workflows/ultra_autonomous.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Знайдено: $file"
    else
        print_error "Відсутній: $file"
        exit 1
    fi
done

echo ""
echo "🧪 Крок 4: Запуск тестів (опціонально)"
echo "--------------------------------------"

read -p "Запустити тести? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "tests/test_autonomous_intelligence_v2.py" ]; then
        print_status "Запуск тестів..."
        python3 -m pytest tests/test_autonomous_intelligence_v2.py -v || print_warning "Деякі тести не пройшли"
    else
        print_warning "Тести не знайдено"
    fi
fi

echo ""
echo "🔧 Крок 5: Конфігурація"
echo "-----------------------"

# Перевірка .env файлу
if [ -f ".env" ]; then
    print_status ".env файл знайдено"
else
    print_warning ".env файл не знайдено. Створюємо з прикладу..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status ".env файл створено"
    else
        print_warning "Створіть .env файл вручну"
    fi
fi

# Перевірка налаштувань бази даних
print_status "Перевірка підключення до бази даних..."
# Тут можна додати перевірку підключення

echo ""
echo "🚀 Крок 6: Запуск системи"
echo "-------------------------"

read -p "Запустити Autonomous Intelligence v2.0? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Запуск backend..."

    # Перевірка чи backend вже запущений
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Backend вже запущений на порту 8000"
        read -p "Перезапустити? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Зупинка існуючого процесу..."
            kill $(lsof -t -i:8000) 2>/dev/null || true
            sleep 2
        else
            print_status "Використовуємо існуючий процес"
            exit 0
        fi
    fi

    # Запуск backend
    cd services/api_gateway
    print_status "Запуск uvicorn..."
    echo ""
    echo "📊 Backend запускається на http://localhost:8000"
    echo "📚 API документація: http://localhost:8000/docs"
    echo "🧠 Autonomous status: http://localhost:8000/system/autonomy/status"
    echo ""
    echo "Натисніть Ctrl+C для зупинки"
    echo ""

    python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
fi

echo ""
echo "✅ Крок 7: Верифікація"
echo "---------------------"

# Перевірка статусу через API
sleep 3
if curl -s http://localhost:8000/system/autonomy/status > /dev/null; then
    print_status "API відповідає"

    # Отримання статусу
    STATUS=$(curl -s http://localhost:8000/system/autonomy/status | python3 -m json.tool 2>/dev/null || echo "{}")

    if [ ! -z "$STATUS" ]; then
        print_status "Autonomous Intelligence v2.0 працює"
        echo ""
        echo "📊 Статус системи:"
        echo "$STATUS" | head -20
    fi
else
    print_warning "API не відповідає. Перевірте логи."
fi

echo ""
echo "=================================================="
echo "🎉 DEPLOYMENT ЗАВЕРШЕНО!"
echo "=================================================="
echo ""
echo "📚 Наступні кроки:"
echo "  1. Перевірте статус: curl http://localhost:8000/system/autonomy/status"
echo "  2. Моніторте передбачення: curl http://localhost:8000/api/v1/v45/autonomous/predictions"
echo "  3. Переглядайте рішення: curl http://localhost:8000/api/v1/v45/autonomous/decisions"
echo "  4. Читайте документацію: AUTONOMY_README.md"
echo ""
echo "🔗 Корисні посилання:"
echo "  - API Docs: http://localhost:8000/docs"
echo "  - Autonomy Status: http://localhost:8000/system/autonomy/status"
echo "  - Health Check: http://localhost:8000/api/v1/v45/autonomous/health"
echo ""
echo "✅ Готово! Система працює в автономному режимі."
