# 🔗 NGROK Setup — Доступ до NVIDIA Сервера Без VPN

**Status:** ✅ NGROK встановлений | ✅ Скрипти готові | ⏳ Чекаємо на вашу дію

---

## 🎯 Сценарії Підключення

### 📌 Сценарій 1: На NVIDIA Сервері Вже Запущений NGROK (НАЙПРОСТІШИЙ)

**Якщо сервер адміністратор уже запустив ngrok на сервері:**

```bash
# На Mac, отримайте public URL від адміністратора
# Наприклад: tcp://0.tcp.ngrok.io:12345

# 1. Підключіться через SSH:
ssh -p 12345 -i ~/.ssh/id_ed25519_dev dima@0.tcp.ngrok.io

# 2. Або виконайте команду:
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh ssh whoami

# 3. Розгорніть backend:
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh deploy
```

---

### 📌 Сценарій 2: У Вас Є Bastion Host / Jump Server

**Якщо у вас є інший сервер, який МОЖЕ доступатися до 194.177.1.240:**

```bash
# На bastion сервері:
ssh bastion-server
ngrok tcp 194.177.1.240:6666

# Скопіюйте public URL, наприклад: tcp://1.tcp.ngrok.io:54321

# На Mac — використайте цей URL:
ssh -p 54321 -i ~/.ssh/id_ed25519_dev dima@1.tcp.ngrok.io
```

---

### 📌 Сценарій 3: Локальний Development Setup

**Для тестування без доступу до віддаленого сервера:**

```bash
# 1. Запустіть Docker Compose локально
cd /Users/dima-mac/Documents/Predator_21
docker-compose up -d

# 2. Тестуйте локально
curl -s http://localhost:8090/api/v1/health

# 3. Або створіть локальний ngrok tunnel (для зовнішнього тестування):
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh start localhost 6666
```

---

### 📌 Сценарій 4: VPN (РЕКОМЕНДОВАНО)

**Найбезпечніший варіант — запросіть у адміністратора:**

```bash
# Запросіть VPN credentials
# Підключіться до VPN
openvpn --config ~/vpn-config.ovpn

# Тоді підключіться напряму:
ssh predator-server whoami
```

---

## 🚀 Швидкий Старт (Якщо NGROK Вже Запущений на Сервері)

### Крок 1: Скопіюйте Public URL

Попросіть адміністратора дати вам public URL від ngrok (виглядає так: `tcp://XX.tcp.ngrok.io:XXXXX`)

### Крок 2: Відредагуйте SSH Config

```bash
# Додайте до ~/.ssh/config:
Host predator-ngrok
    HostName <PUBLIC_HOST>      # e.g., 0.tcp.ngrok.io
    Port <PUBLIC_PORT>          # e.g., 12345
    User dima
    IdentityFile ~/.ssh/id_ed25519_dev
```

### Крок 3: SSH до Сервера

```bash
ssh predator-ngrok

# Очікуємо: увійти як користувач dima
dima@nvidia-server:~$
```

### Крок 4: Розгорніть Backend

```bash
# На сервері:
cd /app/predator_21
bash scripts/switch-to-remote.sh
docker-compose -f docker-compose.prod.yml up -d

# Перевірте:
docker-compose ps
curl -s http://localhost:8090/api/v1/health | jq .
```

### Крок 5: На Mac — Налаштуйте Frontend

```bash
# На Mac:
cd /Users/dima-mac/Documents/Predator_21

# Переключіть на remote config
bash scripts/switch-to-remote.sh

# Перевірте на http://localhost:3030
# API має завантажуватися з 194.177.1.240
```

---

## 📦 Використання NGROK Скрипту

### Автоматичне Налаштування (Якщо NGROK Запущений на Bastion)

```bash
# 1. Запустіть ngrok tunnel
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh start 194.177.1.240 6666

# 2. У другому терміналі — перевірте інформацію
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh info

# 3. SSH до сервера
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh ssh whoami

# 4. Розгорніть backend
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh deploy

# 5. Налаштуйте port forwarding (для API)
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh forward 8090 localhost 8090
```

### Детальні Команди

```bash
# Загальна справка
./scripts/ngrok-tunnel.sh help

# Запустити tunnel
./scripts/ngrok-tunnel.sh start [host] [port]
# Приклади:
./scripts/ngrok-tunnel.sh start                          # 194.177.1.240:6666
./scripts/ngrok-tunnel.sh start localhost 6666          # Local testing

# Показати інформацію про активний tunnel
./scripts/ngrok-tunnel.sh info

# SSH команди
./scripts/ngrok-tunnel.sh ssh whoami                     # Execute command
./scripts/ngrok-tunnel.sh ssh                            # Interactive shell

# Copy файлів
./scripts/ngrok-tunnel.sh scp ./file.txt /tmp/file.txt

# Port forwarding
./scripts/ngrok-tunnel.sh forward 8090 localhost 8090    # Forward API port
./scripts/ngrok-tunnel.sh forward 5432 localhost 5432    # Forward Database

# Deploy backend
./scripts/ngrok-tunnel.sh deploy                         # One-command deploy
```

