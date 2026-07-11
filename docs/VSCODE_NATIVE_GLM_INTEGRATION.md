# 🤖 VS CODE NATIVELY INTEGRATED GLM (Z.ai) — CURSOR-LIKE MODE

> **Last Updated**: 2026-06-20
> **Status**: ⚠️ ARCHITECTURAL NOTE: Native Chat UI requires custom extension via LanguageModelChatProvider API

---

## 🎯 Мета системи

Перетворити VS Code у середовище, де:
- Chat Panel працює як Cursor Chat
- GLM (Z.ai) доступний у Model Selector
- немає сторонніх extension’ів (Cline/Continue заборонено)
- використовується тільки native VS Code AI Chat API

---

## ⚠️ АРХІТЕКТУРНА ВИМОВА

**Важливо розуміти:**

✅ **ПІДТРИМУЄТЬСЯ NATIVE CHAT UI:**
- Chat Panel з model selector
- Контекст файлу/вибору
- code-aware responses
- auto-apply diffs (налаштовано в settings.json)

❌ **НЕ ПІДТРИМУЄТЬСЯ ЗА SETTINGS.JSON:**
- Немає параметра `chat.providers` у VS Code
- Custom provider registration вимагає **custom extension** через LanguageModelChatProvider API
- Не можна змінити базовий OpenAI провайдер через settings.json

---

## 🧠 1. ТИПОВЕ РІШЕННЯ (Native Extension)

Щоб додати GLM у VS Code Chat UI, треба створити **custom extension**.

### 📋 Реалізація

**Файл**: `extensions/vscode-glm-provider/package.json`

```json
{
  "name": "vscode-glm-provider",
  "displayName": "Z.ai GLM Provider for VS Code",
  "version": "1.0.0",
  "publisher": "predator-analytics",
  "engines": {
    "vscode": "^1.100.0"
  },
  "categories": ["AI"],
  "activationEvents": [
    "onLanguage:typescript",
    "onLanguage:python",
    "onLanguage:javascript"
  ],
  "contributes": {
    "chat.contributions": [
      {
        "id": "zai-glm-chat",
        "type": "languageModelChat",
        "displayName": "Z.ai GLM",
        "provider": "zai-glm",
        "defaultModel": "glm-5.1"
      }
    ],
    "languageModelChatProviders": [
      {
        "id": "zai-glm",
        "displayName": "Z.ai GLM",
        "supportsModelSelection": true,
        "description": "GLM models from Z.ai (https://z.ai/)"
      }
    ],
    "languageModelChatModels": [
      {
        "id": "glm-5.1",
        "providerId": "zai-glm",
        "displayName": "GLM-5.1 (Coding Plan)",
        "description": "GLM-5.1 for coding tasks",
        "features": {
          "code": true,
          "reasoning": true,
          "reflection": true
        }
      },
      {
        "id": "glm-5",
        "providerId": "zai-glm",
        "displayName": "GLM-5",
        "description": "GLM-5 for general tasks",
        "features": {
          "code": true,
          "reasoning": true
        }
      },
      {
        "id": "glm-4.7",
        "providerId": "zai-glm",
        "displayName": "GLM-4.7",
        "description": "GLM-4.7 for general coding",
        "features": {
          "code": true,
          "reasoning": false
        }
      }
    ]
  },

  > Note: The VS Code model selector exposes `glm-4.7` as an alias, while the provider sends the actual Z.ai model name `glm-4-plus` to the API for fast flash responses.
  },
  "main": "./dist/extension.js",
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.100.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "typescript": "^5.3.0",
    "@types/vscode-webview": "^1.0.2",
    "@types/mocha": "^10.0.1",
    "@types/sinon": "^10.2.0",
    "@types/sinonjs/callstats": "^0.0.1",
    "mocha": "^10.2.0",
    "sinon": "^15.2.0",
    "@vscode/test-electron": "^2.3.0"
  }
}
```

**Файл**: `extensions/vscode-glm-provider/src/extension.ts`

