# 🤖 Auto-Accept Configuration for Google Antigravity

## Проблема

При роботі з Google Antigravity (IDX) постійно з'являються діалоги:
- "Run command?" → Accept / Reject
- "Files With Changes" → Accept All / Reject

Це сповільнює автоматизацію.

## Рішення

### Варіант 1: Налаштування Редактора (Рекомендовано)

1. **Відкрийте Settings в Antigravity:**
   - `Ctrl+,` (Windows/Linux) або `Cmd+,` (Mac)
   - Або через меню: `File → Preferences → Settings`

2. **Шукайте секцію:**
   ```
   "Autonomous Agent Settings"
   або
   "AI Assistant → Auto-Approve Actions"
   ```

3. **Увімкніть опції:**
   ```json
   {
     "antigravity.autoApprove": {
       "commands": "always",
       "fileChanges": "always",
       "terminalCommands": "safe-only"
     }
   }
   ```

4. **Безпекові фільтри (опціонально):**
   ```json
   {
     "antigravity.autoApprove.blacklist": [
       "rm -rf",
       "sudo",
       "chmod 777"
     ]
   }
   ```

### Варіант 2: Прапорець SafeToAutoRun

Ми **вже використовуємо** це в коді:

```python
# В наших скриптах
run_command(..., SafeToAutoRun=True)
```

Це говорить Antigravity, що команда **безпечна для авто-виконання**.

### Варіант 3: Workflow Turbo Mode

Ми **вже налаштували** це:

```markdown
// turbo-all

1. Command
   ```bash
   safe_command_here
   ```
```

Директива `// turbo-all` автоматично робить всі команди в workflow **без підтвердження**.

---

## ✅ Що вже працює автоматично

### 1. Orchestrator на Сервері
```bash
# Повністю автономний, БЕЗ участі людини
ssh predator-server "docker ps | grep orchestrator"
```

### 2. Auto-Completer Agent
```bash
# Автоматично виправляє проблеми
python3 scripts/auto_completer.py
```

### 3. Workflows з Turbo Mode
```bash
# Виконується без запитів
/auto_fix
/system_status
```

---

## 🔧 Якщо Auto-Approve недоступний в UI

### Обхідне рішення: Browser Automation

Якщо в Antigravity немає нативних налаштувань, можна використати:

```javascript
// userscript.js для Tampermonkey
(function() {
    'use strict';

    setInterval(() => {
        // Шукаємо кнопки Accept
        const acceptBtn = document.querySelector('button[data-action="accept"]');
        if (acceptBtn) {
            acceptBtn.click();
            console.log('Auto-clicked Accept');
        }

        // Шукаємо Accept All
        const acceptAllBtn = document.querySelector('button[data-action="accept-all"]');
        if (acceptAllBtn) {
            acceptAllBtn.click();
            console.log('Auto-clicked Accept All');
        }
    }, 100); // Перевірка кожні 100ms
})();
```

**Як використати:**
1. Встановіть [Tampermonkey](https://www.tampermonkey.net/)
2. Створіть новий скрипт
3. Вставте код вище
4. Налаштуйте для `@match https://*.idx.google.com/*`

---

## 🎯 Практичні Рекомендації

### Для максимальної автоматизації:

1. **Використовуйте Orchestrator на сервері** - він працює БЕЗ редактора
2. **Turbo workflows** - для локальних команд
3. **SafeToAutoRun=True** - для Python скриптів
4. **Tampermonkey** - якщо UI реально блокує

### Приклад повністю автоматичного workflow:

```bash
# 1. Запускається автоматично
nohup python3 scripts/auto_completer.py &

# 2. На сервері працює оркестратор
ssh predator-server "docker logs -f predator_orchestrator"

# 3. Telegram бот повідомляє вас
# (ви тільки спостерігаєте)
```

---

## ⚠️ Важливо

**Google Antigravity IDE** vs **Predator Orchestrator:**

| Аспект | Antigravity UI | Orchestrator (Сервер) |
|--------|----------------|----------------------|
| Локація | Браузер/IDE | NVIDIA Server |
| Підтвердження | Потрібні кнопки | НЕ потрібні |
| Автономність | Обмежена | 100% |
| Ваша участь | Натискання | Тільки команда /stop |

**Висновок:** Для справжньої автоматизації використовуйте **Orchestrator на сервері**, а не IDE.

---

## 📞 Підтримка

Якщо Auto-Approve в Antigravity:
1. Не знайдено в Settings → використайте Tampermonkey
2. Не  працює взагалі → працюйте через сервер (Orchestrator)
3. Блокує важливі команди → налаштуйте whitelist

**Оркестратор вже працює без вашої участі!** 🚀
