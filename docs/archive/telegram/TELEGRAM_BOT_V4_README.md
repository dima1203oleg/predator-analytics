# 🚀 Telegram Bot V4.0 - Advanced Control Panel

## Огляд

**Predator Analytics Telegram Bot V4.0** - це повноцінний пульт управління з природною мовою, багаторівневою системою меню та інтеграцією з AI моделями.

## ✨ Основні можливості

### 🧠 AI Integration
- **Природна мова**: Спілкуйтесь з ботом українською або англійською
- **Контекстна пам'ять**: Бот запам'ятовує історію розмов (до 50 повідомлень)
- **Підтримка моделей**: Gemini Pro, Mixtral 8x7B (Groq)
- **AI функції**:
  - 💬 Природний чат
  - 🧠 Глибокий аналіз
  - 🎯 Планування задач
  - 🔍 Ревью коду
  - 📝 Генерація документації
  - 🐛 Асистент дебагінгу

### 📊 Dashboard
- Статус системи в реальному часі
- Моніторинг ресурсів (CPU, RAM, Disk)
- Список процесів
- Метрики продуктивності
- Health check

### ⚙️ System Control
- **Управління сервісами**: Запуск/зупинка/перезапуск
- **Docker**: Контроль контейнерів
- **Kubernetes**: Управління кластером
- **Process Manager**: Моніторинг процесів
- **Network**: Мережеві налаштування
- **Backup/Restore**: Резервне копіювання

### 📈 Analytics
- Статистика в реальному часі
- Тренди та прогнози
- KPI метрики
- Детальні звіти
- Конструктор запитів
- Експорт даних
- Заплановані звіти

### 🔧 Configuration
- Системні параметри
- AI налаштування
- База даних
- Безпека
- API ключі
- Сповіщення
- UI налаштування
- Продуктивність

### 🚀 Automation
- **Агенти**: Управління автономними агентами
- **Scheduler**: Планувальник задач
- **Workflows**: Робочі процеси
- **Triggers**: Тригери подій
- **Scripts**: Виконання скриптів
- **Integrations**: Інтеграції з іншими системами

### 📦 Data Management
- Імпорт/Експорт даних
- ETL пайплайни
- Менеджер баз даних
- Очищення даних
- Контроль якості
- Data Explorer
- Безпека даних

### 🔐 Security
- Контроль доступу
- Управління API ключами
- Firewall налаштування
- Аудит безпеки
- Алерти
- Логи безпеки
- Шифрування
- Управління користувачами

### 🌐 Network & API
- Статус мережі
- Моніторинг з'єднань
- API Gateway
- Webhooks
- Load Balancer
- DNS налаштування
- Моніторинг трафіку
- SSL/TLS сертифікати

### 📝 Logs & Reports
- Системні логи
- Логи помилок
- Логи доступу
- Пошук в логах
- Звіти продуктивності
- Аналітичні звіти
- Заплановані звіти
- Експорт логів

### 🎯 Tasks & Jobs
- Активні задачі
- Завершені задачі
- Заплановані роботи
- Повторювані роботи
- Створення задач
- Пауза/Відновлення
- Статистика задач
- Очищення завершених

## 🛠️ Встановлення

### Крок 1: Клонування репозиторію
```bash
cd /Users/dima-mac/Documents/Predator_21
```

### Крок 2: Налаштування .env
Створіть або відредагуйте файл `.env`:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_ID=your_telegram_id

# Redis Configuration
REDIS_URL=redis://localhost:6379/1

# AI API Keys (optional)
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# System Configuration
LOG_LEVEL=INFO
```

### Крок 3: Отримання Telegram Bot Token

1. Відкрийте [@BotFather](https://t.me/BotFather) в Telegram
2. Відправте `/newbot`
3. Введіть ім'я бота
4. Введіть username бота (має закінчуватись на `bot`)
5. Скопіюйте токен та додайте в `.env`

### Крок 4: Отримання вашого Telegram ID

1. Відкрийте [@userinfobot](https://t.me/userinfobot)
2. Відправте `/start`
3. Скопіюйте ваш ID та додайте в `.env`

### Крок 5: Отримання AI API Keys (опціонально)

#### Gemini API Key:
1. Перейдіть на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Створіть новий API ключ
3. Додайте в `.env`

#### Groq API Key:
1. Перейдіть на [Groq Console](https://console.groq.com)
2. Зареєструйтесь та створіть API ключ
3. Додайте в `.env`

### Крок 6: Встановлення Redis

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Перевірка
redis-cli ping
# Має повернути: PONG
```

### Крок 7: Запуск бота

```bash
# Зробити скрипт виконуваним
chmod +x scripts/start_telegram_bot_v4.sh

# Запустити бота
./scripts/start_telegram_bot_v4.sh
```

## 📱 Використання

### Початок роботи

1. Відкрийте вашого бота в Telegram
2. Відправте `/start`
3. Оберіть розділ з меню або просто напишіть повідомлення

### Режими роботи

#### 1. Menu Mode (за замовчуванням)
Використовуйте кнопки меню для навігації по функціях:
- 📊 Dashboard - моніторинг системи
- 🤖 AI Assistant - AI функції
- ⚙️ System Control - управління системою
- І т.д.

#### 2. Chat Mode
Натисніть "💬 Chat Mode" для активації режиму природної розмови:
```
Ви: Як справи з системою?
Бот: Система працює нормально. CPU: 45%, RAM: 60%, всі сервіси активні.

Ви: Покажи топ процесів
Бот: [показує список процесів]

Ви: Допоможи з дебагінгом помилки в коді
Бот: [аналізує та надає рекомендації]
```

Для виходу з Chat Mode: `/exit`