```typescript
import * as vscode from 'vscode';
import fetch from 'node-fetch';

export function activate(context: vscode.ExtensionContext) {
  console.log('GLM Provider activated');

  // Register the provider
  vscode.lm.registerLanguageModelChatProvider('zai-glm', new GLMProvider());

  // Auto-apply settings
  const config = vscode.workspace.getConfiguration('chat.editing');
  await config.update('autoApply', true, vscode.ConfigurationTarget.Global);
  await config.update('autoAccept', true, vscode.ConfigurationTarget.Global);
  await config.update('confirmEdit', false, vscode.ConfigurationTarget.Global);
}

class GLMProvider implements vscode.LanguageModelChatProvider {
  async provideLanguageModelChatInformation() {
    return [
      { id: 'glm-5.1', name: 'GLM-5.1 (Coding Plan)' },
      { id: 'glm-5', name: 'GLM-5' },
      { id: 'glm-4.7', name: 'GLM-4.7' }
    ];
  }

  async provideLanguageModelChatResponse(
    model: { id: string },
    messages: readonly vscode.LanguageModelChatRequestMessage[],
    options: vscode.ProvideLanguageModelChatResponseOptions,
    progress: vscode.Progress<vscode.LanguageModelResponsePart>,
    token: vscode.CancellationToken
  ): Promise<void> {
    const apiKey = process.env.ZAI_API_KEY || vscode.env.clipboard.readTextSync(); // TODO: Use proper secret storage
    const baseUrl = 'https://api.z.ai/api/coding/paas/v4';

    // Convert VS Code messages to GLM format
    const messagesForGLM = messages.map(msg => {
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'assistant',
          content: msg.content
        };
      } else if (msg.role === 'system') {
        return {
          role: 'system',
          content: msg.content
        };
      }
      return msg;
    });

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model.id,
          messages: messagesForGLM,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`GLM API error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (token.isCancellationRequested) {
          reader.cancel();
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE (Server-Sent Events)
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;

              if (content) {
                progress.report({ type: 'text', value: content });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('GLM provider error:', error);
      options.partialResult?.({ type: 'text', value: `Error: ${error}` });
    }
  }

  async provideTokenCount(model: { id: string }, text: string | vscode.LanguageModelChatRequestMessage) {
    if (typeof text === 'string') {
      return text.length; // Simplified token count
    }
    return text.content.length;
  }
}
```

---

## ⚙️ 2. НАЛАШТУВАННЯ VS CODE (Settings.json)

Після встановлення extension, налаштуйте VS Code:

```jsonc
{
  // GLM Provider settings
  "zai-glm.chat.defaultModel": "glm-5.1",

  // Chat context awareness
  "chat.context.enabled": true,
  "chat.context.scope": "workspace",
  "chat.context.includeActiveFile": true,
  "chat.context.includeSelection": true,
  "chat.context.includeChatHistory": true,

  // Chat editing behavior (Cursor-like)
  "chat.editing.autoApply": true,
  "chat.editing.autoAccept": true,
  "chat.editing.confirmEdit": false,
  "chat.editing.autoAcceptDelay": 0,
  "chat.editing.previewDiff": true,
  "chat.editing.alwaysApplyWithoutPreview": true,

  // Chat tools (Terminal, File, Browser)
  "chat.tools.terminal.autoApprove": {
    "/.*/": true,
    "*": true
  },
  "chat.tools.file.autoApprove": {
    "/.*/": true,
    "*": true
  },
  "chat.tools.browser.autoApprove": {
    "/.*/": true,
    "*": true
  },

  // Chat history
  "chat.history.enabled": true,
  "chat.history.maxHistoryItems": 20,
  "chat.history.maxHistoryMessages": 100,

  // Chat UI
  "chat.experimental.sidebar": true,
  "chat.experimental.enableCodeLens": true
}
```

---

## 🔄 3. ЛОГІКА РОБОТИ (ЯК CURSOR)

### 🧠 Pipeline:

```
1. User prompt → Chat UI
2. VS Code формує context:
   - Active file (preview)
   - Selection (if any)
   - Workspace files (optional)
3. Запит → GLM API (streaming)
4. Отримує response
5. Якщо є code diff → застосовує patch (auto-apply)
6. Показує preview
```

### 📝 Приклад діалогу:

**User Prompt:**
```
Перероби цей код на Python 3.12 з full type hints
```

**VS Code Context:**
```
Active file: /Users/dima1203/projects/example.py
Selection: from typing import List, Optional
```

**GLM Response:**
```python
from typing import List, Optional

def process_data(items: List[str]) -> List[Optional[int]]:
    """Process list of strings to optional integers."""
    result: List[Optional[int]] = []

    for item in items:
        try:
            result.append(int(item))
        except (ValueError, TypeError):
            result.append(None)

    return result
```

**Auto-Apply:**
- GLM надсилає patch
- VS Code застосовує patch автоматично (chat.editing.autoApply: true)
- Preview відображається
- Клікнути "Accept" для фінального застосування (chat.editing.autoAccept: true)

---

## 🔑 4. API КОНТРАКТ (Z.ai GLM)

### Base URL:
```
https://api.z.ai/api/coding/paas/v4
```

### Protocol:
```
POST /chat/completions
Authorization: Bearer <ZAI_API_KEY>
Content-Type: application/json
```

### Request Body:
```json
{
  "model": "glm-5.1",
  "messages": [
    {
      "role": "system",
      "content": "You are a coding assistant specialized in Python, TypeScript, and web development."
    },
    {
      "role": "user",
      "content": "Перероби цей код на Python 3.12 з full type hints"
    }
  ],
  "stream": true,
  "temperature": 0.2,
  "max_tokens": 4096
}
```

### Response Format (SSE):
```
data: {"choices":[{"delta":{"content":"from typing import List"}}]}

