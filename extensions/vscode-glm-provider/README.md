# 🤖 Multi-LLM Provider for VS Code (GLM + Gemini)

Native integration of GLM models from Z.ai and Gemini models from Google AI Studio into VS Code Chat Panel — Cursor-like experience without any third-party extensions.

## 🎯 Features

- ✅ Native VS Code Chat Panel integration
- ✅ **GLM Models**: GLM-5.1, GLM-5, GLM-4.7 (Z.ai)
- ✅ **Gemini Models**: Gemini 2.5 Flash/Pro, Gemini 1.5 Flash/Pro (Google AI Studio)
- ✅ Streaming responses (real-time code generation)
- ✅ Auto-apply diffs (Cursor-like behavior)
- ✅ Workspace context awareness
- ✅ Active file and selection context
- ✅ No external dependencies or SDKs needed
- ✅ Automatic provider routing based on model selection

## ⚙️ Installation

### Step 1: Install Dependencies

```bash
cd extensions/vscode-glm-provider
npm install
```

### Step 2: Compile the Extension

```bash
npm run compile
```

This creates the `dist/extension.js` file.

### Step 3: Install the Extension in VS Code

```bash
code --install-extension /Users/Shared/Predator_60/extensions/vscode-glm-provider/dist/extension.vsix
```

Or manually:
1. Open VS Code
2. Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
3. Click "Install from VSIX..."
4. Select `/Users/Shared/Predator_60/extensions/vscode-glm-provider/dist/extension.vsix`

### Step 4: Set Your API Keys

#### For GLM Models (Z.ai)

```bash
export ZAI_API_KEY="your_zai_api_key_here"
```

Or set in VS Code settings (User Settings > `settings.json`):

```jsonc
{
  "zai.apiKey": "your_zai_api_key_here"
}
```

#### For Gemini Models (Google AI Studio)

```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
# Or use the Pro key
export GEMINI_PRO_API_KEY="your_gemini_pro_api_key_here"
```

Or set in VS Code settings (User Settings > `settings.json`):

```jsonc
{
  "gemini.apiKey": "your_gemini_api_key_here"
}
```

**Note**: You can set both API keys simultaneously to use both providers.

### Step 5: Restart VS Code

Close and reopen VS Code to activate the extension.

## 🚀 Usage

1. Open Chat Panel: `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

2. Select model from dropdown:

   **GLM Models (Z.ai)**:
   - GLM-5.1 (Coding Plan) — for coding tasks
   - GLM-5 — for general tasks
   - GLM-4.7 — for general coding assistance

   **Gemini Models (Google AI Studio)**:
   - Gemini 2.5 Flash — fast, general purpose
   - Gemini 2.5 Pro — advanced reasoning
   - Gemini 1.5 Flash — fast, multimodal
   - Gemini 1.5 Pro — advanced multimodal

3. Start chatting!

## ⚙️ Configuration

### Chat Settings

Enable Cursor-like behavior:

```jsonc
{
  // Auto-apply code changes
  "chat.editing.autoApply": true,
  "chat.editing.autoAccept": true,
  "chat.editing.confirmEdit": false,

  // Enable chat context
  "chat.context.enabled": true,
  "chat.context.includeActiveFile": true,
  "chat.context.includeSelection": true,
  "chat.context.includeChatHistory": true,

  // Chat history
  "chat.history.enabled": true,
  "chat.history.maxHistoryItems": 20,

  // Terminal/File/Browser tools
  "chat.tools.terminal.autoApprove": {
    "/.*/": true,
    "*": true
  },
  "chat.tools.file.autoApprove": {
    "/.*/": true,
    "*": true
  }
}
```

### VS Code Settings JSON

Add to your global user settings (`settings.json`):

```jsonc
{
  "multi-llm.chat.defaultModel": "gemini-2.5-flash",

  "chat.context.enabled": true,
  "chat.context.scope": "workspace",
  "chat.context.includeActiveFile": true,
  "chat.context.includeSelection": true,

  "chat.editing.autoApply": true,
  "chat.editing.autoAccept": true,
  "chat.editing.confirmEdit": false,
  "chat.editing.previewDiff": true,

  "chat.history.enabled": true,
  "chat.history.maxHistoryItems": 20,

  "chat.experimental.sidebar": true
}
```

## 🔄 How It Works

### Pipeline

```
1. User prompts → Chat Panel
2. VS Code collects context:
   - Active file (preview)
   - Selection (if any)
   - Workspace files (optional)
3. Request → GLM API (streaming)
4. GLM returns response
5. If code diff → applies patch (auto-apply)
6. Shows preview
```

### GLM API

- **Base URL**: `https://api.z.ai/api/coding/paas/v4`
- **Protocol**: POST `/chat/completions`
- **Auth**: Bearer token (ZAI_API_KEY)
- **Streaming**: Server-Sent Events (SSE)
- **Response Format**:
  ```
  data: {"choices":[{"delta":{"content":"from typing"}}]}

  data: {"choices":[{"delta":{"content":", List"}}]}

  data: [DONE]
  ```

## 📋 API Contract

### Request

```json
POST https://api.z.ai/api/coding/paas/v4/chat/completions

Authorization: Bearer <ZAI_API_KEY>

{
  "model": "glm-5.1",
  "messages": [
    {
      "role": "user",
      "content": "Перероби цей код на Python 3.12"
    }
  ],
  "stream": true
}
```

> Note: the `GLM-4.7` option in VS Code is exposed as a UI alias, but the provider sends the actual Z.ai fast model name `glm-4-plus` to the API.

### Response (SSE)

```json
data: {"choices":[{"delta":{"content":"from typing"}}]}

data: {"choices":[{"delta":{"content":", List"}}]}

data: [DONE]
```

## 🔑 API Key Management

### Environment Variable (Recommended)

```bash
export ZAI_API_KEY="your_api_key_here"
```

### VS Code Secrets (Production)

```bash
code --user-data-dir /path/to/user/data
```

Then set API key in your shell (environment variable) or via VS Code's Secret Storage API.

## 🧪 Testing

Run tests:

```bash
npm test
```

Run linter:

```bash
npm run lint
```

## 📚 Resources

- [Z.ai API Documentation](https://z.ai/docs)
- [VS Code Language Model Chat API](https://code.visualstudio.com/api/language-features/language-model-chat)
- [Custom Chat Providers Guide](https://github.com/microsoft/vscode-recipes/tree/main/custom-chat-providers)

## 📝 Troubleshooting

### GLM API Error

**Error**: `GLM API error (401): Unauthorized`

**Solution**: Set ZAI_API_KEY environment variable:
```bash
export ZAI_API_KEY="your_key"
```

### Extension Not Showing in Chat

**Solution**:
1. Restart VS Code
2. Check Extensions panel (Cmd+Shift+X) — "Z.ai GLM Provider" should be installed
3. Check activation events in package.json

### No Streaming Response

**Solution**:
1. Check internet connection
2. Verify API key has credits
3. Check VS Code logs (`Help > Toggle Developer Tools`)

### Code Not Auto-Applying

**Solution**: Enable auto-apply:
```jsonc
{
  "chat.editing.autoApply": true,
  "chat.editing.autoAccept": true,
  "chat.editing.confirmEdit": false
}
```

## 🤝 Contributing

Contributions are welcome! This is a minimal implementation — feel free to enhance:

- Add more GLM models
- Improve error handling
- Add token counting
- Support for image inputs
- Multi-turn conversation optimization

## 📄 License

MIT License

---

**Created**: 2026-06-20
**Version**: 1.0.0
**Author**: Predator Analytics Team
