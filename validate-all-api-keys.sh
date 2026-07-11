#!/bin/bash

# ══════════════════════════════════════════════════════════════════════════════
# API Keys Validation Script — Check All Keys
# Перевіряє всі API ключи на активність та готує їх до роботи
# ══════════════════════════════════════════════════════════════════════════════

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

RESULTS_FILE="/tmp/api_keys_validation.log"
> "$RESULTS_FILE"

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔑 API Keys Validation Suite${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

PASS=0
FAIL=0
LIVE_KEYS=()

# ═══════════════════════════════════════════════════════════════════════════════
# GROQ API Keys
# ═══════════════════════════════════════════════════════════════════════════════

test_groq() {
    local key=$1
    local name=$2
    
    echo -n "Testing ${YELLOW}GROQ${NC} ($name): "
    
    response=$(curl -s -X GET "https://api.groq.com/openai/v1/models" \
        -H "Authorization: Bearer $key" \
        -H "Content-Type: application/json" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"object":"list"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "GROQ_$name=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("GROQ_$name")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}1️⃣  GROQ API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_groq "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" "KEY_1"
test_groq "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" "KEY_2"
test_groq "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" "KEY_3"
test_groq "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" "KEY_4"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Gemini API Keys
# ═══════════════════════════════════════════════════════════════════════════════

test_gemini() {
    local key=$1
    local name=$2
    
    echo -n "Testing ${BLUE}Gemini${NC} ($name): "
    
    response=$(curl -s -X GET "https://generativelanguage.googleapis.com/v1beta/models?key=$key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"models"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "GEMINI_$name=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("GEMINI_$name")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}2️⃣  Gemini API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_gemini "AIzaSyDF7WPENGOxFuXzQ_ZhxCrwrtX5pD0sw80" "KEY_1"
test_gemini "AIzaSyB_lc_BH8a3X5jfKqsQgFuiXOHRIvJXhzQ" "KEY_2"
test_gemini "AIzaSyCjFWH9es3em3IL_dexvLzbz7YfwxygIBk" "KEY_3"
test_gemini "AIzaSyAk3BJhoy-RaVYkaCKXh7aBARofpwTmpEc" "KEY_4"
test_gemini "AIzaSyAg4xWmHdBa-NYDigIcv2HhGEWsPi8W5-M" "KEY_5"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Mistral API Keys
# ═══════════════════════════════════════════════════════════════════════════════

test_mistral() {
    local key=$1
    local name=$2
    
    echo -n "Testing ${YELLOW}Mistral${NC} ($name): "
    
    response=$(curl -s -X GET "https://api.mistral.ai/v1/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"object":"list"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "MISTRAL_$name=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("MISTRAL_$name")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}3️⃣  Mistral API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_mistral "T1TtBaI37EWoJFo0jjTvZjJWYn8qyhqb" "KEY_1"
test_mistral "2o7BdHajiAEtJ3dBRGOXuu5IAceWFGqp" "KEY_2"
test_mistral "jjIcgRTDTqoZFttQgwUKk7hwLTYxoLRq" "KEY_3"
test_mistral "iZxLX6mDrX2u3MUMBtmNEofqoNy0lQc7" "KEY_4"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Hugging Face API Keys
# ═══════════════════════════════════════════════════════════════════════════════

test_hf() {
    local key=$1
    local name=$2
    
    echo -n "Testing ${BLUE}Hugging Face${NC} ($name): "
    
    response=$(curl -s -X GET "https://api-inference.huggingface.co/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '\[' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "HF_$name=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("HF_$name")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}4️⃣  Hugging Face API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_hf "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" "KEY_1"
test_hf "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" "KEY_2"
test_hf "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" "KEY_3"
test_hf "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" "KEY_4"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# OpenRouter API Key
# ═══════════════════════════════════════════════════════════════════════════════

test_openrouter() {
    local key=$1
    
    echo -n "Testing ${BLUE}OpenRouter${NC}: "
    
    response=$(curl -s -X GET "https://openrouter.ai/api/v1/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"data"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "OPENROUTER=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("OPENROUTER")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}5️⃣  OpenRouter API Key${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_openrouter "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"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Together.ai API Key
# ═══════════════════════════════════════════════════════════════════════════════

test_together() {
    local key=$1
    
    echo -n "Testing ${YELLOW}Together.ai${NC}: "
    
    response=$(curl -s -X GET "https://api.together.xyz/v1/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"data"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "TOGETHER=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("TOGETHER")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}6️⃣  Together.ai API Key${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_together "tgp_v1_FzAt7liQWG4WCZP_1hvutXFjhwWmPdpH5ijQ_q0zJVk"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Cohere API Key
# ═══════════════════════════════════════════════════════════════════════════════

test_cohere() {
    local key=$1
    
    echo -n "Testing ${BLUE}Cohere${NC}: "
    
    response=$(curl -s -X GET "https://api.cohere.ai/v1/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"models"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "COHERE=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("COHERE")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}7️⃣  Cohere API Key${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_cohere "l9AiVVhqFsgfSCTtwKXdlLFM41HtmQzSKa5gfCC6"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# OpenAI API Keys
# ═══════════════════════════════════════════════════════════════════════════════

test_openai() {
    local key=$1
    local name=$2
    
    echo -n "Testing ${GREEN}OpenAI${NC} ($name): "
    
    response=$(curl -s -X GET "https://api.openai.com/v1/models" \
        -H "Authorization: Bearer $key" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"object":"list"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "OPENAI_$name=$key" >> "$RESULTS_FILE"
        LIVE_KEYS+=("OPENAI_$name")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}8️⃣  OpenAI (ChatGPT) API Keys${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_openai "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" "KEY_1"
test_openai "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" "KEY_2"
test_openai "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" "KEY_3"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Ollama Endpoint
# ═══════════════════════════════════════════════════════════════════════════════

test_ollama() {
    local url=$1
    
    echo -n "Testing ${GRAY}Ollama${NC}: "
    
    response=$(curl -s -X GET "$url/api/tags" \
        --max-time 5 2>/dev/null || echo "ERROR")
    
    if echo "$response" | grep -q '"models"' 2>/dev/null; then
        echo -e "${GREEN}✅ LIVE${NC}"
        echo "OLLAMA=$url" >> "$RESULTS_FILE"
        LIVE_KEYS+=("OLLAMA")
        ((PASS++))
    else
        echo -e "${RED}❌ DEAD${NC}"
        ((FAIL++))
    fi
}

echo -e "${BLUE}9️⃣  Ollama Endpoint${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_ollama "http://46.219.108.236:11434"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "📊 Results: ${GREEN}${PASS} LIVE${NC} | ${RED}${FAIL} DEAD${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ LIVE KEYS:${NC}"
for key in "${LIVE_KEYS[@]}"; do
    echo "   • $key"
done
echo ""

echo "📝 Results saved to: $RESULTS_FILE"
cat "$RESULTS_FILE"
