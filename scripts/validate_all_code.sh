#!/bin/bash
# Повна автоматична перевірка всього коду Predator Analytics

echo "🔍 PREDATOR ANALYTICS - CODE VALIDATION"
echo "========================================"
echo ""

TOTAL=0
PASSED=0
FAILED=0
ERRORS_FILE="/tmp/predator_validation_errors.txt"
> "$ERRORS_FILE"

# Функція для перевірки файлу
check_file() {
    local file=$1
    TOTAL=$((TOTAL + 1))

    if python3 -m py_compile "$file" 2>"$ERRORS_FILE.tmp"; then
        echo "✅ $file"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo "❌ $file"
        cat "$ERRORS_FILE.tmp" >> "$ERRORS_FILE"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📂 Перевірка backend/orchestrator..."
echo ""

# Основні файли
check_file "backend/orchestrator/main.py"
check_file "backend/orchestrator/config.py"

echo ""
echo "📂 Перевірка agents..."
for file in backend/orchestrator/agents/*.py; do
    [[ -f "$file" ]] && check_file "$file"
done

echo ""
echo "📂 Перевірка council..."
for file in backend/orchestrator/council/*.py; do
    [[ -f "$file" ]] && check_file "$file"
done

echo ""
echo "📂 Перевірка tasks..."
for file in backend/orchestrator/tasks/*.py; do
    [[ -f "$file" ]] && check_file "$file"
done

echo ""
echo "📂 Перевірка memory..."
for file in backend/orchestrator/memory/*.py; do
    [[ -f "$file" ]] && check_file "$file"
done

echo ""
echo "========================================"
echo "📊 РЕЗУЛЬТАТИ:"
echo "========================================"
echo "Всього файлів: $TOTAL"
echo "✅ Пройшли: $PASSED"
echo "❌ Помилки: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "⚠️ ЗНАЙДЕНО ПОМИЛКИ:"
    echo ""
    cat "$ERRORS_FILE"
    echo ""
    exit 1
else
    echo "🎉 ВСІ ФАЙЛИ ВАЛІДНІ!"
    echo ""
    exit 0
fi
