#!/bin/bash
# 🦅 PREDATOR Analytics v61.0-ELITE
# Скрипт оркестрації E2E Стрес-тестування Імпорту

echo "🚀 Запуск комплексного E2E тестування імпорту Excel-файлів..."

export EXCEL_TEST_FILE="/Users/dima1203/Desktop/Березень_2024.xlsx"
export EXCEL_STRESS_DIR="/Users/dima1203/Desktop/Customs_Data"
export PREDATOR_API_URL="http://localhost:8000/api/v1"
export VITE_API_BASE_URL="http://localhost:3030"

# Встановлюємо порядок виконання
TEST_FILES=(
    "tests/e2e/excel_stress_import/test_stage1_ui.py"
    "tests/e2e/excel_stress_import/test_stage2_3_ingestion.py"
    "tests/e2e/excel_stress_import/test_stage4_storage.py"
    "tests/e2e/excel_stress_import/test_stage5_6_7_ai.py"
    "tests/e2e/excel_stress_import/test_stage8_9_mass_import.py"
)

for test_file in "${TEST_FILES[@]}"; do
    echo "=================================================="
    echo "▶️ Виконання: $test_file"
    echo "=================================================="
    pytest "$test_file" -v -s --tb=short
    
    if [ $? -ne 0 ]; then
        echo "❌ Тест $test_file завершився з помилкою! Зупинка E2E."
        exit 1
    fi
done

echo "✅ Всі E2E стрес-тести успішно пройдено!"
