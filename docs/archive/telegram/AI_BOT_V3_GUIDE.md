# 🤖 PREDATOR AI BOT v3.0 - Повний Гід

## 🎯 Що нового?

### 🗣️ Природня Мова
Тепер бот розуміє звичайні запитання:
- "Скільки зараз використовується RAM?"
- "Покажи статус всіх контейнерів"
- "Який агент найбільше навантажує систему?"

### 🤝 Режим Діалогу
Обговорюй рішення з ботом перед виконанням:
```
Ти: "Хочу перезапустити базу даних"
Бот: "⚠️ Зачекай! Зараз активні 3 запити.
      Краще зачекати 2 хвилини або зробити graceful shutdown?"
Ти: "Добре, graceful"
Бот: "✅ Виконую..."
```

### 📚 Багаторівневе Меню

#### 🏠 Головне Меню (10 розділів)
1. **🤖 AI Dialogue** - Природня розмова з AI
2. **📊 Monitoring** - Системний моніторинг
3. **⚙️ System Control** - Управління системою
4. **🧠 Agents** - Управління AI агентами
5. **🗄️ Data & DB** - Робота з базами даних
6. **📦 Git & Deploy** - Git операції та деплой
7. **🔬 Analytics** - Аналітика та звіти
8. **⚡ Quick Actions** - Швидкі дії
9. **🎛️ Advanced** - Розширені налаштування
10. **📚 Help** - Допомога

#### 📊 Підменю Monitoring
- 📈 System Metrics (CPU, RAM, GPU, Disk)
- 🐳 Docker Status (всі контейнери)
- 💾 Database Health (PostgreSQL)
- 🔍 OpenSearch Health
- ⚡ Redis Status
- 📊 Live Dashboard

#### 🧠 Підменю Agents (8 агентів)
- 👔 **Chairman** (Gemini) - Лідер, приймає рішення
- 🔍 **Critic** (Groq) - Критикує та покращує
- 📊 **Analyst** (DeepSeek) - Аналізує дані
- 💻 **Code Improver** - Покращує код
- 🎨 **UI Guardian** - Моніторить UI
- 🛡️ **Data Sentinel** - Охороняє дані
- 📜 **Git Auto-Committer** - Автоматичні коміти
- 🏛️ **LLM Council** - Колективні рішення

Для кожного агента:
- ✅ Start/Stop
- 📊 Status
- 📈 Performance Metrics
- ⚙️ Configuration
- 📜 Recent Activity

#### ⚙️ Підменю System Control
- 🐳 Docker Manage (start/stop/restart)
- 🔄 Restart Services
- 🧹 Clear Cache (Redis, System)
- 📋 View Logs (real-time tail)
- 🔧 Config Editor
- 💾 Backup Now

#### 🗄️ Підменю Data & DB
- 📊 PostgreSQL Query (SQL runner)
- 🔍 OpenSearch Search
- 📤 Data Export (CSV, JSON)
- 📥 Data Import
- 🔄 Sync PG→OpenSearch
- 🧪 Test Queries

#### 🔬 Підменю Analytics
- 📈 System Performance (graphs)
- 🤖 AI Agent Stats
- 🔍 Search Analytics
- 👥 User Activity
- ⚠️ Error Analysis
- 📊 Custom Reports

## 🚀 Запуск

### Швидкий старт
```bash
./scripts/start_ai_bot.sh
```

### Ручний запуск
```bash
source .venv/bin/activate
python3 backend/orchestrator/agents/telegram_bot_v3.py
```

## 🔑 Налаштування

Потрібні змінні в `.env`:
```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_ADMIN_ID=your_telegram_id
TELEGRAM_CHANNEL_ID=optional_channel_id

# AI (для природньої мови)
GEMINI_API_KEY=your_gemini_key  # Обов'язково!
GROQ_API_KEY=optional
DEEPSEEK_API_KEY=optional

# System
REDIS_URL=redis://localhost:6379/1
```

## 💬 Приклади використання

