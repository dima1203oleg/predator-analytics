# 🤖 Predator Analytics v23.0 - Autonomous Orchestrator (GOD MODE)

## 🎯 Що це?

**Автономна система самовдосконалення**, що працює 24/7 на вашому NVIDIA сервері без участі людини.

### Ключові особливості:

- **♾️ Безперервний цикл покращення** - постійно аналізує, генерує код, тестує та деплоїть
- **🧠 LLM Council** - 3 AI моделі (Gemini, Groq, DeepSeek/Ollama) приймають рішення консенсусом
- **🖥️ UI Guardian** - автоматично тестує кожну кнопку та сторінку веб-інтерфейсу
- **🔍 Data Sentinel** - валідує цілісність даних в OpenSearch
- **📱 Telegram Control** - повне управління через бота природньою мовою
- **💰 100% Безкоштовні API** - використовує тільки free tier сервіси

---

## 🚀 Швидкий старт

### 1. Отримайте API ключі (безкоштовно)

```bash
# Gemini (Chairman)
https://aistudio.google.com/app/apikey

# Groq (Critic)
https://console.groq.com/keys

# Telegram Bot
@BotFather в Telegram - команда /newbot
```

### 2. Налаштуйте .env на сервері

```bash
ssh predator-server
cd ~/predator_v25
nano .env
```

Додайте:
```env
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_ADMIN_ID=your_user_id
```

### 3. Деплой

```bash
# З локального Mac
./scripts/deploy_orchestrator.sh
```

### 4. Перевірте роботу

```bash
ssh predator-server 'docker logs -f predator_orchestrator'
```

---

## 📱 Управління через Telegram

Відправте вашому боту:

- `/start` - Меню команд
- `/status` - Поточний стан системи
- `/stop` - Зупинити оркестратор
- `/stopui` - Зупинити UI Guardian
- `/resume` - Відновити роботу
- Або просто напишіть природньою мовою: "Перевір статус", "Зупини!"

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────┐
│         AUTONOMOUS ORCHESTRATOR             │
│  (Runs on NVIDIA Server - Docker Container) │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌───▼────┐
   │Chairman │ │ Critic  │ │Analyst │
   │(Gemini) │ │ (Groq)  │ │(DeepS.)│
   └────┬────┘ └────┬────┘ └───┬────┘
        └───────────┼───────────┘
                    │
              [CONSENSUS]
                    │
        ┌───────────┼───────────┐
        │           │           │
   ┌────▼────┐ ┌────▼────┐ ┌───▼─────┐
   │   UI    │ │  Data   │ │  Code   │
   │Guardian │ │Sentinel │ │Improver │
   └─────────┘ └─────────┘ └─────────┘
```

---

## ⚙️ Що робить система автоматично?

### Кожні 5 хвилин (налаштовується):

1. **Збирає метрики** - latency, errors, CPU, memory
2. **Аналізує** - Analyst перевіряє здоров'я системи
3. **Генерує завдання** - визначає що покращити
4. **Створює код** - Code Improver пише рішення
5. **Рада голосує** - Chairman, Critic, Analyst досягають консенсусу
6. **Виконує** - якщо схвалено, деплоїть зміни
7. **Повідомляє** - відправляє статус в Telegram

### Постійно (паралельно):

- **UI Guardian** - кожні 10 хвилин тестує веб-інтерфейс
- **Data Sentinel** - валідує дані кожні 15 хвилин
- **Telegram Bot** - чекає на ваші команди

---

## 🛑 Як зупинити?

```bash
# Через Telegram
/stop

# Через Redis
ssh predator-server
redis-cli SET orchestrator:stop_signal 1

# Через Docker
ssh predator-server
docker stop predator_orchestrator
```

---

## 📊 Моніторинг

```bash
# Логи
ssh predator-server 'docker logs -f predator_orchestrator'

# Статистика циклів
ssh predator-server 'docker exec predator_orchestrator cat /app/logs/orchestrator.log | grep "CYCLE"'

# Redis status
ssh predator-server
redis-cli GET orchestrator:stop_signal
```

---

## 🔧 Налаштування

Редагуйте `backend/orchestrator/config.py`:

```python
LOOP_INTERVAL_SECONDS = 300  # Частота циклів (5 хв)
MAX_ITERATIONS_PER_DAY = 288  # Безпечний ліміт
MIN_TEST_COVERAGE = 0.70  # Мінімальне покриття тестами
MIN_LIGHTHOUSE_SCORE = 0.85  # UI якість
```

---

## 🆘 Troubleshooting

### Orchestrator не стартує?

```bash
# Перевірте логи
docker logs predator_orchestrator

# Перевірте API ключі
docker exec predator_orchestrator env | grep API_KEY
```

### Telegram бот не відповідає?

```bash
# Перевірте токен
docker exec predator_orchestrator env | grep TELEGRAM

# Перестворіть бота через @BotFather
```

### UI Guardian failing?

```bash
# Перевірте чи доступний frontend
curl http://localhost:8082

# Вимкніть Guardian
redis-cli SET orchestrator:ui_stop 1
```

---

## 📚 Додаткові ресурси

- **LLM Council Pattern**: https://github.com/karpathy/llm-council
- **Gemini API**: https://ai.google.dev/
- **Groq API**: https://groq.com/
- **Playwright Docs**: https://playwright.dev/

---

## 🎉 Готово!

Система зараз працює автономно і покращує саму себе 24/7. Ви отримуватимете повідомлення в Telegram про всі зміни.

**З Богом! Поїхали! 🚀**
