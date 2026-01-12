#!/bin/bash
# Comprehensive API Key Testing Script

echo "🧪 TESTING ALL AI PROVIDERS"
echo "=" | tr '=' '='"{1..60}"
echo ""

# Function to test API
test_api() {
    local name=$1
    local url=$2
    local header=$3

    echo -n "Testing $name... "
    response=$(curl -s -w "\n%{http_code}" "$url" -H "$header" -m 10)
    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ WORKS (HTTP $http_code)"
        return 0
    else
        echo "❌ FAILED (HTTP $http_code)"
        return 1
    fi
}

# Counter
working=0
total=0

echo "📊 GROQ (4 keys):"
groq_keys=(
    "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"
    "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"
    "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"
    "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"
)
for i in "${!groq_keys[@]}"; do
    total=$((total + 1))
    if test_api "Groq Key #$((i+1))" \
        "https://api.groq.com/openai/v1/models" \
        "Authorization: Bearer ${groq_keys[$i]}"; then
        working=$((working + 1))
    fi
done

echo ""
echo "🧠 GEMINI (5 keys):"
gemini_keys=(
    "AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80"
    "AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ"
    "AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk"
    "AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc"
    "AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M"
)
for i in "${!gemini_keys[@]}"; do
    total=$((total + 1))
    if test_api "Gemini Key #$((i+1))" \
        "https://generativelanguage.googleapis.com/v1/models?key=${gemini_keys[$i]}" \
        "Content-Type: application/json"; then
        working=$((working + 1))
    fi
done

echo ""
echo "🚀 OTHER PROVIDERS:"

# xAI Grok
total=$((total + 1))
if test_api "xAI Grok" \
    "https://api.x.ai/v1/models" \
    "Authorization: Bearer xai-0nHPlMDZ90CHHODwh3KYu8LZQgZfm4vw6n5BYtGhxWVpPwWizO5UZmu09wG1DKArzq1fZtcAg0kPbb6e"; then
    working=$((working + 1))
fi

# OpenRouter
total=$((total + 1))
if test_api "OpenRouter" \
    "https://openrouter.ai/api/v1/models" \
    "Authorization: Bearer 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"; then
    working=$((working + 1))
fi

# Together.ai
total=$((total + 1))
if test_api "Together.ai" \
    "https://api.together.xyz/v1/models" \
    "Authorization: Bearer tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"; then
    working=$((working + 1))
fi

# DeepSeek
deepseek_keys=(
    "sk-c5009c642d0a43d7988aeae76c891011"
    "sk-05b5d926284e4af49f0ed7d72731b10c"
)
for i in "${!deepseek_keys[@]}"; do
    total=$((total + 1))
    if test_api "DeepSeek Key #$((i+1))" \
        "https://api.deepseek.com/v1/models" \
        "Authorization: Bearer ${deepseek_keys[$i]}"; then
        working=$((working + 1))
    fi
done

# Mistral
mistral_keys=(
    "T1TtBaI37EWoJFo0jjTvZjJWYn8qyhqb"
    "2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp"
    "jjIcgRTDTqoZFttQgwUKk7hwLTYxoLRq"
    "iZxLX6mDrX2u3MUMBtmNEofqoNy0lQc7"
)
for i in "${!mistral_keys[@]}"; do
    total=$((total + 1))
    if test_api "Mistral Key #$((i+1))" \
        "https://api.mistral.ai/v1/models" \
        "Authorization: Bearer ${mistral_keys[$i]}"; then
        working=$((working + 1))
    fi
done

# Cohere
total=$((total + 1))
if test_api "Cohere" \
    "https://api.cohere.ai/v1/models" \
    "Authorization: Bearer l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"; then
    working=$((working + 1))
fi

# External Ollama
total=$((total + 1))
echo -n "Testing External Ollama... "
if curl -s -m 10 http://46.219.108.236:11434/api/tags >/dev/null 2>&1; then
    echo "✅ WORKS"
    working=$((working + 1))
else
    echo "❌ FAILED"
fi

echo ""
echo "=" | tr '=' '='"{1..60}"
echo "📊 SUMMARY:"
echo "Working: $working / $total"
echo "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($working/$total)*100}")%"
echo "=" | tr '=' '='"{1..60}"
