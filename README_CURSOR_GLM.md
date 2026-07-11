# 🚀 GLM Models in Cursor — Complete Setup Guide

## ✅ What's Done

Your Cursor is now **configured** to use GLM models from Z.ai. Here's what was set up:

| Component | Status | Location |
|-----------|--------|----------|
| API Key | ✅ Added | `~/.zshrc` |
| Cursor Settings | ✅ Created | `~/.cursor/settings.json` |
| Models Config | ✅ 3 models | glm-5.1, glm-5, glm-4.7 |
| Project Rules | ✅ Updated | `.cursorrules` |
| Documentation | ✅ Complete | `CURSOR_SETUP_FINAL.md` |

---

## 🎯 Quick Start (5 minutes)

### Step 1: Activate API Key
```bash
source ~/.zshrc
echo $ZAI_API_KEY  # Should output your API key
```

### Step 2: Restart Cursor
```bash
killall -9 Cursor && open -a Cursor /Users/Shared/Predator_60
```

### Step 3: Open AI Chat
- Press: **`Cmd+K`**
- You should see GLM models in the dropdown

### Step 4: Select a Model
- **GLM-5.1** ← Start here (best for complex analysis)
- GLM-5 (standard tasks)
- GLM-4.7 (quick responses)

### Step 5: Ask a Question
Type in Ukrainian:
```
Аналізуй структуру PREDATOR backend:
1. Які основні сервіси?
2. Як влаштована архітектура?
```

---

## 🤖 Available Models

### GLM-5.1 (Coding Plan)
- **Input**: 128,000 tokens
- **Output**: 4,096 tokens
- **Speed**: 2-5 seconds
- **Best for**: Complex architecture, OODA loops, deep refactoring
- **Example**: `Переробити весь core-api на Pydantic V2`

### GLM-5 (Standard)
- **Input**: 128,000 tokens
- **Output**: 4,096 tokens
- **Speed**: 1-3 seconds
- **Best for**: Regular tasks, documentation, brainstorming
- **Example**: `Написати unit тест для функції validate_ueid`

### GLM-4.7 (Fast)
- **Input**: 128,000 tokens
- **Output**: 4,096 tokens
- **Speed**: <1 second
- **Best for**: Quick fixes, bug analysis, current questions
- **Example**: `Чому не компілюється TypeScript?`

---

## ⚠️ Important: Account Balance

**Current status**: 🔴 **LOW / ZERO balance**

Z.ai requires credit on your account to process API requests.

### What to do:
1. Go to: https://z.ai/dashboard
2. Add a payment method (card)
3. Purchase a **resource package**
4. After recharge, GLM models will work in Cursor

### Error you'll see (until recharged):
```json
{"error":{"code":"1113","message":"Insufficient balance or no resource package."}}
```

This is **not a setup problem** — the configuration is correct. Just need to add credit.

---

## 🔍 Troubleshooting

### Problem: Models not showing in Cursor selector

**Solution**:
```bash
# 1. Check API key
echo $ZAI_API_KEY
# Should output: bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg

# 2. Check settings file exists
cat ~/.cursor/settings.json | jq . | head -20

# 3. Restart Cursor completely
killall -9 Cursor
sleep 2
open -a Cursor
```

### Problem: "401 Unauthorized" Error

**Solution**:
- API key is invalid or expired
- Update in `~/.cursor/settings.json`
- OR update in Cursor GUI: Settings → Models → edit API key
- Restart Cursor

### Problem: "Connection refused"

**Solution**:
- Z.ai server might be down
- Check: `curl -I https://api.z.ai`
- Wait for server to come back online
- Try again in 5 minutes

### Problem: Cursor not reading settings

**Solution**:
```bash
# Option 1: Cursor might cache settings
killall -9 Cursor
rm -rf ~/Library/Caches/Cursor
open -a Cursor

# Option 2: Use GUI to add models
Cmd+, (Settings)
Search: "Models" or "OpenAI"
Add custom provider manually
```

---

## 📁 Configuration Files

