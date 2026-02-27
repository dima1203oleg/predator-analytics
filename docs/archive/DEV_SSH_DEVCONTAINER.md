# 🚀 Predator v45 | Neural Analytics — SSH DevContainer Development Guide

> **Server-First Development**: Mac для редагування, Server для обчислень

## 📋 Overview

Ми використовуємо **Remote SSH + DevContainer** як основний dev-підхід:

```
VS Code → Remote SSH → dev-ngrok → Open Repo → Reopen in Container
```

**Kubernetes extension** використовується лише для операційного моніторингу (pods/logs/helm), але НЕ як основний dev-канал.

---

## 🔧 Підготовка (один раз)

### 1. Додати SSH профіль

Відкрийте `~/.ssh/config` на вашому Mac та додайте:

```ssh-config
Host dev-ngrok
    HostName 6.tcp.eu.ngrok.io
    Port 18105
    User root
    IdentityFile ~/.ssh/id_ed25519_ngrok
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

> ⚠️ **Port** змінюється кожен раз при перезапуску ngrok. Оновлюйте його після отримання нових даних.

### 2. Згенерувати SSH ключ (якщо ще немає)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_ngrok -C "predator-dev"
```

Скопіюйте публічний ключ на сервер:
```bash
ssh-copy-id -i ~/.ssh/id_ed25519_ngrok dev-ngrok
```

### 3. Перевірити підключення

```bash
ssh dev-ngrok
# Має підключитися без паролю
```

---

## 🖥️ Підготовка сервера (один раз)

### 1. Підключіться до сервера

```bash
ssh dev-ngrok
```

### 2. Створіть директорії

```bash
# Клонуйте репо та запустіть bootstrap
git clone https://github.com/YOUR_ORG/Predator_22.git /opt/predator/repo/Predator_22
cd /opt/predator/repo/Predator_22
sudo ./scripts/bootstrap_server_dirs.sh
```

Або вручну:
```bash
sudo mkdir -p /opt/predator/{repo,data/raw,data/processed,data/indexes,cache,models,backups,logs}
```

### 3. Переконайтесь що Docker встановлений

```bash
docker --version
docker compose version
```

---

## 💻 Щоденний workflow

### Крок 1: Відкрити VS Code з Remote SSH

1. Відкрийте VS Code
2. `Cmd+Shift+P` → "Remote-SSH: Connect to Host..."
3. Оберіть `dev-ngrok`
4. Дочекайтесь підключення

### Крок 2: Відкрити папку проекту

1. `File → Open Folder`
2. Введіть: `/opt/predator/repo/Predator_22`
3. Натисніть OK

### Крок 3: Reopen in Container

1. VS Code покаже popup "Folder contains Dev Container config"
2. Натисніть **"Reopen in Container"**
3. Дочекайтесь побудови контейнера

Або вручну: `Cmd+Shift+P` → "Dev Containers: Reopen in Container"

---

## 📁 Серверна структура

```
/opt/predator/
├── repo/
│   └── Predator_22/          # Код репозиторію
├── data/
│   ├── raw/                  # Сирі дані (Excel, CSV)
│   ├── processed/            # Оброблені дані
│   └── indexes/              # OpenSearch/Qdrant індекси
├── cache/                    # Кеш (embeddings, models)
├── models/                   # ML моделі
├── backups/                  # Бекапи БД
└── logs/                     # Логи
```

---

## 🔀 SSH vs Kubernetes — Розмежування

| Задача | Інструмент |
|--------|------------|
| **Code Development** | SSH + DevContainer |
| **Debugging** | SSH + DevContainer |
| **Running Tests** | SSH + DevContainer |
| **View Pods/Logs** | Kubernetes Extension |
| **Helm Operations** | Kubernetes Extension |
| **Cluster Diagnostics** | Kubernetes Extension |

**Правило:** Kubernetes extension — для ops/observability, не для dev.

---

## ⚡ Швидкі команди

### Оновити ngrok port
```bash
# На Mac
sed -i '' 's/Port .*/Port NEW_PORT/' ~/.ssh/config
```

### Перевірити з'єднання
```bash
ssh -v dev-ngrok
```

### Запустити сервіси на сервері
```bash
ssh dev-ngrok "cd /opt/predator/repo/Predator_22 && docker compose up -d"
```

---

## 🔐 Security

**НІКОЛИ не комітити в репозиторій:**
- ❌ Паролі
- ❌ Приватні SSH ключі
- ❌ API токени (OpenAI, Anthropic)
- ❌ ngrok auth tokens
- ❌ Database credentials

Використовуйте `.env` файли локально на сервері.

---

## 🐛 Troubleshooting

### "Connection refused"
- Перевірте ngrok статус на сервері
- Оновіть Port у `~/.ssh/config`

### DevContainer не будується
- Перевірте Docker на сервері: `docker ps`
- Перевірте логи: `docker logs`

### Немає доступу до файлів
- Перевірте permissions: `ls -la /opt/predator/`
- Виправте: `sudo chmod -R 755 /opt/predator/`

---

## 📚 Додаткові ресурси

- [VS Code Remote SSH](https://code.visualstudio.com/docs/remote/ssh)
- [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [ngrok Documentation](https://ngrok.com/docs)
