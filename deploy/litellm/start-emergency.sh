#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 EMERGENCY MODE: Запуск локальної інфраструктури
# Коли NVIDIA сервер відключився (світло пропало і т.д.)
# ═══════════════════════════════════════════════════════════════

set -e

echo "🆘 EMERGENCY MODE: NVIDIA відключена"
echo "═══════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# 1️⃣ ULTRA-ROUTER (LiteLLM Proxy - Groq/HF/Together)
# ───────────────────────────────────────────────────────────────────

echo ""
echo "1️⃣  Запускаємо ULTRA-ROUTER v55.3 (LiteLLM Proxy)..."
echo "─────────────────────────────────────────────────────────────────"

cd "$(dirname "$0")"

# Перевірити Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не встановлено!"
    exit 1
fi

# Запустити контейнер
docker-compose -f docker-compose-router.yml up -d

# Чекати готовності
echo "⏳ Очікування ULTRA-ROUTER (http://localhost:4000)..."
for i in {1..20}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ ULTRA-ROUTER готовий!"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "⚠️  ULTRA-ROUTER не запустився (але може спробувати далі)"
    fi
    sleep 1
done

# ───────────────────────────────────────────────────────────────────
# 2️⃣ OLLAMA (локально - якщо є)
# ───────────────────────────────────────────────────────────────────

echo ""
echo "2️⃣  Перевіряємо локальний Ollama..."
echo "─────────────────────────────────────────────────────────────────"

if command -v ollama &> /dev/null; then
    echo "✅ Ollama встановлена"
    
    # Перевірити чи запущена
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "🚀 Запускаємо Ollama..."
        ollama serve > /tmp/ollama.log 2>&1 &
        OLLAMA_PID=$!
        
        echo "⏳ Очікування Ollama (http://localhost:11434)..."
        for i in {1..15}; do
            if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
                echo "✅ Ollama готова!"
                break
            fi
            if [ $i -eq 15 ]; then
                echo "⚠️  Ollama не відповідає"
            fi
            sleep 1
        done
    else
        echo "✅ Ollama вже запущена"
    fi
else
    echo "⚠️  Ollama не встановлена (але можна запустити потім: ollama serve)"
fi

# ───────────────────────────────────────────────────────────────────
# 3️⃣ ІНФОРМАЦІЯ
# ───────────────────────────────────────────────────────────────────

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🆘 EMERGENCY MODE АКТИВОВАНИЙ!"
echo "═══════════════════════════════════════════════════════════════"

echo ""
echo "📊 ЛОКАЛЬНІ СЕРВІСУ:"
echo "  🚀 ULTRA-ROUTER (LiteLLM)  → http://localhost:4000"
echo "  🖥️  Ollama                  → http://localhost:11434"
echo ""

echo "💾 БАЗА ДАНИХ:"
echo "  Primary (NVIDIA):           ❌ НЕДОСТУПНА"
echo "  Fallback (SQLite):          ✅ /predator_local.db"
echo ""

echo "🤖 AI МОДЕЛІ:"
echo "  Groq (llama-3.3-70b)        ✅ Безплатна"
echo "  HuggingFace (Llama-2-70b)   ✅ Безплатна"
echo "  Together AI (Llama-3-70b)   ✅ Безплатна (1M token/день)"
echo "  Ollama (локально)           ✅ (якщо є моделі)"
echo ""

echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "🚀 Тепер запустити:"
echo "  cd services/core-api"
echo "  python -m uvicorn app.main:app --reload"
echo ""
echo "  Потім фронтенд:"
echo "  cd apps/predator-analytics-ui"
echo "  npm run dev"
echo ""

echo "✅ Готово! Все працюватиме локально, поки NVIDIA не повернеться."
echo ""

# Збереги PIDs для зупинки
echo "Запущені процеси:"
echo "  ULTRA-ROUTER: $(docker ps | grep ultra-router | awk '{print $1}')"
if [ ! -z "$OLLAMA_PID" ]; then
    echo "  Ollama: $OLLAMA_PID"
fi

echo ""
echo "Щоб все зупинити: bash stop-emergency.sh"
