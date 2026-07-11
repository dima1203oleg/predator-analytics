# 🚀 Cursor + GLM-5.1 Integration Guide

## 1. Environment Setup

Переконайтесь, що у вас встановлена **API Key**:

```bash
export ZAI_API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"
```

Додайте в `~/.zshrc` або `~/.bash_profile` для постійного збереження:

```bash
# ~/.zshrc
export ZAI_API_KEY="bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg"
```

## 2. Cursor Settings Configuration

### Варіант A: Через Cursor UI (Рекомендовано)

1. **Відкрийте Cursor**
2. **Натисніть `Cmd+,` (або `Ctrl+,` на Linux/Windows)**
3. **Шукайте: "API Key" або "OpenAI"**
4. Перейдіть до **Settings → Extensions → API**

### Варіант B: Ручне редагування (Якщо UI не пропонує)

Редагуйте файл:
```
~/.cursor/settings.json
```

Або для macOS:
```
~/Library/Application Support/Cursor/User/settings.json
```

Додайте секцію:
```json
{
  "customModels": [
    {
      "name": "GLM-5.1 (Coding Plan)",
      "id": "glm-5.1",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "key": "${env.ZAI_API_KEY}"
    }
  ],
  "defaultModel": "glm-5.1"
}
```

## 3. Curl Test (Перевірка перед використанням)

```bash
curl -X POST https://api.z.ai/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.1",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

Очікуваний результат:
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

## 4. Cursor AI Chat Panel

### Використання:
1. **`Cmd+K`** — Відкрити AI Chat
2. **Обрати модель** у верхньому селекторі:
   - ✅ `GLM-5.1 (Coding Plan)` — для складного планування
   - ✅ `GLM-5` — для стандартних задач
   - ✅ `GLM-4.7` — для швидких відповідей
3. **Написати запит** українською
4. **Отримати відповідь** від GLM

### Приклад промпту:
```
Аналізуй структуру PREDATOR backend:
1. Які основні мікросервіси?
2. Як влаштована базова архітектура?
3. Що таке Zero-Terminal Design?
```

## 5. VS Code Chat (Альтернатива)

Якщо у вас встановлено **VS Code** разом з Cursor, у VS Code також можна використовувати GLM моделі:

1. **Встановіть розширення**: (воно вже встановлено)
   ```bash
   code --install-extension /Users/Shared/Predator_60/extensions/vscode-glm-provider/vscode-glm-provider-1.0.0.vsix
   ```

2. **VS Code: Cmd+Shift+P → "AI: New Chat"**
3. **Обрати:** GLM-5.1, GLM-5 або GLM-4.7

## 6. Troubleshooting

### "Models not visible in selector"
- Перезавантажте Cursor: `Cmd+Q` + повторне відкриття
- Переконайтесь: `echo $ZAI_API_KEY` виводить ключ
- Перевірте curl тест (п. 3)

### "401 Unauthorized"
- API Key неправильний або закінчився
- Перевірте: `echo $ZAI_API_KEY`
- Оновіть ключ у Cursor Settings

### "Connection refused"
- Z.ai сервер недоступний
- Перевірте: `curl -I https://api.z.ai`
- Очекуйте, поки сервер буде онлайн

## 7. Models Reference

| Модель | Input | Output | Затримка | Краще для |
|--------|-------|--------|----------|-----------|
| **GLM-5.1** | 128K | 4K | 2-5 сек | Складна аналітика, планування, архітектура |
| **GLM-5** | 128K | 4K | 1-3 сек | Стандартні таски, документація |
| **GLM-4.7** | 128K | 4K | <1 сек | Швидкі відповіді, баги, поточні питання |

## 8. Integration with .cursorrules

Cursor також читає `.cursorrules` файл в корені проекту. Ми вже оновили його для підтримки GLM моделей:

```bash
cat /Users/Shared/Predator_60/.cursorrules | grep -A 30 "GLM-5.1"
```

Це гарантує, що Cursor завжди знає про доступні GLM моделі та їх призначення.

---

**Status**: ✅ Ready to use GLM-5.1, GLM-5, GLM-4.7 in Cursor
**Last updated**: 2026-06-20
