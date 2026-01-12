# 🚨 Telegram Bot - Швидкий старт

## Проблема: Бот не відповідає

### ✅ РІШЕННЯ (3 кроки):

#### 1️⃣ Отримай токен бота

**Telegram → @BotFather:**
```
1. Напиши: /newbot
2. Дай ім'я боту: Predator Analytics Bot
3. Дай username: predator_analytics_bot (або інший)
4. Скопіюй токен (виглядає як: 6123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw)
```

#### 2️⃣ Отримай свій Telegram ID

**Telegram → @userinfobot:**
```
1. Напиши будь-що
2. Скопіюй свій ID (число, наприклад: 123456789)
```

#### 3️⃣ Запусти бота

**Варіант A: Швидкий (з terminal):**
```bash
# Встанови змінні
export TELEGRAM_BOT_TOKEN='6123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw'
export TELEGRAM_ADMIN_ID='123456789'

# Запусти
./scripts/start_telegram_bot.sh
```

**Варіант B: Через .env файл:**
```bash
# Створи .env
cat > .env << 'EOF'
TELEGRAM_BOT_TOKEN=6123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_ADMIN_ID=123456789
REDIS_URL=redis://localhost:6379/1
EOF

# Запусти
source .env
./scripts/start_telegram_bot.sh
```

**Варіант C: Прямий запуск:**
```bash
cd /Users/dima-mac/Documents/Predator_21

TELEGRAM_BOT_TOKEN='твій_токен' \
TELEGRAM_ADMIN_ID='твій_id' \
python3 backend/orchestrator/agents/telegram_bot_v2.py
```

---

## 🔍 Перевірка

Якщо бот запустився успішно, побачиш:
```
🚀 STARTING PREDATOR V2.0 [OMNISCIENT+]...
✅ Bot is ONLINE!
```

Потім в Telegram:
```
1. Знайди свого бота (@твій_username_bot)
2. Напиши: /start
3. Має прийти відповідь з меню
```

---

## ⚠️ Troubleshooting

### Проблема: "Token is invalid"
```bash
# Перевір токен
echo $TELEGRAM_BOT_TOKEN
# Має бути формату: 123456789:AAH...

# Отримай новий токен від @BotFather:
# /token → вибери бота → скопіюй новий токен
```

### Проблема: "Module 'aiogram' not found"
```bash
pip3 install aiogram aiohttp redis psutil
```

### Проблема: "Connection refused (Redis)"
```bash
# Запусти Redis
docker run -d -p 6379:6379 redis:alpine

# Або використай без Redis (fallback mode)
# Бот працюватиме, але без Power Monitor
```

### Проблема: Бот запустився але не відповідає
```bash
# 1. Перевір що бот запущений
ps aux | grep telegram_bot

# 2. Перевір логи
tail -f backend/orchestrator/system.log

# 3. Перевір ADMIN_ID
echo $TELEGRAM_ADMIN_ID
# Має співпадати з твоїм Telegram ID від @userinfobot
```

---

## 📱 Швидкий тест

```bash
# Terminal 1: Запусти бота
export TELEGRAM_BOT_TOKEN='твій_токен'
export TELEGRAM_ADMIN_ID='твій_id'
./scripts/start_telegram_bot.sh

# Terminal 2: Перевір статус
ps aux | grep telegram_bot_v2

# Telegram: Надішли /start
```

---

## 🎯 Після запуску

Команди що працюють:
- `/start` - Головне меню
- `/dashboard` - Системні метрики
- `/processes` - Стан оркестрації
- `/control` - Панель управління
- `/health` - Health check

Кнопки:
- 📊 Dashboard
- ⚙️ Processes
- ⚡ Control
- 🧠 AI Models
- 🤖 Automation
- 📜 Logs

---

**Питання? Читай повну документацію: `QUICKSTART_TELEGRAM_BOT.md`**
