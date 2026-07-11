# 🤖 PREDATOR AI Models — Максимум Конфігурація

**Статус:** ✅ НАЛАШТОВАНО  
**Дата:** January 2025  
**Z.ai ключ:** ✓  
**Gemini ключ:** ✓  
**GROQ ключ:** ⏳ Рекомендується додати

---

## 📊 Матриця Доступних Моделей

### 1️⃣ **Z.ai GLM** (Прайм модель)
| Модель | Контекст | Max Output | Вартість | Статус |
|--------|----------|-----------|----------|--------|
| **glm-5.1** | 128K | 4K | Платна | ✅ Активна |
| **glm-5** | 128K | 4K | Платна | ✅ Активна |
| **glm-4.7** | 128K | 4K | Платна | ✅ Активна |

**Використання:** Основна модель для Cursor, найбільш потужна  
**API:** https://api.z.ai/api/coding/paas/v4  
**Ключ:** `ZAI_API_KEY=bd39ed3a72b54632a98eb50515578272.F3D34MOPpAfbP7vg`

---

### 2️⃣ **Google Gemini** (Швидка, контекстна)
| Модель | Контекст | Max Output | RPM | Вартість |
|--------|----------|-----------|-----|----------|
| **gemini-2.0-flash** | 1M ⭐ | 8K | 60 | FREE |
| **gemini-2.0-thinking** | 100K | 16K | 40 | FREE |
| **gemini-1.5-pro** | 2M | 8K | 2 | FREE |

**Переваги:** Найбільший контекст (1M-2M),找速найшвидша  
**API:** https://generativelanguage.googleapis.com/v1beta/openai/  
**Ключ:** `GOOGLE_API_KEY=AIzaSyAcbMMgDoXKbvDzZCtzEfwdLxwa5QT6ZNU`

---

### 3️⃣ **GROQ** (ВІЛЬНІ моделі - NO LIMITS!)
| Модель | Контекст | Max Output | RPM | Вартість |
|--------|----------|-----------|-----|----------|
| **mixtral-8x7b** | 32K | 4K | ∞ | 🎉 FREE |
| **llama-3.1-70b** | 131K ⭐ | 4K | ∞ | 🎉 FREE |
| **claude-3.5-sonnet** | 200K ⭐ | 8K | ∞ | 🎉 FREE |

