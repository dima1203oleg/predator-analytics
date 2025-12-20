---
description: Підключення та робота на NVIDIA сервері через статичний IP
---

# 🔗 Switch to Server Workflow

Використовуйте цей workflow для підключення до NVIDIA сервера.

## Параметри підключення

| Параметр | Значення |
|----------|----------|
| **IP** | 194.177.1.240 |
| **Port** | 6666 |
| **User** | dima |
| **Directory** | ~/predator-analytics |

---

## Кроки

### 1. Перевірка з'єднання
```bash
./scripts/server-status.sh
```

### 2. Підключення до сервера
```bash
./scripts/server-connect.sh
```

### 3. Перевірка Docker сервісів (на сервері)
```bash
cd ~/predator-analytics && docker compose ps
```

### 4. Перезапуск сервісів (якщо потрібно)
```bash
cd ~/predator-analytics && docker compose down && docker compose up -d
```

### 5. Перегляд логів
```bash
cd ~/predator-analytics && docker compose logs -f --tail=100
```

---

## Синхронізація коду

### Mac → Server
```bash
./scripts/sync-to-server.sh
```

### Server → Mac (backup)
```bash
./scripts/sync-from-server.sh
```

---

## GitOps Deploy
```bash
./scripts/git_deploy.sh
```
