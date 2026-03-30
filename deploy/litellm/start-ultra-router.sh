#!/usr/bin/env bash
# ================================================================
# Ultra-Router v4.4 — Запуск через Docker Compose
# Antigravity / Cline: Gemini + 2×Groq + 2×Mistral + Auto
# ================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Завантажуємо ключі з .env.ultra-router
ENV_FILE=".env.ultra-router"
if [ -f "${ENV_FILE}" ]; then
    set -a
    source "${ENV_FILE}"
    set +a
    echo "✅ Ключі завантажено з ${ENV_FILE}"
else
    echo "⚠️  Файл ${ENV_FILE} не знайдено — перевір ключі API!"
    echo "   Очікується: GEMINI_API_KEY, GROQ_API_KEY_1/2, MISTRAL_API_KEY_1/2"
fi

docker compose -f docker-compose-router.yml down 2>/dev/null || true
docker compose -f docker-compose-router.yml up -d --force-recreate

echo ""
echo "🚀 ULTRA-ROUTER v4.4 запущено на http://localhost:4000"
echo ""
echo "Моделі для Cline / Antigravity:"
echo "  Base URL : http://localhost:4000/v1"
echo "  API Key  : ${LITELLM_MASTER_KEY:-sk-antigravity-master-2026}"
echo ""
echo "  ultra-router-chat   → Gemini 2.5 Flash        (чат, українська)"
echo "  ultra-router-fast   → 2×Groq llama-3.3-70b    (Vibe Coding)"
echo "  ultra-router-coding → 2×Mistral Codestral     (код + global fallback)"
echo "  ultra-router-auto   → Auto complexity-based   (обирає сам)"
