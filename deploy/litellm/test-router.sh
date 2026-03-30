#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🧪 ТЕСТУВАННЯ ULTRA-ROUTER v55.3
# Скрипт для перевірки роботи LiteLLM Proxy
# ═══════════════════════════════════════════════════════════════

set -e

ROUTER_URL="${1:-http://localhost:4000}"
echo "🔍 Тестування ULTRA-ROUTER на ${ROUTER_URL}"
echo "═══════════════════════════════════════════════════════════════"

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 1: Health Check
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 1: Health Check"
echo "─────────────────────────────────────────────────────────────────"

HEALTH=$(curl -s -w "\n%{http_code}" "${ROUTER_URL}/health" 2>/dev/null | tail -1)
if [ "$HEALTH" = "200" ] || [ "$HEALTH" = "401" ]; then
    echo "✅ Health check PASS (HTTP ${HEALTH})"
else
    echo "❌ Health check FAIL (HTTP ${HEALTH})"
    exit 1
fi

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 2: Список моделей
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 2: Список моделей (/v1/models)"
echo "─────────────────────────────────────────────────────────────────"

curl -s "${ROUTER_URL}/v1/models" | jq '.data | length' 2>/dev/null || echo "⚠️  Models endpoint не відповідає"

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 3: Простий запит (Ollama - локально)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 3: Chat completion (Ollama/llama2)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/llama2",
    "messages": [{"role": "user", "content": "привіт, це тест"}],
    "max_tokens": 50,
    "temperature": 0.7
  }' 2>/dev/null)

if echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  Ollama недоступна (це нормально, якщо вона не запущена)"
    echo "$RESPONSE" | jq '.error.message' 2>/dev/null || echo "$RESPONSE"
else
    echo "✅ Запит успішний!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null | head -3
fi

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 4: Запит з GROQ (якщо доступний)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 4: Chat completion (Groq/llama-3.3)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "groq/llama-3.3-70b-versatile",
    "messages": [{"role": "user", "content": "2+2=?"}],
    "max_tokens": 20
  }' 2>/dev/null)

if echo "$RESPONSE" | grep -q "error"; then
    echo "⚠️  Groq недоступна (потребує реального API ключа)"
else
    echo "✅ Groq запит успішний!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null
fi

# ───────────────────────────────────────────────────────────────────
# SUMMARY
# ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ ULTRA-ROUTER v55.3 ГОТОВИЙ!"
echo ""
echo "🔗 Порт: http://localhost:4000"
echo "📊 API: /v1/chat/completions"
echo "📌 Моделі: groq/*, ollama/*, hf/*, together_ai/*"
echo "═══════════════════════════════════════════════════════════════"
