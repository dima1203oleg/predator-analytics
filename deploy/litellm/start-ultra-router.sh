#!/usr/bin/env bash
# ================================================================
# Ultra-Router — Скрипт запуску LiteLLM (MacBook M3)
# ================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d ".venv_litellm" ]; then
    echo "Створюю віртуальне середовище .venv_litellm..."
    python3 -m venv .venv_litellm
fi

source .venv_litellm/bin/activate
echo "✅ Віртуальне середовище активовано."

echo "Встановлюю litellm[proxy]..."
pip install -q "litellm[proxy]"
echo "✅ LiteLLM встановлено."

# Підтягуємо ключі з .env якщо він існує
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    echo "✅ Ключі завантажено."
fi

echo "🚀 Запускаю LiteLLM Ultra-Router на порту 4000..."
litellm --config config.yaml --port 4000
