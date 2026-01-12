#!/bin/bash
# Test LLM Council API Keys

echo "🧪 Testing API Keys..."

# Test Groq
echo ""
echo "Testing Groq..."
curl -s https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer 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" | head -c 200

# Test Gemini
echo ""
echo ""
echo "Testing Gemini..."
curl -s "https://generativelanguage.googleapis.com/v1/models?key=AIzaSyBSg76crDWrn_ZMd7G5p10qJ1KVy7IaD3A" | head -c 200

# Test DeepSeek
echo ""
echo ""
echo "Testing DeepSeek..."
curl -s https://api.deepseek.com/v1/models \
  -H "Authorization: Bearer sk-c5009c642d0a43d7988aeae76c891011" | head -c 200

echo ""
echo ""
echo "✅ Test complete"