data: {"choices":[{"delta":{"content":", Optional"}}]}

data: [DONE]
```

---

## ⚠️ 5. ОБМЕЖЕННЯ NATIVE MODE

### ❌ НЕ ПІДТРИМУЄТЬСЯ:

- **Автономні agent loops** (як Cursor Composer)
- **Multi-step execution** (plan → act → verify)
- **Terminal automation** (без explicit consent)
- **File graph reasoning** (тільки контекст активного файлу)
- **Memory + repo indexing** (без custom extension)

### ✅ ПІДТРИМУЄТЬСЯ:

- Chat UI з model selector
- Code generation
- File-aware responses
- Auto-apply diffs
- Streaming responses
- CodeLens suggestions

---

## 🚀 6. ВИМУГИ ДО СЕРЕДОВИЩА

### Мінімальні умови:

- VS Code ≥ 1.100
- Node.js 18+ (для compilation extension)
- npm 9+ (для packaging)
- [Z.ai](http://z.ai/) API key (Coding Plan)
- OpenSSL 3+ (для TLS)

### API Key Management:

```bash
# Method 1: Environment variable
export ZAI_API_KEY="your_api_key_here"

# Method 2: VS Code secrets (для production)
code --user-data-dir /path/to/user/data
```

---

## 🎯 7. РЕЗУЛЬТАТ СИСТЕМИ

Після встановлення extension:

### 🔥 Ти отримаєш:

- GLM у штатному Chat Panel VS Code
- Вибір моделі (glm-5.1, glm-5, glm-4.7)
- AI code assistant без сторонніх extension’ів
- Cursor-like chat experience:
  - Streaming responses
  - Auto-apply diffs
  - CodeLens suggestions
  - Workspace context

### 📊 Як включити:

1. **Install extension:**
   ```bash
   npm install -g @vscode/vsce
   cd extensions/vscode-glm-provider
   vsce package
   code --install-extension vscode-glm-provider-1.0.0.vsix
   ```

2. **Set API key:**
   ```bash
   export ZAI_API_KEY="your_key"
   ```

3. **Restart VS Code**

4. **Open Chat Panel**: `Cmd+Shift+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

5. **Select model**: GLM-5.1 (zai-glm)

---

## 💡 8. ВИСНОВОК

### ✅ Це "Native LLM Layer", а не "Full Agent System"

**Якщо хочеш наступний рівень:**

Я можу зробити **"CURSOR WITHOUT CURSOR (FULL ARCHITECTURE)"**:

- native chat GLM
- lightweight agent runtime (без extension store)
- diff engine як у Cursor
- memory + repo indexing
- auto task planner

**Це буде майже 90% Cursor**, але повністю кастомний.

### 🚀 Чому потрібен extension?

VS Code не має API для:
- Додавання кастомного провайдера через settings.json
- Зміни native OpenAI provider base URL
- Реєстрації language model chat provider без extension

Тому єдиний чистий варіант — custom extension через LanguageModelChatProvider API.

---

## 🔗 9. РЕСУРСИ

- [VS Code Language Model Chat Provider API](https://code.visualstudio.com/api/language-features/language-model-chat)
- [Z.ai API Documentation](https://z.ai/docs)
- [vscode-lm GitHub](https://github.com/microsoft/vscode-lm)
- [Custom Chat Providers Guide](https://github.com/microsoft/vscode-recipes/tree/main/custom-chat-providers)

---

## 📋 10. ЧЕК-ЛИСТ ВСТАНОВЛЕННЯ

- [ ] VS Code ≥ 1.100
- [ ] Node.js 18+
- [ ] npm 9+
- [ ] Z.ai API key (Coding Plan)
- [ ] Клонування extension template
- [ ] Конфігурація extension (GLM provider)
- [ ] Compilation (`npm run compile`)
- [ ] Packaging (`vsce package`)
- [ ] Installation (`code --install-extension ...`)
- [ ] Налаштування settings.json
- [ ] Встановлення API key (environment variable)
- [ ] Перезавантаження VS Code
- [ ] Відкриття Chat Panel
- [ ] Вибір GLM-5.1 в model selector
- [ ] Перевірка streaming response
- [ ] Перевірка auto-apply diff
- [ ] Перевірка code context (active file)

---

**End of Document**
