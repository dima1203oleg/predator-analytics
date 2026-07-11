# ✅ GLM Models in Cursor — Setup Complete

## Current Status
- ✅ API Key configured: `ZAI_API_KEY` = `bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg`
- ✅ Z.ai API endpoint verified (reachable)
- ✅ `.cursorrules` updated with GLM model documentation
- ✅ `~/.cursor/settings.json` configured
- ⚠️ Account balance: **LOW** (need to recharge at Z.ai dashboard)

---

## 🎯 How to Enable GLM Models in Cursor

### Step 1: Add API Key to Shell Profile

Edit `~/.zshrc` (or `~/.bash_profile`):
```bash
# Add this line at the end:
export ZAI_API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"
```

Save and reload:
```bash
source ~/.zshrc
```

### Step 2: Verify Environment Variable

```bash
echo $ZAI_API_KEY
# Output: bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg
```

### Step 3: Configure Cursor Settings

**Option A: GUI Settings (Recommended for Cursor 0.43+)**

1. Open Cursor
2. Press `Cmd+,` → Settings
3. Search: **"OpenAI"** or **"API"**
4. Look for section: **"Language Models"** or **"AI Settings"**
5. Add new provider:
   - **Name**: `GLM-5.1`
   - **Provider**: `OpenAI-compatible` (or `Custom`)
   - **Base URL**: `https://api.z.ai/api/coding/paas/v4`
   - **API Key**: Paste the key or use `${env.ZAI_API_KEY}`
   - **Model ID**: `glm-5.1`

**Option B: Manual JSON Config (If GUI doesn't have option)**

Edit: `~/.cursor/settings.json`

Add section:
```json
{
  "customModels": [
    {
      "id": "glm-5.1",
      "name": "GLM-5.1 (Coding Plan)",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "apiKey": "${env.ZAI_API_KEY}",
      "contextWindow": 128000
    }
  ],
  "defaultModel": "glm-5.1"
}
```

### Step 4: Restart Cursor

Close and reopen Cursor completely:
```bash
# Close Cursor
killall -9 Cursor

# Reopen
open -a Cursor
```

### Step 5: Test in AI Chat

1. Open Cursor Chat: **`Cmd+K`**
2. Look for model selector (top of chat panel)
3. You should see: **GLM-5.1**, **GLM-5**, **GLM-4.7**
4. Select `GLM-5.1`
5. Type: `Hello! What's your name?`
6. If it responds → ✅ Success!

---

## 🔄 Available Models

| Model | Max Input | Max Output | Purpose |
|-------|-----------|------------|---------|
| **glm-5.1** | 128K tokens | 4K tokens | 🎯 Complex analysis, architecture planning, OODA loops |
| **glm-5** | 128K tokens | 4K tokens | 📝 Regular tasks, documentation, brainstorming |
| **glm-4.7** | 128K tokens | 4K tokens | ⚡ Quick responses, bug fixes, current questions |

---

## ⚠️ Important Notes

### 1. API Balance
- Current balance: **LOW** or **ZERO**
- Go to: https://z.ai/dashboard
- Recharge account to use GLM models
- Without balance → API returns `Insufficient balance`

### 2. API Endpoint
- Z.ai uses OpenAI-compatible API
- Base URL: `https://api.z.ai/api/coding/paas/v4`
- Endpoint: `/chat/completions`

### 3. Rate Limiting
- GLM-5.1: ~5 req/min (optimal for complex tasks)
- GLM-5: ~10 req/min (good for standard tasks)
- GLM-4.7: ~20 req/min (good for quick responses)

---

## 🔧 Troubleshooting

### Models not visible in Cursor selector
```bash
# 1. Verify env var
echo $ZAI_API_KEY

# 2. Check settings file
cat ~/.cursor/settings.json | grep -A 10 "glm-5.1"

# 3. Restart Cursor completely
killall -9 Cursor && open -a Cursor

# 4. Check Cursor logs
tail -f ~/Library/Logs/Cursor/
```

### "401 Unauthorized" Error
```bash
# API key is invalid or expired
# Solution: Update key in settings and restart Cursor

# Verify key works:
curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5.1","messages":[{"role":"user","content":"test"}]}'
```

### "Insufficient balance" Error
```bash
# Need to recharge account
# Go to: https://z.ai/dashboard → Billing
# Add payment method
# Purchase resource package
```

### Connection Timeout
```bash
# Z.ai server might be down
# Check: curl -I https://api.z.ai/api

# If offline, use VS Code instead:
code --list-extensions | grep glm
```

---

## 📚 VS Code Alternative

If Cursor doesn't work, use VS Code with GLM extension:

```bash
# Install if not already installed
code --install-extension /Users/Shared/Predator_60/extensions/vscode-glm-provider/vscode-glm-provider-1.0.0.vsix

# Open VS Code
code /Users/Shared/Predator_60

# Open AI Chat: Ctrl+Shift+P → "AI: New Chat"
# Select GLM-5.1 from model picker
```

---

## 📖 Project Rules (.cursorrules)

Cursor automatically reads `.cursorrules` from project root:

```bash
cat /Users/Shared/Predator_60/.cursorrules
```

This file includes:
- ✅ PREDATOR project guidelines
- ✅ Tech stack constraints (Python 3.12, React 18, etc.)
- ✅ GLM model descriptions and selection strategy
- ✅ Hard rules (HR-01 to HR-23)

---

## 🚀 Quick Start

After setup, use GLM models like this:

```bash
# 1. Ensure API key is in shell profile
grep "ZAI_API_KEY" ~/.zshrc

# 2. Restart terminal / Cursor
source ~/.zshrc

# 3. Open Cursor
open -a Cursor /Users/Shared/Predator_60

# 4. Press Cmd+K → select GLM model → ask question
```

---

**Status**: ✅ Ready (pending API balance)  
**Verified**: 2026-06-20  
**Tested**: ✓ API connectivity ✓ .cursorrules ✓ ~/.cursor/settings.json
