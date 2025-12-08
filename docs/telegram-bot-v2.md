# 🤖 Predator Analytics Telegram Bot - v2.0

**Повноцінний AI-асистент** для управління та програмування Predator Analytics через Telegram!

## 🚀 Нові можливості v2.0

### 📊 Моніторинг Predator Analytics
- ✅ **OpenSearch** - статус індексів та документів
- ✅ **Qdrant** - vector DB колекції та вектори
- ✅ **Celery** - workers та tasks
- ✅ **ETL Pipeline** - jobs та статус парсингу
- ✅ Повний статус всієї системи

### 💻 AI Програмування через бот
- ✅ Виконання Python коду
- ✅ Bash команди
- ✅ Запуск тестів
- ✅ Створення файлів
- ✅ Редагування проекту

### 🔗 Автоматизація
- ✅ Авто-парсинг ngrok URLs
- ✅ Авто-оновлення SSH config
- ✅ Monitoring + Alerts

### ☸️ K8s Детальний моніторинг
- ✅ Nodes статус
- ✅ Pods всіх namespaces
- ✅ Services
- ✅ Deployments

---

## 📖 Повний список команд

### 🖥️ Сервер
| Команда | Опис |
|---------|------|
| `/status` | Загальний статус системи |
| `/disk` | Використання диску |
| `/memory` | RAM статистика |
| `/cpu` | CPU завантаження |
| `/uptime` | Аптайм |

### 🐳 Docker/K8s
| Команда | Опис |
|---------|------|
| `/docker` | Список контейнерів |
| `/pods [namespace]` | K8s поди |
| `/cluster` | Детальний статус кластеру |
| `/logs [сервіс]` | Логи сервісу |

### 🔗 Мережа
| Команда | Опис |
|---------|------|
| `/ngrok` | Поточні ngrok дані |
| `/ssh` | SSH конфігурація |
| `/connect` | Інструкції підключення |

### 📊 Predator Analytics
| Команда | Опис |
|---------|------|
| `/predator` | **Повний статус системи** |
| `/opensearch` | OpenSearch індекси та документи |
| `/qdrant` | Qdrant collections та vectors |
| `/celery` | Celery workers та tasks |
| `/etl` | ETL jobs статус |
| `/parsing` | Чи парситься база |
| `/indexing` | Чи індексується |

### 💻 AI Програмування
| Команда | Опис | Приклад |
|---------|------|---------|
| `/code [python]` | Виконати Python код | `/code print("Hello!")` |
| `/bash [cmd]` | Виконати bash команду | `/bash ls -la` |
| `/test [path]` | Запустити тести | `/test app/tests/` |
| `/create [path]` | Створити файл | `/create test.py` |

### 📦 Deploy
| Команда | Опис |
|---------|------|
| `/git` | Git статус |
| `/deploy` | Deploy інфо |

---

## 💡 Приклади використання

### Моніторинг системи
```
/predator
```
Показує повний статус:
- Backend API
- OpenSearch (індекси, документи)
- Qdrant (колекції, вектори)
- Celery (workers)
- K8s (nodes, pods)

### Перевірка індексації
```
/indexing
```
Показує:
- OpenSearch: кількість індексів та docs
- Qdrant: vectors та collections

### Програмування через бот
```
/code 
import os
print(f"Current dir: {os.getcwd()}")
print("Files:", os.listdir())
```

Виконає код в контексті проекту!

### Bash команди
```
/bash git status -s
```

### Запуск тестів
```
/test app/tests/test_ai.py
```

### Створення файлу
```
/create scripts/my_script.py
def hello():
    print("Hello from bot!")
```

---

## 🎯 Розширене меню

Натисни `/start` або `/menu` щоб побачити:

```
┌──────────────┬──────────────┐  
│ 📊 Статус    │ 🎯 Predator  │
├──────────────┼──────────────┤
│ 🗄️ OpenSearch│ 🧠 Qdrant    │
├──────────────┼──────────────┤
│ 📥 Парсинг   │ ⚙️ Celery    │
├──────────────┼──────────────┤
│ 🐳 Docker    │ ☸️ Кластер   │
├──────────────┼──────────────┤
│ 🔗 Ngrok     │ 📡 SSH       │
├──────────────┼──────────────┤
│ 💻 Програм.. │ 🧪 Тести     │
├──────────────┼──────────────┤
│ 📦 Deploy    │ ❓ Допомога  │
└──────────────┴──────────────┘
```

