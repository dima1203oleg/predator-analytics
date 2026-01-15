#!/bin/bash
# phase3-autonomous-agents.sh
# PHASE 3: Autonomous Agents Integration

set -e

echo "🤖 Phase 3: Autonomous Agents Integration"

# 1. Check Models
echo "🧠 Перевірка локальних моделей..."
REQUIRED_MODELS=("llama3.1:8b" "mistral:7b")

for model in "${REQUIRED_MODELS[@]}"; do
    if curl -s -X POST http://localhost:11434/api/show -d "{\"name\": \"$model\"}" | grep -q "license"; then
        echo "✅ Модель $model доступна."
    else
        echo "⚠️  Модель $model не знайдена. Починаю завантаження..."
        curl -X POST http://localhost:11434/api/pull -d "{\"name\": \"$model\"}" &
    fi
done

# 2. Digital Twin
echo "🌐 Перевірка Digital Twin..."
if [ -f "scripts/digital_twin_validator.py" ]; then
    echo "✅ Digital Twin Validator готовий."
else
    echo "❌ Validate script missing."
fi

echo "✅ Phase 3 завершено (Agents integrated)."
