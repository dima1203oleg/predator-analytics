#!/bin/bash
# =============================================================================
# Zero Simulation Data Checker
# Predator Analytics v25.0.0
# 
# Перевіряє відсутність mock/fake/simulated даних у коді
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Zero Simulation Check - Predator Analytics v25.0.0"
echo "======================================================"

# Заборонені патерни
FORBIDDEN_PATTERNS=(
    "from faker import"
    "import faker"
    "Faker()"
    "fake\."
    "mock_data\s*="
    "fake_users\s*="
    "generate_fake"
    "synthetic_data"
    "random\.choice.*\(.*name"
    "random\.choice.*\(.*email"
    "dummy_data"
    "test_data\s*=\s*\["
    "sample_data\s*=\s*\["
    "demo_data\s*=\s*\["
    "placeholder_data"
)

# Дозволені виключення (тести, конфіги)
EXCLUDED_PATHS=(
    "tests/"
    "test_"
    "__pycache__"
    "node_modules"
    ".git"
    "venv"
    ".venv"
    "dist"
    "build"
    "*.min.js"
    "check_zero_simulation.sh"
)

# Формуємо exclude pattern для grep
EXCLUDE_ARGS=""
for path in "${EXCLUDED_PATHS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude-dir=$path --exclude=$path"
done

FOUND_ISSUES=0

echo ""
echo "📋 Перевіряю заборонені патерни..."
echo ""

for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    echo -n "  Шукаю: '$pattern' ... "
    
    # Шукаємо в Python та TypeScript файлах
    RESULTS=$(grep -rniE "$pattern" \
        --include="*.py" \
        --include="*.ts" \
        --include="*.tsx" \
        --include="*.js" \
        --include="*.jsx" \
        $EXCLUDE_ARGS \
        . 2>/dev/null || true)
    
    if [ -n "$RESULTS" ]; then
        echo -e "${RED}ЗНАЙДЕНО!${NC}"
        echo "$RESULTS" | while read -r line; do
            echo -e "    ${YELLOW}→ $line${NC}"
        done
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    else
        echo -e "${GREEN}OK${NC}"
    fi
done

echo ""
echo "📋 Перевіряю JSON файли з demo даними..."
echo ""

# Шукаємо JSON файли з підозрілими назвами
DEMO_JSON=$(find . -type f \( -name "*demo*.json" -o -name "*mock*.json" -o -name "*fake*.json" -o -name "*sample*.json" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/tests/*" \
    2>/dev/null || true)

if [ -n "$DEMO_JSON" ]; then
    echo -e "${RED}Знайдено підозрілі JSON файли:${NC}"
    echo "$DEMO_JSON" | while read -r file; do
        echo -e "  ${YELLOW}→ $file${NC}"
    done
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "  ${GREEN}Підозрілих JSON файлів не знайдено${NC}"
fi

echo ""
echo "📋 Перевіряю hardcoded test data у frontend..."
echo ""

# Шукаємо великі масиви даних у frontend
if [ -d "frontend/src" ]; then
    HARDCODED=$(grep -rniE "^\s*(const|let|var)\s+\w+\s*=\s*\[" \
        --include="*.ts" \
        --include="*.tsx" \
        frontend/src 2>/dev/null | \
        grep -vE "(import|export|type|interface)" | \
        head -20 || true)
    
    if [ -n "$HARDCODED" ]; then
        echo -e "${YELLOW}⚠️  Знайдено можливі hardcoded масиви (перевірте вручну):${NC}"
        echo "$HARDCODED" | while read -r line; do
            echo -e "  → $line"
        done
    else
        echo -e "  ${GREEN}Hardcoded масивів не знайдено${NC}"
    fi
fi

echo ""
echo "======================================================"

if [ $FOUND_ISSUES -gt 0 ]; then
    echo -e "${RED}❌ Знайдено $FOUND_ISSUES проблем!${NC}"
    echo ""
    echo "Рекомендації:"
    echo "  1. Видаліть або замініть симульовані дані на реальні"
    echo "  2. Використовуйте ETL для завантаження справжніх файлів"
    echo "  3. Для тестів використовуйте tests/ директорію"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Zero Simulation Check пройдено успішно!${NC}"
    echo ""
    echo "Всі дані в проекті є реальними або завантажуються через ETL."
    exit 0
fi