#### 3. Direct AI Mode
Просто напишіть будь-яке повідомлення поза меню, і бот автоматично обробить його через AI.

### Приклади команд

```bash
# Системні команди
/start - Початок роботи
/exit - Вихід з Chat Mode

# Природна мова
"Покажи статус системи"
"Які процеси споживають найбільше CPU?"
"Допоможи написати функцію для обробки даних"
"Проаналізуй цей код: [код]"
"Створи план для оптимізації бази даних"
```

## 🏗️ Архітектура

### Компоненти

```
telegram_bot_v4_advanced.py
├── MenuSystem - Система меню
│   ├── get_main_menu()
│   ├── get_dashboard_menu()
│   ├── get_ai_menu()
│   └── ... (10+ меню)
│
├── AIController - AI інтеграція
│   ├── chat() - Основний метод чату
│   ├── _chat_gemini() - Gemini API
│   └── _chat_groq() - Groq API
│
├── SystemController - Системні операції
│   ├── get_system_status()
│   ├── get_processes()
│   └── execute_command()
│
├── DockerController - Docker управління
│   ├── get_containers()
│   └── restart_container()
│
├── GitController - Git операції
│   ├── get_status()
│   ├── pull()
│   └── get_log()
│
├── ContextManager - Управління контекстом
│   ├── get_context()
│   ├── save_context()
│   └── add_message()
│
└── Handlers - Обробники подій
    ├── Command handlers (/start, /exit)
    ├── Menu handlers (Dashboard, AI, etc.)
    ├── Callback handlers (buttons)
    └── Message handlers (AI conversation)
```

### Потік даних

```
User Message
    ↓
Telegram API
    ↓
aiogram Dispatcher
    ↓
Handler (based on state/content)
    ↓
┌─────────────────┬──────────────────┐
│   Menu Action   │   AI Processing  │
│        ↓        │        ↓         │
│  Controller     │  AIController    │
│        ↓        │        ↓         │
│  System/Docker  │  Gemini/Groq API │
└─────────────────┴──────────────────┘
    ↓
ContextManager (save to Redis)
    ↓
Response to User
```

## 🔧 Налаштування

### Зміна AI моделі

Відредагуйте `AIController.__init__()`:

```python
self.current_model = "gemini"  # або "groq"
```

### Додавання нових меню

1. Додайте метод в `MenuSystem`:
```python
@staticmethod
def get_my_menu() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="Option 1", callback_data="my_opt1")],
        [InlineKeyboardButton(text="🏠 Main Menu", callback_data="main_menu")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
```

2. Додайте handler:
```python
@dp.message(F.text == "🎯 My Section")
async def show_my_section(message: types.Message):
    await message.answer(
        "🎯 **MY SECTION**\n\nDescription...",
        reply_markup=MenuSystem.get_my_menu()
    )
```

3. Додайте callback handler:
```python
@dp.callback_query(F.data.startswith("my_"))
async def cb_my_section(callback: types.CallbackQuery):
    # Handle callback
    pass
```

### Додавання нових контролерів

```python
class MyController:
    @staticmethod
    async def my_function() -> str:
        # Your logic here
        return "Result"
```

## 📊 Моніторинг

### Логи

Бот записує логи в:
- `telegram_bot_v4.log` - всі події
- Console output - важливі події

### Redis

Перевірка даних в Redis:
```bash
redis-cli

# Переглянути всі ключі
KEYS user_context:*

# Переглянути контекст користувача
GET user_context:123456789

# Очистити контекст
DEL user_context:123456789
```

## 🐛 Troubleshooting

### Бот не відповідає

1. Перевірте токен в `.env`
2. Перевірте логи: `tail -f telegram_bot_v4.log`
3. Перевірте інтернет з'єднання

### AI не працює

1. Перевірте API ключі в `.env`
2. Перевірте квоти API
3. Перевірте логи на помилки API

### Redis помилки

1. Перевірте чи запущений Redis: `redis-cli ping`
2. Перевірте URL в `.env`
3. Бот автоматично перемкнеться на memory storage якщо Redis недоступний

### Повільна робота

1. Перевірте навантаження системи
2. Збільшіть ресурси для Redis
3. Очистіть старі контексти в Redis

## 🚀 Розширення

### Додавання нових AI моделей

```python
async def _chat_openai(self, message: str, context: List[Dict[str, str]] = None) -> str:
    """Chat via OpenAI"""
    # Implementation
    pass
```

### Інтеграція з базою даних

```python
class DatabaseController:
    @staticmethod
    async def query(sql: str) -> str:
        # Execute query
        # Return results
        pass
```

### Webhooks замість polling

```python
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
from aiohttp import web

async def on_startup(bot: Bot):
    await bot.set_webhook(f"{WEBHOOK_URL}/webhook")

app = web.Application()
webhook_requests_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
webhook_requests_handler.register(app, path="/webhook")
setup_application(app, dp, bot=bot)
web.run_app(app, host="0.0.0.0", port=8080)
```

## 📈 Roadmap

### V4.1
- [ ] Підтримка голосових повідомлень
- [ ] Генерація графіків та діаграм
- [ ] Інтеграція з Grafana
- [ ] Multi-user support

### V4.2
- [ ] Webhook режим
- [ ] Інтеграція з Kubernetes API
- [ ] Advanced analytics
- [ ] Custom dashboards

### V5.0
- [ ] Web interface
- [ ] Mobile app
- [ ] Advanced AI agents
- [ ] Distributed architecture

## 📝 Ліцензія

MIT License - використовуйте вільно!

## 🤝 Підтримка

Для питань та пропозицій:
- Telegram: @your_username
- Email: your_email@example.com
- GitHub Issues

---

**Made with ❤️ by Predator Analytics Team**
