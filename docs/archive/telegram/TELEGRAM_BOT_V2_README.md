# Predator Telegram Bot V2.0 - OMNISCIENT+

## 🚀 Нові Функції

### 1. ⚡ Power Monitoring (Моніторинг електропостачання)
- **Автоматична детекція** перебоїв електропостачання
- **Історія** всіх вимкнень з точним часом
- **Статистика** uptime та downtime
- **Нотифікації** при включенні/вимкненні світла
- **Реєстр роботи** (з якої до якої години працював сервер)

### 2. 🎤 Voice Support (Голосові повідомлення)
- **Speech-to-Text** (STT) через Google Cloud
- **Text-to-Speech** (TTS) для озвучки відповідей
- **Природня мова** - розуміє команди українською та російською
- **Автоматична обробка** голосових команд

### 3. 📊 Enhanced Visualization
- **Красиві графіки** системних метрик (CPU, RAM, Disk, GPU)
- **Процес-діаграми** оркестрації
- **Real-time оновлення**

### 4. 🔄 Дублювання в канал
- Всі важливі події автоматично дублюються в Telegram канал
- Approval запити видимі в каналі
- Git операції та системні зміни логуються

---

## ⚙️ Налаштування

### 1. Змінні оточення

Додайте в `.env`:

```bash
# Telegram Bot (обов'язково)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_ID=123456789  # Ваш Telegram User ID

# Telegram Channel (опціонально, для дублювання нотифікацій)
TELEGRAM_CHANNEL_ID=@your_channel  # або -100123456789

# Redis (для Power Monitor та черги задач)
REDIS_URL=redis://redis:6379/1

# Google Cloud Credentials (для Voice - опціонально)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-credentials.json
```

### 2. Отримання Telegram Bot Token

1. Знайдіть @BotFather в Telegram
2. Напишіть `/newbot`
3. Дайте ім'я боту і отримайте токен
4. Додайте токен в `.env`

### 3. Отримання ADMIN_ID

1. Напишіть @userinfobot
2. Скопіюйте ваш ID
3. Додайте в `.env`

### 4. Налаштування Telegram Channel (опціонально)

```bash
# Створіть публічний канал
# Додайте бота як адміністратора
# Використайте @username каналу або chat_id
TELEGRAM_CHANNEL_ID=@predator_notifications
```

### 5. Google Cloud Voice (опціонально)

Для підтримки голосових повідомлень:

```bash
# 1. Створіть проект в Google Cloud Console
# 2. Увімкніть Cloud Speech-to-Text API та Text-to-Speech API
# 3. Створіть Service Account і завантажте JSON ключ
# 4. Додайте шлях до ключа:
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-cloud-key.json

# 5. Встановіть залежності:
pip install google-cloud-speech google-cloud-texttospeech
```

---

## 🎯 Використання

### Основні команди

```
/start - Головне меню
/dashboard - Системна панель з графіками
/processes - Моніторинг процесів та оркестрації
/control - Панель управління (restart контейнерів, clear cache, тощо)
/ai - Управління AI моделями
/auto - Automation Hub (запуск агентів)
/logs - Live логи системи
/git - Git операції
/health - Health check
/power - Моніторинг електропостачання
/speak <текст> - Озвучити текст (TTS)
```

### Голосові команди

Просто надішліть **голосове повідомлення** українською або російською:

- "Покажи статус системи" → Dashboard
- "Покажи логи" → Logs
- "Створи задачу: покращити UI" → Створить задачу
- "Допомога" → /start

### Power Monitoring

Команда `/power` показує:

- 📊 **Statistics** - Загальна статистика uptime/downtime
- 📋 **Outages History** - Історія перебоїв електропостачання
- 🔄 **Current Uptime** - Поточний uptime
- ⚙️ **Settings** - Налаштування моніторингу

**Автоматичні нотифікації:**

- 🔴 При вимкненні електрики (після повторного запуску)
- 🟢 При відновленні (з точним часом простою)
- 💚 Uptime reports кожні 30 хвилин (опціонально)

---

## 📦 Deployment