---

## 🔐 NGROK Configuration

**Статус:** ✅ ngrok 3.34.0 встановлений та авторизований

**Конфіг:** `/Users/dima-mac/Library/Application Support/ngrok/ngrok.yml`

**Токен:** ✅ Вже налаштований

### Якщо NGROK Потрібно Перенавантажити

```bash
# Отримайте токен на https://dashboard.ngrok.com

# Авторизуйтеся
ngrok authtoken YOUR_TOKEN

# Перевірте
ngrok config check
```

---

## 📊 Topology (Як Це Працює)

### Варіант 1: Прямий NGROK Туннель

```
Mac (Your Machine)
  ↓ ssh (через ngrok URL)
NGROK Public Gateway (tcp://0.tcp.ngrok.io:12345)
  ↓ tcp tunnel
NVIDIA Server (194.177.1.240:6666)
  → SSH Service (sshd)
  → Docker Services (PostgreSQL, Redis, API, etc.)
```

### Варіант 2: Bastion + NGROK

```
Mac (Your Machine)
  ↓ ssh (через ngrok URL)
NGROK Public Gateway
  ↓ tcp tunnel
Bastion Host (accessible-server.com)
  ↓ local ssh to 194.177.1.240:6666
NVIDIA Server (194.177.1.240:6666)
  → Docker Services
```

### Варіант 3: VPN (Рекомендовано)

```
Mac (Your Machine)
  ↓ OpenVPN/WireGuard
Corporate VPN Gateway
  ↓ (в приватній мережі)
NVIDIA Server (194.177.1.240:6666)
  → SSH Service
  → Docker Services
```

---

## 🛠️ Troubleshooting

### Проблема: `ssh: connect to host ... port ...: Connection refused`

**Причина:** NGROK tunnel вимкнений або неправильний URL

**Рішення:**
```bash
# Перевірте статус tunnel
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh info

# Або запустіть новий tunnel
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh start
```

### Проблема: `Permission denied (publickey)`

**Причина:** Невірний SSH ключ або відсутність ключа на сервері

**Рішення:**
```bash
# Перевірте ключ
ssh-keyscan -p 12345 0.tcp.ngrok.io

# Спробуйте інший ключ
ssh -i ~/.ssh/id_predator_v4 -p 12345 dima@0.tcp.ngrok.io

# Або додайте public key на сервер
ssh-copy-id -i ~/.ssh/id_ed25519_dev -p 12345 dima@0.tcp.ngrok.io
```

### Проблема: `Failed to connect to ngrok API`

**Причина:** ngrok процес не запущений

**Рішення:**
```bash
# Перевірте чи ngrok запущений
ps aux | grep ngrok

# Запустіть ngrok
ngrok tcp 194.177.1.240:6666

# Або через скрипт
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh start
```

---

## 📋 Checklist для Deploy'у

### Перед Deploy'ем

- [ ] Отримайте NGROK public URL від адміністратора або запустіть сам
- [ ] Перевірте SSH доступ: `ssh -p <PORT> dima@<HOST>`
- [ ] Перевірте Docker на сервері: `ssh <HOST> docker ps`
- [ ] Перевірте disk space: `ssh <HOST> df -h`
- [ ] Перевірте PostgreSQL: `ssh <HOST> docker ps | grep postgres`

### Deploy

- [ ] SSH до сервера через NGROK
- [ ] Перейдіть в `/app/predator_21` або клонуйте репозиторій
- [ ] Запустіть: `bash scripts/switch-to-remote.sh`
- [ ] Запустіть: `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Перевірте: `docker-compose ps`
- [ ] Перевірте API: `curl -s http://localhost:8090/api/v1/health`

### Post-Deploy

- [ ] На Mac — переключіть frontend на remote
- [ ] Перевірте на `http://localhost:3030`
- [ ] Логуйтеся в систему
- [ ] Перевірте дані завантажуються з remote API
- [ ] Перевірте моніторинг (Prometheus, Grafana, Loki)

---

## 🚀 One-Liner Deploy

```bash
# Всі кроки в одній команді (якщо NGROK вже запущений):
/Users/dima-mac/Documents/Predator_21/scripts/ngrok-tunnel.sh deploy

# Або вручну з port forwarding:
./scripts/ngrok-tunnel.sh forward 8090 &
./scripts/ngrok-tunnel.sh ssh "cd /app/predator_21 && docker-compose -f docker-compose.prod.yml up -d"
```

---

## 📞 Support

**Якщо щось не працює:**

1. Перевірте логи: `ssh <HOST> docker-compose logs -f`
2. Перевірте порти: `ssh <HOST> netstat -tlnp | grep :8090`
3. Перевірте환경: `ssh <HOST> docker exec core-api env | grep DATABASE`
4. Запросіть у адміністратора: статус сервера, IP адреси, ключі SSH

---

**Готово! Використовуйте NGROK для доступу до NVIDIA сервера без VPN.**

*Generated by GitHub Copilot — Senior Engineer Mode*  
*PREDATOR Analytics v56.1 | Secure Remote Access via NGROK*
