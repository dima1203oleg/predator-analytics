# 🚨 Telegram Bot не відповідає - ДІАГНОСТИКА

## Проблема:
Ти пишеш боту в Telegram але він не відповідає.

---

## ✅ ПОКРОКОВЕ РІШЕННЯ:

### Крок 1: Перевір чи бот запущений

**Спосіб A: Простий тест (API перевірка)**
```bash
cd /Users/dima-mac/Documents/Predator_21

# Встанови токен
export TELEGRAM_BOT_TOKEN='твій_токен_тут'
export TELEGRAM_ADMIN_ID='твій_id_тут'

# Запусти тест
python3 scripts/test_telegram_bot.py
```

Якщо побачиш `✅ З'єднання OK!` - токен правильний.

---

### Крок 2: Запусти простий тестовий бот

```bash
# З тими ж змінними (TOKEN та ADMIN_ID)
python3 scripts/simple_test_bot.py
```

Якщо побачиш:
```
🚀 БОТ ЗАПУЩЕНИЙ!
📱 Іди в Telegram і напиши боту: /start
```

То **ІДИ В TELEGRAM** і напиши `/start`

Має прийти відповідь: `✅ БОТ ПРАЦЮЄ!`

---

### Крок 3: Якщо простий бот працює

Значить проблема в основному боті (telegram_bot_v2.py).

**Запусти основний бот:**
```bash
cd /Users/dima-mac/Documents/Predator_21

export TELEGRAM_BOT_TOKEN='твій_токен'
export TELEGRAM_ADMIN_ID='твій_id'
export REDIS_URL='redis://localhost:6379/1'

python3 backend/orchestrator/agents/telegram_bot_v2.py
```

Дивись на вивід - має бути:
```
✅ Bot is ONLINE!
```

---

## 🔍 ДІАГНОСТИКА ПРОБЛЕМ:

### Проблема 1: "Invalid token"
```
❌ Токен неправильний

РІШЕННЯ:
1. Telegram → @BotFather
2. /token → вибери свого бота
3. Скопіюй НОВИЙ токен
4. export TELEGRAM_BOT_TOKEN='новий_токен'
```

### Проблема 2: Бот получває команди але не відповідає
```
Лог показує: "📩 Отримано /start від 123456789"
Але відповіді немає

РІШЕННЯ:
Перевір ADMIN_ID:
export TELEGRAM_ADMIN_ID='123456789'  # ТВІЙ реальний ID!

Як дізнатись свій ID:
Telegram → @userinfobot → напиши щось → скопіюй ID
```

### Проблема 3: Бот не запускається
```
❌ ModuleNotFoundError: aiogram

РІШЕННЯ:
pip3 install aiogram aiohttp redis psutil matplotlib numpy
```

### Проблема 4: "Connection refused (Redis)"
```
Помилка з Redis

РІШЕННЯ A (запусти Redis):
docker run -d -p 6379:6379 redis:alpine

РІШЕННЯ B (без Redis):
# Закоментуй Power Monitor в боті
# Або встанови REDIS_URL=""
```

---

## 📊 ЧЕКЛИСТ НАЛАШТУВАННЯ:

Перевір що ВСІ ці речі правильні:

1. ✅ **Токен отриманий від @BotFather**
   ```bash
   echo $TELEGRAM_BOT_TOKEN
   # Має бути: 123456789:AAH...
   ```

2. ✅ **Твій ID правильний**
   ```bash
   echo $TELEGRAM_ADMIN_ID
   # Має бути твій ID від @userinfobot
   ```

3. ✅ **aiogram встановлено**
   ```bash
   python3 -c "import aiogram; print('OK')"
   # Має бути: OK
   ```

4. ✅ **Бот запущений**
   ```bash
   ps aux | grep telegram_bot
   # Має показати процес
   ```

5. ✅ **Ти пишеш ПРАВИЛЬНОМУ боту**
   - Перевір username бота в Telegram
   - Має співпадати з тим що створив у @BotFather

---

## 🎯 ШВИДКИЙ ТЕСТ (все в одному):

```bash
cd /Users/dima-mac/Documents/Predator_21

# 1. Встанови токен та ID (ЗАМІНИ на свої!)
export TELEGRAM_BOT_TOKEN='6123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'
export TELEGRAM_ADMIN_ID='123456789'

# 2. Тест API
python3 scripts/test_telegram_bot.py

# 3. Якщо OK - запусти простий бот
python3 scripts/simple_test_bot.py

# 4. Іди в Telegram → @твій_бот → /start
# Має прийти: "✅ БОТ ПРАЦЮЄ!"

# 5. Якщо працює - зупини (Ctrl+C) і запусти основний:
python3 backend/orchestrator/agents/telegram_bot_v2.py
```

---

## 💡 ТИПВІ ПОМИЛКИ:

### ❌ Неправильний username
```
Ти пишеш: @predator_bot
Але створив: @predator_analytics_bot

РІШЕННЯ: Перевір @BotFather → /mybots → подивись правильний username
```

### ❌ ID не співпадає
```
export TELEGRAM_ADMIN_ID='111111'
Твій реальний ID: 222222

РІШЕННЯ: Telegram → @userinfobot → скопіюй ПРАВИЛЬНИЙ ID
```

### ❌ Бот в групі не відповідає
```
Додав бота в групу, він не відповідає

РІШЕННЯ:
1. @BotFather → /mybots → вибери бота → Bot Settings → Group Privacy → DISABLE
2. Або пиши боту в ОСОБИСТІ повідомлення
```

---

## 🆘 ЯКЩО НІЧОГО НЕ ДОПОМАГАЄ:

1. Створи **НОВОГО** бота:
   ```
   @BotFather → /newbot → нова назва
   ```

2. Візьми НОВИЙ токен

3. Запусти простий тестовий бот:
   ```bash
   export TELEGRAM_BOT_TOKEN='новий_токен'
   export TELEGRAM_ADMIN_ID='твій_id'
   python3 scripts/simple_test_bot.py
   ```

4. Якщо працює - проблема в коді основного бота
5. Якщо не працює - проблема в налаштуваннях Telegram

---

**Напиши який саме крок не працює - допоможу розібратись!** 🚀
