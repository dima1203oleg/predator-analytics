# 🤖 Predator Analytics Telegram Bot v2.0

**Повноцінний AI-асистент з АВТОМАТИЧНИМ ВИКОНАННЯМ задач!**

## 🚀 Нові можливості v2.0

### ✨ Головна фіча: Автовиконання замість інструкцій

**Раніше:**
```
Ви: "Перезапусти backend"
Бот: "Щоб перезапустити backend, виконайте команду docker compose restart backend..."
```

**Тепер:**
```
Ви: "Перезапусти backend"
Бот: 🔧 Підтвердіть виконання:
     📋 Задача: 🔄 Перезапустити сервіс backend
     Команди: docker compose restart backend
     
     [✅ Підтвердити] [❌ Скасувати]

Ви: *натискаєте "Підтвердити"*
Бот: ✅ Успішно виконано!
     ⏱️ 2340ms
     Результат: Container predator_backend...
```

### 🎮 Управління NVIDIA Сервером

**Автоматичне визначення адреси:**
- Надсилаєте ngrok повідомлення → Бот автоматично оновлює:
  - SSH config (`~/.ssh/config`)
  - .env файл
  - Перевіряє з'єднання

**Віддалені команди:**
```
"Статус nvidia сервера"
"GPU статус"
"Docker на nvidia"
"Деплой на сервер"
"Логи backend на сервері"
```

### 📱 Красиве Inline-меню

Нова система меню з підменю та inline-кнопками:

- 📊 **Статус системи** - моніторинг всіх компонентів
- 🎮 **NVIDIA Сервер** - GPU, Docker, Deploy на віддалений сервер
- 🐳 **Docker** - управління контейнерами  
- ☸️ **Kubernetes** - моніторинг кластера
- 📦 **Git/Deploy** - версіонування та деплой
- 🧠 **AI Assistant** - пошук та аналіз
- ⚙️ **Налаштування** - конфігурація бота

---

## 🔧 Підтримувані категорії команд

### 🎮 NVIDIA Server (Remote)
```
"nvidia статус" / "статус сервера"
"gpu" / "відеокарта" / "nvidia-smi"
"docker на сервері" / "nvidia docker"
"деплой на nvidia" / "deploy remote"
"логи backend на сервері"
```

### 🐳 Docker (Local)
```
"docker статус" / "контейнери"
"запусти docker" / "підніми сервіси"
"зупини backend" / "docker down"
"перезапусти redis"
"логи qdrant" / "logs celery"
```

### 📦 Git
```
"git status" / "git статус"
"git pull" / "оновити код"
"git push" / "запушити"
"закомітити зміни" / "commit"
"git log" / "історія"
```

### ☸️ Kubernetes
```
"k8s поди" / "pods"
"kubernetes ноди"
"k8s сервіси"
"перезапусти deployment"
```

### 🗄️ Бази даних
```
"postgres статус"
"redis info" / "redis ключі"
"opensearch статус"
"qdrant collections"
"статус всіх баз"
```

### 💾 Backup
```
"бекап postgres"
"бекап redis"
"повний бекап"
```

### 🔄 ArgoCD
```
"argocd статус"
"argocd sync nvidia"
"argocd rollback"
```

### 📊 MLflow
```
"mlflow статус"
"mlflow експерименти"
"mlflow моделі"
```

### ⚙️ Celery
```
"celery workers"
"celery задачі"
"перезапусти celery"
```

### 📊 System
```
"диск" / "місце на диску"
"пам'ять" / "RAM"
"CPU" / "навантаження"
"uptime"
```

---

## 📡 Ngrok Integration

### Автоматичне оновлення при отриманні ngrok повідомлення:

**Надішліть повідомлення у форматі:**
```
SSH: tcp://0.tcp.eu.ngrok.io:12345
HTTP: https://xxx.ngrok-free.dev
```

**Бот автоматично:**
1. ✅ Оновлює `~/.ssh/config` (Host dev-ngrok)
2. ✅ Оновлює `.env` файл
3. ✅ Перевіряє SSH з'єднання
4. ✅ Запускає ArgoCD sync (якщо включено)

**Після цього можна:**
```bash
ssh dev-ngrok  # Замість ssh -p 12345 root@0.tcp.eu.ngrok.io
```

---

## 🔐 Безпека

### Підтвердження для небезпечних операцій

Деякі дії потребують підтвердження:
- ⚠️ Git push
- ⚠️ Docker compose down
- ⚠️ Повний деплой
- ⚠️ Деплой на NVIDIA
- ⚠️ Git commit

**Небезпечні команди (виконуються тільки вручну):**
- ❌ `rm -rf`
- ❌ `drop database`
- ❌ Форматування диску

---

## 🚀 Запуск

### Локально
```bash
cd /Users/dima-mac/Documents/Predator_21/ua-sources
python3 run_telegram_bot.py
```

---

## ⚙️ Налаштування

### Змінні середовища

```bash
# Токен бота
TELEGRAM_BOT_TOKEN=your_token

# Авторизовані користувачі
TELEGRAM_AUTHORIZED_USERS=123456789,987654321

# Auto-deploy при появі ngrok тунелю
AUTO_DEPLOY_ON_UP=false

# Auto-restart ngrok при падінні
AUTO_RESTART_NGROK=false

# ArgoCD для синхронізації
ARGOCD_NVIDIA_SERVER=https://argocd.example.com
ARGOCD_NVIDIA_TOKEN=your_token
```

---

## 📊 Архітектура

```
┌────────────────────────────────────────────────────────────────┐
│                    Telegram Bot v2.0                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────┐       │
│  │ TelegramMenu  │  │ TaskExecutor │  │ RemoteServer  │       │
│  │   Builder     │  │   (Local +   │  │   Manager     │       │
│  └───────────────┘  │    Remote)   │  └───────────────┘       │
│         │           └──────────────┘          │                │
│         ▼                  │                  ▼                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │            TelegramAssistant                            │   │
│  │        process_update() → (text, keyboard)              │   │
│  └────────────────────────────────────────────────────────┘   │
│                           │                                    │
│         ┌─────────────────┼─────────────────┐                  │
│         ▼                 ▼                 ▼                  │
│    Local Docker     NVIDIA Server     AI Engine                │
│     Subprocess       SSH Commands     LLM Council              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📁 Файли

| Файл | Опис |
|------|------|
| `telegram_assistant.py` | Головний клас бота |
| `telegram_menu.py` | Система меню |
| `telegram_executor.py` | Виконавець задач (local + remote) |
| `remote_server.py` | Управління NVIDIA сервером |
| `run_telegram_bot.py` | Точка входу |

---

**Версія:** 2.0  
**Дата:** 2025-12-10
