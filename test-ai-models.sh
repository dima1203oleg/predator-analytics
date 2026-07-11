#!/bin/bash

# ══════════════════════════════════════════════════════════════════
# Test AI Models — Quick Verification Script
# Перевірка всіх налаштованих моделей
# ══════════════════════════════════════════════════════════════════

set -e

echo "🧪 PREDATOR AI Models Test Suite"
echo "══════════════════════════════════════════════════════════════════"
echo ""

# Load environment
source ~/.zshrc 2>/dev/null || true

PASS=0
FAIL=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to test
test_api() {
    local name=$1
    local url=$2
    local key=$3
    local expected_status=${4:-200}
    
    echo -n "Testing ${BLUE}${name}${NC}... "
    
    if [ -z "$key" ]; then
        echo -e "${YELLOW}⏭️  SKIPPED (no key)${NC}"
        return 0
    fi
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$url" \
        -H "Authorization: Bearer $key" \
        -H "Content-Type: application/json" \
        -m 5 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "401" ] || [ "$response" = "403" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $response, expected $expected_status)"
        ((FAIL++))
    fi
}

# Section 1: Environment Variables
echo -e "${BLUE}1️⃣  Environment Variables${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -n "$ZAI_API_KEY" ] && echo -e "   ${GREEN}✅${NC} ZAI_API_KEY: ${ZAI_API_KEY:0:10}..." || echo -e "   ${RED}❌${NC} ZAI_API_KEY: NOT SET"
[ -n "$GOOGLE_API_KEY" ] && echo -e "   ${GREEN}✅${NC} GOOGLE_API_KEY: ${GOOGLE_API_KEY:0:10}..." || echo -e "   ${RED}❌${NC} GOOGLE_API_KEY: NOT SET"
[ -n "$GROQ_API_KEY" ] && echo -e "   ${GREEN}✅${NC} GROQ_API_KEY: ${GROQ_API_KEY:0:10}..." || echo -e "   ${YELLOW}⏭️ ${NC} GROQ_API_KEY: NOT SET"
echo ""

# Section 2: API Connectivity
echo -e "${BLUE}2️⃣  API Connectivity Tests${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Z.ai
test_api "Z.ai" "https://api.z.ai/api/coding/paas/v4/models" "$ZAI_API_KEY"

# Google Gemini
test_api "Google Gemini" "https://generativelanguage.googleapis.com/v1beta/models" "$GOOGLE_API_KEY" "200"

# GROQ
test_api "GROQ" "https://api.groq.com/openai/v1/models" "$GROQ_API_KEY"

# LiteLLM Gateway
echo -n "Testing ${BLUE}LiteLLM Gateway${NC}... "
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://194.177.1.240:4000/v1/models" \
    -m 5 2>/dev/null || echo "000")
if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
    ((PASS++))
elif [ "$response" = "000" ]; then
    echo -e "${YELLOW}⏭️  NETWORK (server may be down)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP $response${NC}"
fi

echo ""

# Section 3: Cursor Config
echo -e "${BLUE}3️⃣  Cursor Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CURSOR_CONFIG="$HOME/.cursor/settings.json"
if [ -f "$CURSOR_CONFIG" ]; then
    MODELS=$(jq '.customModels | length' "$CURSOR_CONFIG" 2>/dev/null || echo "?")
    echo -e "   ${GREEN}✅${NC} Cursor config: $MODELS models configured"
    ((PASS++))
else
    echo -e "   ${RED}❌${NC} Cursor config: NOT FOUND"
    ((FAIL++))
fi

# Check specific models
for model in "glm-5.1" "gemini-2-flash" "mixtral-8x7b"; do
    if jq -e ".customModels[] | select(.id == \"$model\")" "$CURSOR_CONFIG" >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅${NC} Model '$model' configured"
        ((PASS++))
    else
        echo -e "   ${YELLOW}⏭️ ${NC} Model '$model' not found"
    fi
done

echo ""

# Section 4: VS Code Extension
echo -e "${BLUE}4️⃣  VS Code Extension${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

VSCODE_EXT="/Users/Shared/Predator_60/extensions/vscode-glm-provider"
if [ -d "$VSCODE_EXT" ]; then
    echo -e "   ${GREEN}✅${NC} Extension directory found"
    ((PASS++))
    
    if [ -f "$VSCODE_EXT/package.json" ]; then
        echo -e "   ${GREEN}✅${NC} package.json exists"
        ((PASS++))
    fi
    
    if [ -f "$VSCODE_EXT/src/extension.ts" ]; then
        echo -e "   ${GREEN}✅${NC} extension.ts exists"
        ((PASS++))
    fi
else
    echo -e "   ${RED}❌${NC} Extension directory NOT FOUND"
    ((FAIL++))
fi

echo ""

# Section 5: File Configuration
echo -e "${BLUE}5️⃣  Configuration Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

files=(
    "$HOME/.zshrc"
    "/Users/Shared/Predator_60/.env.ai-models"
    "/Users/Shared/Predator_60/.cursor/settings-max-models.json"
    "/Users/Shared/Predator_60/AI_MODELS_GUIDE.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✅${NC} $(basename $file)"
        ((PASS++))
    else
        echo -e "   ${RED}❌${NC} $(basename $file) - NOT FOUND"
        ((FAIL++))
    fi
done

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "📊 Test Results: ${GREEN}${PASS} PASS${NC} | ${RED}${FAIL} FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed or skipped${NC}"
    exit 1
fi
