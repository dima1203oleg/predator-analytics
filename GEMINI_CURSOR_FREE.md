# 🚀 Gemini 2.0 Flash в Cursor — БЕЗПЛАТНО

## ⚡ ТРИ КРОКИ ДО ГОТІВКИ:

### Крок 1: Отримайте Google API Key (БЕЗПЛАТНО)

1. Йдіть на: https://aistudio.google.com/app/apikeys
2. Натисніть **"Create API Key in new project"**
3. Дайте дозвіл (Google запропонує)
4. **Скопіюйте ключ** 🔑

*(Безплатний, без кредитної картки)*

---

### Крок 2: Додайте Key в shell profile

Відредагуйте `~/.zshrc`:
```bash
nano ~/.zshrc
```

Додайте в кінець:
```bash
export GOOGLE_API_KEY="ваш-ключ-тут"
```

Збережіть: `Ctrl+X` → `Y` → `Enter`

---

### Крок 3: Перезапустіть Cursor

```bash
# Перезавантажте shell
source ~/.zshrc

# Перезапустіть Cursor
killall -9 Cursor && open -a Cursor /Users/Shared/Predator_60
```

---

## ✨ Готово!

1. Натисніть **`Cmd+K`** в Cursor
2. Виберіть **Gemini 2.0 Flash** зверху
3. Запитайте українською!

---

## 🎯 Що ви отримуєте:

| Модель | Контекст | Швидкість | Якість | Ціна |
|--------|----------|-----------|--------|------|
| **Gemini 2.0 Flash** | **1M токенів** | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | **FREE** 🎉 |

---

## 📝 Примітка:

Цей API **ПОВНІСТЮ БЕЗПЛАТНИЙ** для:
- ✅ Розробки
- ✅ Тестування
- ✅ Особистого використання

Без лімітів запитів для розробників!

---

## ❓ Проблеми?

### Models не з'являються в Cursor
```bash
# 1. Перевірте key
echo $GOOGLE_API_KEY

# 2. Перезапустіть Cursor повністю
killall -9 Cursor

# 3. Очистіть кеш
rm -rf ~/Library/Caches/Cursor

# 4. Запустіть Cursor
open -a Cursor
```

### API Error 401
- API key неправильний
- Перейдіть на https://aistudio.google.com/app/apikeys
- Створіть новий ключ
- Оновіть в ~/.zshrc
- Перезапустіть Cursor

### Gemini недоступний
- Google сервер может быть перегруженим
- Спробуйте через 5 хвилин
- Або виберіть Claude 3.5 Sonnet (GROQ backup)

---

**🚀 КОДУЙТЕ БЕЗПЛАТНО!**
