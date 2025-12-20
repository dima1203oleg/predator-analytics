# 🚀 Швидкий посібник - Робота з сервером

## 📍 Параметри підключення

| Параметр | Значення |
|----------|----------|
| **IP** | 194.177.1.240 |
| **Port** | 6666 |
| **User** | dima |
| **Директорія** | ~/predator-analytics |

---

## ⚡ Швидкі команди

### Підключення
```bash
./scripts/server-connect.sh
```

### Статус
```bash
./scripts/server-status.sh
```

### Синхронізація
```bash
# На сервер
./scripts/sync-to-server.sh

# З сервера (бекап)
./scripts/sync-from-server.sh
```

---

## 📋 Сценарії використання

### 🌅 Ранок - Початок роботи на сервері

```bash
# 1. Перевірити статус
./scripts/server-status.sh

# 2. Підключитися
./scripts/server-connect.sh

# 3. На сервері
cd ~/predator-analytics
docker compose ps
docker compose logs -f predator_backend
```

### ⚡ Світло пропало - Переключення на Mac

```bash
# 1. Швидко зберегти роботу з сервера
./scripts/sync-from-server.sh

# 2. Запустити локально
cd /Users/dima-mac/Documents/Predator_21
./start_local.sh

# Або вручну:
# docker compose up -d
```

### 🔆 Світло з'явилося - Повернення на сервер

```bash
# 1. Синхронізувати зміни
./scripts/sync-to-server.sh

# 2. Підключитися
./scripts/server-connect.sh

# 3. Перезапустити на сервері
cd ~/predator-analytics
git pull
docker compose restart
```

---

## 🎯 Корисні alias (додайте в ~/.zshrc)

```bash
# Додати в ~/.zshrc
alias server-go='cd /Users/dima-mac/Documents/Predator_21 && ./scripts/server-connect.sh'
alias server-status='cd /Users/dima-mac/Documents/Predator_21 && ./scripts/server-status.sh'
alias server-push='cd /Users/dima-mac/Documents/Predator_21 && ./scripts/sync-to-server.sh'
alias server-pull='cd /Users/dima-mac/Documents/Predator_21 && ./scripts/sync-from-server.sh'
alias server-check='cd /Users/dima-mac/Documents/Predator_21 && ./scripts/server-status.sh && ./scripts/server-connect.sh'
```

Після додавання:
```bash
source ~/.zshrc
```

Тепер можна використовувати:
```bash
server-go      # Підключитися
server-status  # Статус
server-push    # Відправити на сервер
server-pull    # Забрати з сервера
server-check   # Статус + Підключення
```

---

## 🆘 Екстрена допомога

### Сервер не відповідає?
```bash
# Перевірити з'єднання
ping 194.177.1.240
nc -zv 194.177.1.240 6666

# SSH з verbose
ssh -vvv -p 6666 dima@194.177.1.240
```

### Синхронізація не працює?
```bash
# Спробувати dry-run
./scripts/sync-to-server.sh --dry-run
```

### Немає місця на диску?
```bash
./scripts/server-connect.sh "docker system prune -af"
```

### Контейнери не запускаються?
```bash
./scripts/server-connect.sh "cd ~/predator-analytics && docker compose logs"
```

---

**Детальна документація:** `docs/SERVER_WORKFLOW.md`
**Останнє оновлення:** 2025-12-14