### Природній діалог
```
Ти: "Привіт, як справи у системи?"
Бот: "👋 Привіт! Система в нормі:
      • CPU: 23% (комфортно)
      • RAM: 45% (є запас)
      • Всі 5 Docker контейнерів працюють

      Єдине - OpenSearch трохи повільний сьогодні,
      можливо варто переіндексувати?"

Ту: "Давай переіндексую. Як краще?"
Бот: "🤔 Є 2 варіанти:
      1. Швидкий (5хв, але сервіс недоступний)
      2. Поступовий (30хв, але працює паралельно)

      Що обираєш?"

Ти: "Поступовий"
Бот: "✅ Запускаю поступову реіндексацію..."
```

### Управління агентами
```
Меню → 🧠 Agents → 👔 Chairman

Бот: "👔 Chairman (Gemini)
      Status: 🟢 Running
      Last Activity: 2 min ago
      Tasks Processed: 156
      Success Rate: 94%

      Available Actions:"
      [Start] [Stop] [Restart] [View Logs] [Config]
```

### Моніторинг в реальному часі
```
Меню → 📊 Monitoring → 📈 System Metrics

Бот: *відправляє графік*
     "📊 SYSTEM VITALS // 14:35:12
      💻 CPU: 34%
      🧠 RAM: 52% (12.4 GB free)
      💾 Disk: 67% (128 GB free)
      🎮 GPU: 12%

      🐳 Docker: 5 containers
      ✅ All services healthy"

      [Refresh] [Details] [Alerts]
```

## 🎯 Ключові фічі

### 1. Контекстна Пам'ять
Бот пам'ятає останні 50 повідомлень:
```
Ти: "Покажи статус бази"
Бот: "PostgreSQL: здорова, 1.2M записів"

*через 5 хвилин*

Ти: "А скільки там було вчора?"
Бот: "Вчора було 1.18M. Зріст +20k за добу 📈"
```

### 2. Спори та Аргументація
```
Ти: "Видали всі старі логи"
Бот: "⛔ СТОП! Це небезпечно:
      • Є логи критичних помилок за останній тиждень
      • Можливокорисні для дебагу
      • Вони займають лише 2GB

      Може краще заархівувати?"

Ти: "Ні, видаляй все старше місяця"
Бот: "Добре, компроміс прийнято ✅
      Видаляю логи старше 30 днів..."
```

### 3. Проактивні Поради
Бот сам пропонує покращення:
```
Бот: "💡 Помітив, що RAM часто >80%.
      Можу:
      1. Збільшити swap
      2. Оптимізувати OpenSearch
      3. Очистити кеш Redis

      Що робимо?"
```

## 🔧 Розширення

### Додавання нового агента
1. Додай в `MenuSystem.get_agents_menu()`
2. Створи callback handler
3. Реалізуй управління (start/stop/status)

### Додавання нового розділу
1. Додай кнопку в `MenuSystem.get_main_menu()`
2. Створи підменю функцію
3. Додай handlers для всіх action

## 🐛 Troubleshooting

### Бот не розуміє природню мову
- Перевір `GEMINI_API_KEY` в `.env`
- Лог покаже: `AI dialogue not configured`

### Бот не відповідає
- Перевір `TELEGRAM_ADMIN_ID` (твій ID)
- Подивись логи: `tail -f bot_log.txt`

### Помилки при запуску
```bash
# Перевстанови залежності
pip install --upgrade google-generativeai aiogram
```

## 📊 Статистика

Новий бот підтримує:
- ✅ 10 основних розділів
- ✅ 40+ підменю
- ✅ 100+ команд та дій
- ✅ Природня мова (Gemini AI)
- ✅ Контекстна пам'ять
- ✅ Управління 8 агентами
- ✅ Real-time моніторинг
- ✅ Docker management
- ✅ Database operations
- ✅ Git automation

## 🎉 Готово!

Бот тепер - це **повноцінний пульт управління** системою з AI-мозком! 🚀
