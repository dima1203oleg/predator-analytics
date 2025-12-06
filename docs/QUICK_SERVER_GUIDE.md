# 🚀 Швидкий посібник - Робота з сервером

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
git pull
source .venv/bin/activate
```

### ⚡ Світло пропало - Переключення на Mac

```bash
# 1. Швидко зберегти роботу з сервера
./scripts/sync-from-server.sh

# 2. Запустити локально
cd ua-sources
source .venv/bin/activate
uvicorn app.main:app --reload

# 3. Frontend (новий термінал)
npm run dev
```

### 🔆 Світло з'явилося - Повернення на сервер

```bash
# 1. Синхронізувати зміни
./scripts/sync-to-server.sh

# 2. Підключитися
./scripts/server-connect.sh

# 3. Перезапустити на сервері
cd ~/predator-analytics
git add . && git commit -m "sync" && git push
docker-compose restart
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

## 📊 Поточний статус сервера

**Останній статус (2025-12-05 19:47):**
- ✅ Сервер доступний
- ✅ Uptime: 1:33
- ⚠️ Диск: 91% (152G/177G)
- ✅ RAM: 5.2G/49G
- ✅ Grafana працює (порт 3001)
- ✅ Frontend працює (порт 8082)
- ⚠️ predator10-app - перезапускається (помилка)

---

## 🆘 Екстрена допомога

### Сервер не відповідає?
```bash
# Перевірити з'єднання
ping 5.tcp.eu.ngrok.io
nc -zv 5.tcp.eu.ngrok.io 14564
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

---

**Детальна документація:** `docs/SERVER_WORKFLOW.md`
