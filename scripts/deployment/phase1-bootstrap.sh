#!/bin/bash
# phase1-bootstrap.sh
# PHASE 1: Bootstrap Predator Analytics v45-S

set -e  # Завершення при помилці

echo "🚀 Phase 1: Bootstrap Predator Analytics v45-S"

# 1. Перевірка системних вимог
echo "🔍 Перевірка системних вимог..."
REQUIRED_CPU=4 # Reduced for dev environment safety
REQUIRED_RAM=8 # Reduced for dev environment safety
REQUIRED_DISK=50 # Reduced for dev environment safety

# Перевірка CPU
CPU_COUNT=$(nproc)
if [ $CPU_COUNT -lt $REQUIRED_CPU ]; then
    echo "⚠️  Попередження: Мало CPU: потрібно $REQUIRED_CPU, наявно $CPU_COUNT"
else
    echo "✅ CPU: OK"
fi

# Перевірка RAM (Linux specific, might fail on Mac, adding check)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    RAM_GB=$((RAM_KB / 1024 / 1024))
    if [ $RAM_GB -lt $REQUIRED_RAM ]; then
         echo "⚠️  Попередження: Мало RAM: потрібно ${REQUIRED_RAM}GB, наявно ${RAM_GB}GB"
    else
         echo "✅ RAM: OK"
    fi
else
    echo "ℹ️  Proprietary OS detected (Mac?), skipping strict RAM check."
fi

# Перевірка диска
DISK_GB=$(df -kt / | awk 'NR==2 {print $4}' | awk '{print int($1/1024/1024)}')
if [ $DISK_GB -lt $REQUIRED_DISK ]; then
    echo "⚠️  Попередження: Мало місця: потрібно ${REQUIRED_DISK}GB, наявно ${DISK_GB}GB"
else
     echo "✅ Disk: OK"
fi

echo "✅ Системні вимоги перевірено (Dev Mode adjusted)"

# 2. Встановлення базових залежностей (Check only)
echo "📦 Перевірка залежностей..."
command -v curl >/dev/null 2>&1 || { echo "❌ curl required"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ git required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ docker required"; exit 1; }

echo "✅ Залежності присутні."

# 3. Налаштування Docker (Skip if running inside container or Mac)
# echo "🐳 Налаштування Docker..."

# 4. Завантаження моделей Ollama (Check connection)
echo "🧠 Перевірка Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ Ollama доступна."
    # Pull models asynchronously
    echo "⬇️  Pulling models in background..."
    curl -X POST http://localhost:11434/api/pull -d '{"name": "llama3.1:8b"}' &
else
    echo "⚠️  Ollama не відповідає на localhost:11434."
fi

echo "✅ Phase 1 завершено!"
