---
description: NVIDIA Server Priority Rule - Всі розгортання тільки на NVIDIA сервері
---

# 🖥️ NVIDIA Server Priority Policy

## ⚠️ КРИТИЧНЕ ПРАВИЛО

**Якщо NVIDIA сервер (194.177.1.240:6666) АКТИВНИЙ і доступний:**
- ВСЯ робота і розгортання має бути ТІЛЬКИ на NVIDIA сервері
- Локальний Mac використовується тільки для розробки і синхронізації
- Всі Docker контейнери запускаються на сервері
- **Primary Access:** Статичний IP (http://194.177.1.240:8082 або :80)
- **Backup Access:** Ngrok тунель (тільки якщо порти закриті фаєрволом)

---

## Параметри сервера

| Параметр | Значення |
|----------|----------|
| **IP** | 194.177.1.240 |
| **SSH Port** | 6666 |
| **User** | dima |
| **GPU** | NVIDIA GTX 1080 (8GB) |
| **RAM** | 49GB |
| **Робоча директорія** | ~/predator-analytics |

---

## Перевірка статусу сервера

```bash
# turbo
./scripts/server-status.sh
```

---

## Деплой на сервер

### 1. Синхронізація коду (Mac → Server)
```bash
./scripts/sync-to-server.sh
```

### 2. Підключення до сервера
```bash
ssh -p 6666 dima@194.177.1.240
cd ~/predator-analytics
```

### 3. Перебудова Docker образів
```bash
docker compose build --no-cache frontend backend
```

### 4. Перезапуск сервісів
```bash
docker compose down && docker compose up -d
```

---

## Web Interface URLs

| Сервіс | Порт | URL |
|--------|------|-----|
| Frontend | 8082 | http://194.177.1.240:8082 |
| Backend API | 8090 | http://194.177.1.240:8090 |
| Grafana | 3001 | http://194.177.1.240:3001 |
| MLflow | 5001 | http://194.177.1.240:5001 |
| Prometheus | 9092 | http://194.177.1.240:9092 |

---

## Важливі нотатки

1. **Весь production трафік** йде через NVIDIA сервер
2. **Mac** - тільки для локальної розробки та тестування
3. **Синхронізація** виконується перед кожним deploy
4. **Frontend версія** - тільки одна актуальна (v45/v45)
