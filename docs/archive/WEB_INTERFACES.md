# 🌐 Посилання на веб-інтерфейси Predator Analytics

**Сервер:** Nvidia Server (dev)  
**Доступ:** Через SSH-тунель  
**Статус:** ✅ Активний  
**Сервіси:** ✅ Frontend працює, ✅ Grafana працює

---

## 📊 Головні веб-інтерфейси

### 🎨 **Frontend (Основний додаток)**
```
http://localhost:9082
```
**Опис:** Головний веб-інтерфейс Predator Analytics  
**Технологія:** React + Vite  
**Порт на сервері:** 8082  

### 🔎 **Semantic Search Interface (New v25.1)**
**Розташування:** Analytics View -> Top Search Bar  
**Функції:**  
- **Semantic Toggle:** Перемикання між Deep Scan (Agents) та Hybrid Search (Qdrant).
- **Evidence Grid:** Візуалізація знайдених документів з підсвічуванням.
- **Combined Score:** Відображення релевантності (Keyword + Vector).

---

### 📊 **Grafana (Моніторинг та Dashboards)**
```
http://localhost:9001
```
**Опис:** Система моніторингу та візуалізації метрик  
**Технологія:** Grafana  
**Порт на сервері:** 3001  
**Логін:** admin (перевірте на сервері)

---

### 🔧 **Backend API (FastAPI)**

#### Swagger документація
```
http://localhost:9000/docs
```

#### ReDoc документація  
```
http://localhost:9000/redoc
```

#### API endpoint
```
http://localhost:9000
```

**Опис:** REST API для Predator Analytics  
**Технологія:** FastAPI (Python)  
**Порт на сервері:** 8000  

---

## 🗄️ Бази даних (для підключення через клієнт)

### PostgreSQL
```
Host: localhost
Port: 9432
User: (перевірте .env на сервері)
Password: (перевірте .env на сервері)
Database: predator_db
```

### Redis
```
Host: localhost
Port: 9379
```

---

## 🚀 Як запустити тунель

### Автоматично (рекомендовано)
```bash
./scripts/server-tunnel.sh start
```

### Вручну
```bash
ssh -f -N -i ~/.ssh/id_ed25519_ngrok -p 14564 \\
  -L 9001:localhost:3001 \\
  -L 9082:localhost:8082 \\
  -L 9000:localhost:8000 \\
  -L 9432:localhost:5432 \\
  -L 9379:localhost:6379 \\
  dima@5.tcp.eu.ngrok.io
```

### Перевірити статус
```bash
./scripts/server-tunnel.sh status
```

### Зупинити тунель
```bash
./scripts/server-tunnel.sh stop
```

---

## 🔍 Перевірка доступності

### Перевірити чи працює тунель
```bash
lsof -i -P | grep LISTEN | grep -E ":(9001|9082|9000)"
```

Очікуваний вивід:
```
ssh  PID user  IPv6  TCP localhost:9001 (LISTEN)
ssh  PID user  IPv6  TCP localhost:9082 (LISTEN)
ssh  PID user  IPv6  TCP localhost:9000 (LISTEN)
```

### Швидка перевірка через curl
```bash
# Frontend
curl -I http://localhost:9082

# Backend API
curl http://localhost:9000/health

# Grafana
curl -I http://localhost:9001
```

---

## 💡 Корисні поради

1. **Тунель працює у фоновому режимі**  
   Після запуску можна закрити термінал - тунель продовжить працювати

2. **Автоматичний запуск**  
   Додайте у `.zshrc`:
   ```bash
   # Автозапуск тунелю при відкритті терміналу
   if ! lsof -i:9082 > /dev/null 2>&1; then
       /Users/dima-mac/Documents/Predator_21/scripts/server-tunnel.sh start
   fi
   ```

3. **Закладки браузера**  
   Збережіть посилання у закладках для швидкого доступу:
   - 📊 [Grafana](http://localhost:9001)
   - 🎨 [Frontend](http://localhost:9082)
   - 🔧 [API Docs](http://localhost:9000/docs)

4. **Перезапуск при проблемах**
   ```bash
   ./scripts/server-tunnel.sh restart
   ```

---

## 🛠️ Troubleshooting

### Проблема: "Address already in use"
```bash
# Знайти процес на порті
lsof -i :9082

# Вбити процес
kill -9 <PID>

# Перезапустити тунель
./scripts/server-tunnel.sh restart
```

### Проблема: "Connection refused"
```bash
# Перевірити чи працює сервер
./scripts/server-status.sh

# Перевірити чи запущені контейнери на сервері
./scripts/server-connect.sh "docker ps"
```

### Проблема: Тунель не підключається
```bash
# Перевірити SSH підключення
ssh -i ~/.ssh/id_ed25519_ngrok dima@5.tcp.eu.ngrok.io -p 14564

# Перевірити ключ
ls -la ~/.ssh/id_ed25519_ngrok*
```

---

## 📱 Альтернативні способи доступу

### 1. Прямий доступ (якщо є публічний IP)
⚠️ Наразі заблоковано брандмауером

```
http://78.154.184.177:8082  # Frontend
http://78.154.184.177:3001  # Grafana  
http://78.154.184.177:8000  # API
```

### 2. Через ngrok (для демонстрацій)
На сервері:
```bash
ngrok http 8082  # Frontend
ngrok http 3001  # Grafana
```

---

## 🎯 Швидкий старт

Для початку роботи виконайте:

```bash
# 1. Запустити тунель
./scripts/server-tunnel.sh start

# 2. Відкрити браузер
open http://localhost:9082  # Frontend
open http://localhost:9001  # Grafana  
open http://localhost:9000/docs  # API

# 3. Працювати з додатком
```

---

**Останнє оновлення:** 2025-12-05 19:55  
**Статус тунелю:** ✅ Активний (PID: 51179)
