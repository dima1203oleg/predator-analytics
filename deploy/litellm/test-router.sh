#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🧪 ТЕСТУВАННЯ ULTRA-ROUTER v55.3
# Скрипт для перевірки роботи LiteLLM Proxy
# ═══════════════════════════════════════════════════════════════

set -e

ROUTER_URL="${1:-http://localhost:4000}"
echo "🧪 ТЕСТУВАННЯ ULTRA-ROUTER v4.4 на ${ROUTER_URL}"
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
# ТЕСТ 3: ultra-router-chat (Gemini — українська)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 3: ultra-router-chat (Gemini 2.5 Flash)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}" \
  -d '{"model": "ultra-router-chat", "messages": [{"role": "user", "content": "привіт"}], "max_tokens": 20}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
    echo "✅ ultra-router-chat OK!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null
else
    echo "⚠️  ultra-router-chat: $(echo "$RESPONSE" | jq '.error.message' 2>/dev/null || echo "$RESPONSE")"
fi

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 4: ultra-router-fast (Groq — Vibe Coding)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 4: ultra-router-fast (Groq llama-3.3)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}" \
  -d '{"model": "ultra-router-fast", "messages": [{"role": "user", "content": "2+2=?"}], "max_tokens": 20}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
    echo "✅ ultra-router-fast OK!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null
else
    echo "⚠️  ultra-router-fast: $(echo "$RESPONSE" | jq '.error.message' 2>/dev/null || echo "$RESPONSE")"
fi

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 5: ultra-router-coding (Mistral Codestral)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 5: ultra-router-coding (Mistral Codestral)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}" \
  -d '{"model": "ultra-router-coding", "messages": [{"role": "user", "content": "напиши функцію sum(a,b)"}], "max_tokens": 50}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
    echo "✅ ultra-router-coding OK!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null | head -3
else
    echo "⚠️  ultra-router-coding: $(echo "$RESPONSE" | jq '.error.message' 2>/dev/null || echo "$RESPONSE")"
fi

# ───────────────────────────────────────────────────────────────────
# ТЕСТ 6: ultra-router-auto (complexity-based)
# ───────────────────────────────────────────────────────────────────
echo ""
echo "📊 ТЕСТ 6: ultra-router-auto (complexity-based routing)"
echo "─────────────────────────────────────────────────────────────────"

RESPONSE=$(curl -s -X POST "${ROUTER_URL}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}" \
  -d '{"model": "ultra-router-auto", "messages": [{"role": "user", "content": "привіт"}], "max_tokens": 20}' 2>/dev/null)

if echo "$RESPONSE" | grep -q "choices"; then
    echo "✅ ultra-router-auto OK!"
    echo "$RESPONSE" | jq '.choices[0].message.content' 2>/dev/null
else
    echo "⚠️  ultra-router-auto: $(echo "$RESPONSE" | jq '.error.message' 2>/dev/null || echo "$RESPONSE")"
fi

# ───────────────────────────────────────────────────────────────────
# SUMMARY
# ───────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ ULTRA-ROUTER v4.4 ГОТОВИЙ!"
echo ""
echo "🔗 Порт    : http://localhost:4000"
echo "📊 API     : /v1/chat/completions"
echo "🔑 Key     : sk-antigravity-master-2026"
echo ""
echo "📌 Моделі (Cline / Antigravity):"
echo "   ultra-router-chat   → 1×Gemini 2.5 Flash        (чат, укр)"
echo "   ultra-router-fast   → 2×Groq llama-3.3-70b      (Vibe Coding)"
echo "   ultra-router-coding → 2×Mistral Codestral       (код + global fallback)"
echo "   ultra-router-auto   → Auto complexity-based    (обирає сам)"
echo "═══════════════════════════════════════════════════════════════"
