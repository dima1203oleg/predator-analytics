#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# Setup Live API Keys in System
# Встановлює живі API ключи в систему
# ══════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🚀 Setup Live API Keys${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

SHELL_RC="$HOME/.zshrc"

# Live Keys Found
echo -e "${GREEN}✅ LIVE KEYS FOUND:${NC}"
echo "   • Mistral KEY_2"
echo "   • Cohere"
echo "   • OpenRouter"
echo "   • Together.ai"
echo ""

# Create environment file
cat > "$HOME/.env.live-api-keys" << 'EOF'
# ══════════════════════════════════════════════════════════════════════════════
# Live API Keys — January 2026 Validation
# ══════════════════════════════════════════════════════════════════════════════

# 🟣 Mistral API (LIVE ✅)
export MISTRAL_API_KEY="2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp"

# 🟢 Cohere API (LIVE ✅)
export COHERE_API_KEY="l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"

# 🟠 OpenRouter API (LIVE ✅)
export OPENROUTER_API_KEY="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"

# 🟡 Together.ai API (LIVE ✅)
export TOGETHER_API_KEY="tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"

# ──────────────────────────────────────────────────────────────────────────────
# Попередня конфіг (частково дохід, але слід перевірити)
# ──────────────────────────────────────────────────────────────────────────────

# Z.ai (раніше тестовано, може потребувати оновлення)
export ZAI_API_KEY="${ZAI_API_KEY:-bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg}"

# Google Gemini (раніше дохід, але тест не пройшов)
export GOOGLE_API_KEY="${GOOGLE_API_KEY:-AIzaSyAcbMMgDoXKbvDzZCtzEfwdLxwa5QT6ZNU}"

# ──────────────────────────────────────────────────────────────────────────────
# МЕРТВІ КЛЮЧИ (НЕ ВИКОРИСТОВУВАТИ)
# ──────────────────────────────────────────────────────────────────────────────
# ❌ Groq Keys (всі 4) — DEAD
# ❌ Gemini Keys (всі 5) — DEAD
# ❌ OpenAI Keys (всі 3) — DEAD
# ❌ HuggingFace Keys (всі 4) — DEAD
# ❌ Ollama Endpoint — DEAD

echo "✅ Live API Keys Configuration Loaded"
echo "   🟣 Mistral: ✓"
echo "   🟢 Cohere: ✓"
echo "   🟠 OpenRouter: ✓"
echo "   🟡 Together.ai: ✓"
EOF

echo -e "${GREEN}✅ Created ~/.env.live-api-keys${NC}"
echo ""

# Add to .zshrc if not already there
if ! grep -q "env.live-api-keys" "$SHELL_RC"; then
    echo "Додаючи live API keys до $SHELL_RC..."
    echo "" >> "$SHELL_RC"
    echo "# Live API Keys (Jan 2026)" >> "$SHELL_RC"
    echo "source ~/.env.live-api-keys 2>/dev/null || true" >> "$SHELL_RC"
    echo "alias load-live-keys='source ~/.env.live-api-keys'" >> "$SHELL_RC"
    echo -e "${GREEN}✅ Додано${NC}"
else
    echo -e "${YELLOW}⚠️  Вже в конфігу${NC}"
fi

echo ""

# Load in current session
source "$HOME/.env.live-api-keys" 2>/dev/null || true

# Create LiteLLM-compatible config
cat > "$HOME/.config/litellm-live-keys.yaml" << 'EOF'
# ══════════════════════════════════════════════════════════════════════════════
# LiteLLM Config — Live API Keys Only
# ══════════════════════════════════════════════════════════════════════════════