**Переваги:** БЕЗПЛАТНІ без лімітів! Окремо в GROQ    
**API:** https://api.groq.com/openai/v1  
**Ключ:** `GROQ_API_KEY=` ⏳ **ПОТРІБНО ДОДАТИ** (free signup на https://console.groq.com/)

---

### 4️⃣ **LiteLLM Gateway** (Балансування 15 Gemini ключів)
| Модель | Кількість ключів | Сумарний RPM | Статус |
|--------|------------------|-------------|--------|
| **gemini-flash** | 15 | 225 RPM ⚡ | ✅ На NVIDIA |
| **gemini-thinking** | 15 | 150 RPM | ✅ На NVIDIA |
| **gemini-pro** | 15 | 30 RPM | ✅ На NVIDIA |

**Використання:** Backend routing, масові запити  
**API:** http://194.177.1.240:4000/chat/completions  
**Статус:** Запущено на NVIDIA Server

---

### 5️⃣ **Ollama** (Локальні моделі - без інтернету)
| Модель | Контекст | Статус | Використання |
|--------|----------|--------|--------------|
| **glm-5.1** | 128K | ✅ На GPU | Offline fallback |
| **qwen2.5** | 64K | ✅ На GPU | Легка/дешева |
| **llama3.2** | 128K | ✅ На GPU | Універсальна |

**API:** http://194.177.1.240:11434  
**Статус:** Запущено на NVIDIA Server, потребує GPU

---

## 🎯 Рекомендації по Використанню

### Для Cursor (IDE Chat)
```
🥇 Глав. модель:    glm-5.1 (128K context, найпотужніша)
🥈 Альтернатива:    gemini-2.0-flash (1M context, швидкіша)
🥉 Fallback:        mixtral-8x7b GROQ (вільна)
```

### Для VS Code Extension
```
🔧 glm-5.1          для coding tasks
💭 gemini-thinking  для складних алгоритмів
⚡ glm-4.7         для швидких ітерацій
```

### Для Backend Services
```
⚙️  LiteLLM Gateway  (http://194.177.1.240:4000)
    → 225 RPM capacity via 15 Gemini keys
    → Auto-routing & load balancing
    → Redis caching enabled
```

### За Браком Ресурсів
```
🆓 GROQ FREE        (Mixtral, Llama, Claude - completely FREE)
📡 Ollama           (локально на GPU, без інтернету)
```

---

## ⚙️ Налаштування

### 1. Завантажити AI Models Environment

```bash
source ~/.zshrc
# або використовувати alias
load-ai-models
```

### 2. Перевірити Статус

```bash
echo "Z.ai: $ZAI_API_KEY"
echo "Gemini: $GOOGLE_API_KEY"
echo "GROQ: $GROQ_API_KEY"
```

### 3. Cursor Config

Файл: `~/.cursor/settings.json`

```json
{
  "customModels": [
    {
      "id": "glm-5.1",
      "name": "GLM-5.1 (Coding Plan) 🎯",
      "provider": "openai",
      "baseURL": "https://api.z.ai/api/coding/paas/v4",
      "model": "glm-5.1",
      "apiKey": "${env.ZAI_API_KEY}",
      "contextWindow": 128000
    },
    {
      "id": "gemini-2-flash",
      "name": "Gemini 2.0 Flash (1M ctx) 💎",
      "provider": "openai",
      "baseURL": "https://generativelanguage.googleapis.com/v1beta/openai/",
      "model": "gemini-2.0-flash",
      "apiKey": "${env.GOOGLE_API_KEY}",
      "contextWindow": 1000000
    }
  ],
  "defaultModel": "glm-5.1"
}
```

### 4. VS Code Extension

Файл: `extensions/vscode-glm-provider/package.json`

Розраховує 3 GLM моделі:
- `glm-5.1` → Z.ai
- `glm-5` → Z.ai
- `glm-4.7` → Z.ai (мап на `glm-4-plus` за кулісами)

---

## 🔐 API Ключі

| Сервіс | Статус | Ключ | Де отримати |
|--------|--------|-----|-------------|
| Z.ai | ✅ Встановлений | `bd39ed3a...` | z.ai account |
| Gemini | ✅ Встановлений | `AIzaSyAc...` | https://aistudio.google.com/app/apikey |
| GROQ | ⏳ ПОТРІБНО | - | https://console.groq.com/ |
| LiteLLM | ✅ На сервері | 15 ключів | NVIDIA Server |

### Додати GROQ API Key

```bash
# 1. Перейти на https://console.groq.com/
# 2. Sign up (FREE) → Create API Key
# 3. Скопіювати ключ і додати:

echo 'export GROQ_API_KEY="ваш-ключ-тут"' >> ~/.zshrc
source ~/.zshrc
```

---

## 🚀 Поточний Статус

### ✅ Налаштовано
- [x] Z.ai GLM models (glm-5.1, glm-5, glm-4.7)
- [x] Google Gemini (Flash, Thinking, Pro)
- [x] LiteLLM Gateway (15 Gemini ключів на NVIDIA)
- [x] Ollama локальні моделі
- [x] Cursor config з 8+ моделями
- [x] VS Code extension з GLM

### ⏳ Рекомендується Додати
- [ ] GROQ API Key (безплатні Mixtral, Llama, Claude)
- [ ] Redis кеш для LiteLLM (оптимізація)
- [ ] Circuit breaker для fallback (на backend)

### 📊 Потужність

| Сценарій | Рекомендована модель | Причина |
|----------|-------------------|---------|
| Складні алгоритми | GLM-5.1 | Найпотужніша |
| Великі контексти (200K+) | Gemini Pro (2M) або Llama 3.1 (131K) | Максимум контексту |
| Швидкість | Gemini 2.0 Flash | Найшвидша |
| БЕЗПЛАТНО | GROQ (Mixtral/Llama) | 0 вартості |
| Offline | Ollama GLM-5.1 | Без інтернету |

---

## 🔗 Файли Конфігурації

- **Environment:** `/Users/Shared/Predator_60/.env.ai-models`
- **Cursor:** `~/.cursor/settings.json`
- **VS Code Extension:** `/Users/Shared/Predator_60/extensions/vscode-glm-provider/`
- **Setup Script:** `/Users/Shared/Predator_60/setup-ai-models-max.sh`
- **LiteLLM Config:** `/Users/Shared/Predator_60/services/api_gateway/configs/litellm_god_mode.yaml`

---

## 📝 Наступні Кроки

### Priority 1 (ВЖЕ ЗРОБЛЕНО)
- ✅ Встановлення Z.ai + Gemini
- ✅ Налаштування Cursor з 8+ моделями
- ✅ LiteLLM gateway на NVIDIA

### Priority 2 (РЕКОМЕНДУЄТЬСЯ)
- ⏳ Додати GROQ API Key (5 хвилин, безплатно)
- ⏳ Протестувати GROQ моделі
- ⏳ Перезавантажити Cursor

### Priority 3 (ADVANCED)
- ⏳ Налаштувати circuit breaker backend
- ⏳ Redis кеш для LiteLLM
- ⏳ Monitoring & logging

---

## 💡 Поради

1. **Для максимальної швидкості:** Використовуйте Gemini 2.0 Flash (1M context, найшвидша)
2. **Для складних задач:** GLM-5.1 (128K context, найпотужніша)
3. **Для вільних запитів:** GROQ Mixtral/Llama (БЕЗПЛАТНІ!)
4. **Для offline роботи:** Ollama GLM-5.1 на GPU
5. **Для масових запитів:** LiteLLM Gateway (225 RPM Gemini)

---

## ❓ FAQ

**Q: Чи за Z.ai стягується плата?**  
A: Так, за запити через Z.ai API. Але у вас є Gemini та GROQ як альтернативи.

**Q: Чи можу залишити GROQ без налаштування?**  
A: Так, але ви втратите доступ до безплатних Mixtral/Llama/Claude. Рекомендується додати за 5 хвилин.

**Q: Який Ollama потребує GPU?**  
A: Ollama запущено на NVIDIA Server, тому локально ви можете використовувати LiteLLM Gateway або віддалено до Ollama.

**Q: Як переключатися між моделями?**  
A: У Cursor: Cmd+K → dropdown моделі. У VS Code Extension: через chat provider selection.

---

**Документація:** /Users/Shared/Predator_60/README_CURSOR_GLM.md  
**Останнє оновлення:** Jan 2025