---

## 🔗 Автоматичне оновлення ngrok

Просто надішли боту повідомлення в форматі:
```
🔗 Ngrok URLs
SSH: tcp://7.tcp.eu.ngrok.io:15102
HTTP: https://example.ngrok-free.dev
Команда: sed ...
```

Бот автоматично:
1. Розпарсить дані
2. Оновить `~/.ssh/config`
3. Підтвердить успішне оновлення

Після цього можна підключатись:
```bash
ssh dev-ngrok
```

---

## 🚀 Запуск

### Foreground (тестування)
```bash
cd /Users/dima-mac/Documents/Predator_21/scripts
python3 telegram_bot.py
```

### Background (автозапуск)
```bash
cd /Users/dima-mac/Documents/Predator_21/scripts
./install_telegram_bot.sh
# Вибери опцію 2
```

### Статус сервісу
```bash
launchctl list | grep telegram-bot
```

### Логи
```bash
tail -f ~/Library/Logs/telegram-bot.log
```

### Зупинка
```bash
launchctl unload ~/Library/LaunchAgents/com.predator.telegram-bot.plist
```

---

## ⚙️ Конфігурація

### Токен бота
Встановлюється в環境 змінній:
```bash
export TELEGRAM_BOT_TOKEN="your_token"
```

Або напряму в `telegram_bot.py`:
```python
BOT_TOKEN = "7879930188:AAGH..."
```

### URLs сервісів
```bash
export OPENSEARCH_URL="http://localhost:9200"
export QDRANT_URL="http://localhost:6333"
export BACKEND_URL="http://localhost:8000"
export REDIS_URL="redis://localhost:6379"
```

---

## 🔐 Безпека

- ✅ Код виконується ізольовано в `/tmp`
- ✅ Таймаут виконання (30 сек для коду, 60 сек для тестів)
- ✅ Обмеження розміру виводу
- ⚠️ Для продакшену додай `AUTHORIZED_USERS` в конфіг

---

## 📊 Приклади відповідей

### `/predator`
```
📊 PREDATOR ANALYTICS - Повний статус

🔹 Backend API
  Status: healthy

🔸 OpenSearch (Індексація)
  Cluster: predator-cluster
  Status: green
  Indices: 5
  Docs: 15,234
  Size: 234.56 MB

🔹 Qdrant (Vector DB)
  Collections: 2
    • documents_vectors: 12,450 vectors
    • embeddings: 8,932 vectors

🔸 Celery Workers
  Status: online
  
🔹 ETL Pipeline
  Total Jobs: 3

🔸 Kubernetes
  Nodes: 3
  Namespaces: 8
  Pods: 45/48 Running
  Services: 23
```

### `/code print(2+2)`
```
✅ Code Execution

```python
print(2+2)
```

Output:
```
4
```
```

---

## 🎉 Фічі які WOW

1. **Авто SSH config** - Ніколи більше не копіюй ngrok данівручну!
2. **Програмування в боті** - Виконуй код bez IDE
3. **Повний контроль** - Вся система під рукою в Telegram
4. **Інтерактивне меню** - Emoji кнопки для швидкого доступу
5. **Моніторинг в реальному часі** - Бачи що відбувається в системі

---

## 🐛 Troubleshooting

### Бот не відповідає
```bash
# Перевір чи працює
ps aux | grep telegram_bot

# Перезапусти
launchctl unload ~/Library/LaunchAgents/com.predator.telegram-bot.plist
launchctl load ~/Library/LaunchAgents/com.predator.telegram-bot.plist
```

### OpenSearch/Qdrant офлайн
```bash
# Запусти сервіси
docker compose up -d opensearch qdrant
```

### Помилки виконання коду
- Переконайсь що `python3` в PATH
- Перевір логи: `~/Library/Logs/telegram-bot.log`

---

## 📚 Документація

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [OpenSearch Docs](https://opensearch.org/docs/)
- [Qdrant Docs](https://qdrant.tech/documentation/)
- [Celery Docs](https://docs.celeryq.dev/)

---

**Насолоджуйся найкрутішим Telegram ботом для DevOps! 🚀**
