# 🧪 Інструкція перевірки Multi-LLM Extension в VS Code

## ✅ Що вже зроблено

1. ✅ Extension встановлено: `predator-analytics.vscode-multi-llm-provider`
2. ✅ Gemini API працює (протестовано через curl та Python)
3. ✅ GEMINI_API_KEY додано в VS Code settings.json
4. ✅ Extension скомпільовано та перевстановлено

## 🔍 Як перевірити чи працює extension

### Крок 1: Перезапустіть VS Code

**Обов'язково повністю закрийте VS Code** (Cmd+Q) і відкрийте знову.

### Крок 2: Відкрийте Chat Panel

Натисніть `Cmd+Shift+I` (Mac) або `Ctrl+Shift+I` (Windows/Linux)

### Крок 3: Перевірте dropdown моделей

У верхній частині Chat Panel має бути dropdown з моделями. Має бути **7 моделей**:

**GLM Models (Z.ai):**
- GLM-5.1 (Coding Plan)
- GLM-5
- GLM-4.7

**Gemini Models (Google AI Studio):**
- Gemini 2.5 Flash
- Gemini 2.5 Pro
- Gemini 1.5 Flash
- Gemini 1.5 Pro

### Крок 4: Протестуйте Gemini

1. Виберіть **Gemini 2.5 Flash** з dropdown
2. Напишіть: "Привіт! Напиши короткий привіт українською."
3. Натисніть Enter

Якщо працює — отримаєте відповідь українською.

## 🐛 Якщо не працює

### Перевірка 1: Логи Extension

1. Відкрийте **Developer Tools**: `Help > Toggle Developer Tools`
2. Перейдіть на вкладку **Console**
3. Шукайте логи з префіксом `[Multi-LLM Provider]`

Очікувані логи:
```
[Multi-LLM Provider] Activating...
[Multi-LLM Provider] VS Code version: 1.125.1
[Multi-LLM Provider] Registering Multi-LLM provider (GLM + Gemini)...
[Multi-LLM Provider] Multi-LLM Provider registered successfully with ID: multi-llm
[Multi-LLM Provider] Ready
```

### Перевірка 2: Extension встановлено

Відкрийте термінал і виконайте:
```bash
code --list-extensions | grep multi
```

Має показати:
```
predator-analytics.vscode-multi-llm-provider
```

### Перевірка 3: API Key в settings.json

Відкрийте файл:
```bash
cat ~/Library/Application\ Support/Code/User/settings.json | grep gemini
```

Має показати:
```json
"gemini.apiKey": "AQ.Ab8RN6LjLcAHpcUY2mYkjRXO461k2wU9i95FPSt89eL9I3dqQA"
```

### Перевірка 4: VS Code версія

VS Code має бути **1.125.0 або вище** для підтримки LM Chat API.

Перевірте:
```bash
code --version
```

## 📋 Швидкий тест через термінал

Якщо extension не працює в VS Code, протестуйте API напряму:

```bash
python3 test_gemini_extension.py
```

Цей скрипт знаходиться в `/Users/Shared/Predator_60/test_gemini_extension.py`

## 🔧 Якщо все ще не працює

1. **Повністю видаліть extension**:
```bash
code --uninstall-extension predator-analytics.vscode-multi-llm-provider
```

2. **Перезапустіть VS Code**

3. **Перевстановіть extension**:
```bash
cd /Users/Shared/Predator_60/extensions/vscode-glm-provider
npx vsce package --allow-missing-repository
code --install-extension vscode-multi-llm-provider-2.0.0.vsix --force
```

4. **Перезапустіть VS Code знову**

## 📞 Діагностика

Якщо після всіх кроків extension не працює, надішліть:

1. Логи з Developer Tools (Console)
2. Версію VS Code (`code --version`)
3. Результат `code --list-extensions | grep multi`
4. Скріншот Chat Panel з dropdown моделей