model_list:
  # 🟣 Mistral (LIVE) — хороший вибір для кодування
  - model_name: mistral
    litellm_params:
      model: mistral/mistral-large-latest
      api_key: os.environ/MISTRAL_API_KEY
      rpm: 30
      tpm: 100000

  # 🟢 Cohere (LIVE) — швидка, хороша для NLP
  - model_name: cohere
    litellm_params:
      model: cohere/command-r
      api_key: os.environ/COHERE_API_KEY
      rpm: 100

  # 🟠 OpenRouter (LIVE) — доступ до багатьох моделей
  - model_name: openrouter
    litellm_params:
      model: openrouter/meta-llama/llama-2-70b-chat
      api_key: os.environ/OPENROUTER_API_KEY
      rpm: 200

  # 🟡 Together.ai (LIVE) — швидка інференція
  - model_name: together
    litellm_params:
      model: together_ai/meta-llama/Llama-2-70b-chat-hf
      api_key: os.environ/TOGETHER_API_KEY
      rpm: 100

router_settings:
  routing_strategy: usage-based-routing-v2
  num_retries: 2
  timeout: 30
  allowed_fails: 1

general_settings:
  disable_spend_logs: false
  store_model_in_db: false
  database_url: ${DATABASE_URL:-}
EOF

mkdir -p "$HOME/.config"
echo -e "${GREEN}✅ Created ~/.config/litellm-live-keys.yaml${NC}"
echo ""

# Create updated Cursor config
cat > "$HOME/.cursor/settings-live-keys.json" << 'EOF'
{
  "customModels": [
    {
      "id": "mistral-large",
      "name": "Mistral Large (LIVE) 🟣",
      "provider": "openai",
      "baseURL": "https://api.mistral.ai/v1",
      "model": "mistral-large-latest",
      "apiKey": "${env.MISTRAL_API_KEY}",
      "contextWindow": 32768,
      "maxTokens": 4096,
      "description": "Powerful reasoning, coding-friendly"
    },
    {
      "id": "cohere",
      "name": "Cohere Command R (LIVE) 🟢",
      "provider": "openai",
      "baseURL": "https://api.cohere.ai/v1",
      "model": "command-r",
      "apiKey": "${env.COHERE_API_KEY}",
      "contextWindow": 128000,
      "maxTokens": 4096,
      "description": "128K context, fast & reliable"
    },
    {
      "id": "openrouter",
      "name": "Meta Llama 2 70B (OpenRouter) 🟠",
      "provider": "openai",
      "baseURL": "https://openrouter.ai/api/v1",
      "model": "meta-llama/llama-2-70b-chat",
      "apiKey": "${env.OPENROUTER_API_KEY}",
      "contextWindow": 4096,
      "maxTokens": 2048,
      "description": "Powerful open-source model"
    },
    {
      "id": "together",
      "name": "Llama 2 70B Chat (Together) 🟡",
      "provider": "openai",
      "baseURL": "https://api.together.xyz/v1",
      "model": "meta-llama/Llama-2-70b-chat-hf",
      "apiKey": "${env.TOGETHER_API_KEY}",
      "contextWindow": 4096,
      "maxTokens": 2048,
      "description": "Fast inference, excellent quality"
    }
  ],
  "defaultModel": "mistral-large"
}
EOF

echo -e "${GREEN}✅ Created ~/.cursor/settings-live-keys.json${NC}"
echo ""

# Summary
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Setup Summary${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo "✅ Live API Keys (4):"
echo "   🟣 Mistral — 32K context, powerful reasoning"
echo "   🟢 Cohere — 128K context, fast"
echo "   🟠 OpenRouter — Access to Llama, Mixtral, Claude"
echo "   🟡 Together.ai — Fast inference"
echo ""

echo "⚙️  Configuration Files:"
echo "   • ~/.env.live-api-keys"
echo "   • ~/.config/litellm-live-keys.yaml"
echo "   • ~/.cursor/settings-live-keys.json"
echo ""

echo "🚀 Наступні кроки:"
echo "   1. Load config: source ~/.env.live-api-keys"
echo "   2. Test Mistral: curl -X POST https://api.mistral.ai/v1/chat/completions"
echo "   3. Cursor: Copy ~/.cursor/settings-live-keys.json to ~/.cursor/settings.json"
echo "   4. Restart Cursor"
echo ""

echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