### Docker Compose

```yaml
services:
  telegram_bot:
    build: ./backend/orchestrator
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_ADMIN_ID=${TELEGRAM_ADMIN_ID}
      - TELEGRAM_CHANNEL_ID=${TELEGRAM_CHANNEL_ID}
      - REDIS_URL=redis://redis:6379/1
      - GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-credentials.json
    volumes:
      - ./config:/app/config
      - ./data:/app/data
    depends_on:
      - redis
    restart: unless-stopped
    command: python -m orchestrator.agents.telegram_bot_v2
```

### Standalone запуск

```bash
# Встановіть залежності
pip install -r backend/orchestrator/requirements.txt

# Додаткові для voice
pip install google-cloud-speech google-cloud-texttospeech

# Додаткові для графіків
pip install matplotlib numpy

# Запуск
python backend/orchestrator/agents/telegram_bot_v2.py
```

---

## 📊 Features Matrix

| Feature | Status | Description |
|---------|--------|-------------|
| 📊 Dashboard | ✅ | Системні метрики з графіками |
| ⚙️ Processes | ✅ | Моніторинг оркестрації |
| ⚡ Control Panel | ✅ | Управління Docker контейнерами |
| 🧠 AI Models | ✅ | Перемикання між моделями |
| 🤖 Automation | ✅ | Запуск автономних агентів |
| 📜 Logs | ✅ | Live логи з контейнерів |
| 📦 Git Operations | ✅ | Status, Pull, Push, Commit |
| 💊 Health Check | ✅ | Перевірка всіх сервісів |
| ⚡ Power Monitor | ✅ | Моніторинг електропостачання |
| 🎤 Voice STT | ✅ | Розпізнавання голосу |
| 🔊 Voice TTS | ✅ | Озвучка текстів |
| 📢 Channel Notifications | ✅ | Дублювання в канал |
| 🛡️ Approval System | ✅ | Підтвердження дій |
| 📝 Task Queue | ✅ | Створення задач через бота |

---

## 🔧 Troubleshooting

### Power Monitor не працює

```bash
# Перевірте Redis
docker exec -it predator_redis redis-cli ping
# Має повернути PONG

# Перевірте логи
docker logs predator_orchestrator | grep "Power Monitor"
```

### Voice не розпізнає

```bash
# Перевірте Google credentials
echo $GOOGLE_APPLICATION_CREDENTIALS
cat $GOOGLE_APPLICATION_CREDENTIALS

# Перевірте API enabled
gcloud services list --enabled | grep speech
```

### Бот не відповідає

```bash
# Перевірте токен
echo $TELEGRAM_BOT_TOKEN

# Перевірте логи
docker logs predator_telegram_bot

# Перевірте firewall (якщо self-hosted)
sudo ufw status
```

---

## 📈 Statistics Example

Power Monitor збирає статистику:

```
📊 Power Statistics

🟢 Current Uptime: 3d 14h 23m 45s
📅 Started: 2025-12-10 04:30:12

📉 Total Outages: 3
⏱️ Total Downtime: 2h 15m 30s
📊 Avg Outage: 45m 10s
```

Історія перебоїв:

```
📋 Power Outages History:

1. outage_1702123456
   🔴 Off: 2025-12-09 23:45:12
   🟢 On: 2025-12-10 01:15:30
   ⏱️ Duration: 1h 30m 18s

2. outage_1702034567
   🔴 Off: 2025-12-08 14:20:00
   🟢 On: 2025-12-08 14:35:12
   ⏱️ Duration: 15m 12s
```

---

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Power Monitor
![Power Monitor](docs/screenshots/power_monitor.png)

### Voice Command
![Voice](docs/screenshots/voice_command.png)

---

## 🤝 Contributing

Contributions welcome! Додавайте нові фічі через Pull Requests.

---

## 📄 License

MIT License - see LICENSE file

---

## 🆘 Support

- Telegram: @your_support_channel
- Issues: GitHub Issues
- Docs: [Full Documentation](https://docs.predator-analytics.com)

---

**Made with ❤️ by Predator Analytics Team**