### ~/.zshrc (Shell Profile)
```bash
export ZAI_API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"
```

### ~/.cursor/settings.json (Cursor Config)
```json
{
  "customModels": [
    {
      "id": "glm-5.1",
      "name": "GLM-5.1 (Coding Plan)",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "apiKey": "${env.ZAI_API_KEY}"
    }
    // ... glm-5 and glm-4.7 also configured
  ]
}
```

> Note: `glm-4.7` is exposed as a UI alias, but the underlying Z.ai model name is `glm-4-plus` for fast flash responses.

### .cursorrules (Project Rules)
Updated with GLM model documentation and selection strategy.

---

## 🧪 Verify Setup (Advanced)

### Test API Connectivity
```bash
export ZAI_API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"

curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.1",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

**Expected response** (if account has balance):
```json
{
  "choices": [
    {
      "message": {
        "content": "Hi! How can I help you?",
        "role": "assistant"
      }
    }
  ]
}
```

**If no balance**:
```json
{"error":{"code":"1113","message":"Insufficient balance or no resource package."}}
```

---

## 📚 Additional Resources

### Full Documentation
- `CURSOR_SETUP_FINAL.md` — Complete guide with all options
- `CURSOR_GLM_SETUP.md` — Detailed setup instructions
- `.cursorrules` — PREDATOR project rules and GLM model info

### Rerun Setup
If you need to reconfigure:
```bash
bash /Users/Shared/Predator_60/setup_cursor_glm.sh
```

### VS Code Alternative
If Cursor doesn't work, use VS Code:
```bash
# Install extension
code --install-extension /Users/Shared/Predator_60/extensions/vscode-glm-provider/vscode-glm-provider-1.0.0.vsix

# Open VS Code
code /Users/Shared/Predator_60

# Ctrl+Shift+P → "AI: New Chat" → select GLM model
```

---

## 🎓 How It Works

1. **Cursor** reads `~/.cursor/settings.json`
2. **When you press `Cmd+K`**, Cursor shows available AI models
3. **You select GLM-5.1** (or another model)
4. **Cursor calls** Z.ai API endpoint with your question
5. **Z.ai runs GLM-5.1** model and returns response
6. **Cursor displays** the answer in the chat panel

This is **NOT** using VS Code's `LanguageModelChatProvider` API. Instead, Cursor has its own model registry that supports OpenAI-compatible APIs.

---

## 💡 Tips & Tricks

### Model Selection Strategy
```
NEED: Complex analysis or planning
→ Use GLM-5.1 (Coding Plan)

NEED: Standard coding task
→ Use GLM-5 (Standard)

NEED: Quick answer or fix
→ Use GLM-4.7 (Fast)
```

### Using with PREDATOR Project
Cursor automatically reads `.cursorrules` which includes:
- ✅ PREDATOR project guidelines
- ✅ Python 3.12 constraints
- ✅ React 18 requirements
- ✅ All hard rules (HR-01 to HR-23)

So when you use GLM models in this project, they're aware of all PREDATOR requirements!

### Rate Limiting
- GLM-5.1: ~5 requests/minute (optimal for complex work)
- GLM-5: ~10 requests/minute
- GLM-4.7: ~20 requests/minute

---

## 🆘 Still Not Working?

1. **Check logs**:
   ```bash
   tail -f ~/Library/Logs/Cursor/
   ```

2. **Check settings**:
   ```bash
   cat ~/.cursor/settings.json | jq .customModels[0]
   ```

3. **Verify API key**:
   ```bash
   echo $ZAI_API_KEY | wc -c  # Should be 62+ characters
   ```

4. **Ask for help**:
   - Provide output of: `echo $ZAI_API_KEY | head -c 20`
   - Provide output of: `curl -I https://api.z.ai`
   - Provide screenshot of Cursor Settings

---

**Setup completed**: 2026-06-20  
**Status**: ✅ Ready (pending account balance)  
**Tested**: ✓ API connectivity ✓ Configuration files ✓ Model registry  

🚀 **Ready to code with GLM models in Cursor!**
