# 🚀 NGROK Deploy Action Plan — PREDATOR v56.1

**Status:** ✅ Готово до Deploy'у  
**Date:** 30 березня 2026  
**Your IP:** 185.130.54.65  
**NVIDIA Server:** 194.177.1.240:6666 (user: dima)

---

## ✅ Що Вже Підготовлено

### Скрипти & Утиліти
- ✅ `scripts/ngrok-tunnel.sh` — універсальний NGROK manager
- ✅ `scripts/ngrok-setup-guide.sh` — гайдлайн для налаштування
- ✅ Shell aliases для швидкого доступу (predator-ngrok-*)
- ✅ `NGROK_SETUP_GUIDE.md` — детальна документація

### Конфігурації
- ✅ `services/core-api/.env.remote` — backend config для 194.177.1.240
- ✅ `apps/predator-analytics-ui/.env.remote` — frontend config
- ✅ `scripts/switch-to-remote.sh` — автоматична конфіг на сервері
- ✅ SSH keys наявні: `~/.ssh/id_ed25519_dev`, `~/.ssh/id_predator_v4`
- ✅ `~/.ssh/config` містить 3 aliases для NVIDIA сервера

### Frontend
- ✅ Запущений на `http://localhost:3030` (Vite)
- ✅ Налаштований для динамічного вибору API (local/remote)
- ✅ Готов до підключення до remote backend

---

## 🎯 Як Це Працює

### Архітектура

```
Your Mac (185.130.54.65)
        ↓
   NGROK Public Tunnel
   (tcp://0.tcp.ngrok.io:xxxxx)
        ↓
   NVIDIA Server (194.177.1.240)
   - SSH Service (port 6666)
   - Docker Services:
     - PostgreSQL (5432)
     - Redis (6379)
     - Neo4j (7687)
     - OpenSearch (9200)
     - Core API (8090)
     - Etc.
```

---

## 📋 Setup Steps (В Залежності від Сценарію)

### Сценарій A: Адміністратор Запустив NGROK на Сервері (НАЙПРОСТІШИЙ)

**1. Отримайте Public URL від адміністратора**
```
TCP Public URL: tcp://0.tcp.ngrok.io:12345
```

**2. Налаштуйте SSH Config**
```bash
# Додайте до ~/.ssh/config:
Host predator-ngrok
    HostName 0.tcp.ngrok.io
    Port 12345
    User dima
    IdentityFile ~/.ssh/id_ed25519_dev
```

**3. Перевірте SSH доступ**
```bash
ssh predator-ngrok whoami
# Очікується: dima
```

**4. Розгорніть Backend (на сервері)**
```bash
ssh predator-ngrok << 'CMD'
  cd /app/predator_21
  bash scripts/switch-to-remote.sh
  docker-compose -f docker-compose.prod.yml up -d
  docker-compose ps
CMD
```

**5. На Mac — Переключіть Frontend**
```bash
cd /Users/dima-mac/Documents/Predator_21
bash scripts/switch-to-remote.sh

# Перевірте на http://localhost:3030
```

---

### Сценарій B: У Вас Є Bastion Host (Промежуточний)

**1. На Bastion Сервері — Запустіть NGROK**
```bash
ssh bastion-server
ngrok tcp 194.177.1.240:6666

# Скопіюйте public URL
# Наприклад: tcp://1.tcp.ngrok.io:54321
```

**2. На Mac — Підключіться**
```bash
ssh -p 54321 -i ~/.ssh/id_ed25519_dev dima@1.tcp.ngrok.io

# Або через alias:
Host predator-ngrok
    HostName 1.tcp.ngrok.io
    Port 54321
    User dima
    IdentityFile ~/.ssh/id_ed25519_dev
```

**3. Розгорніть Backend**
```bash
ssh predator-ngrok << 'CMD'
  cd /app/predator_21
  bash scripts/switch-to-remote.sh
  docker-compose -f docker-compose.prod.yml up -d
CMD
```

---

### Сценарій C: Локальний Development (Без Remote)

**1. Запустіть Docker Compose Локально**
```bash
cd /Users/dima-mac/Documents/Predator_21
docker-compose up -d

# Перевірте
curl -s http://localhost:8090/api/v1/health
```

**2. Frontend Автоматично Підключиться Локально**
```
http://localhost:3030
→ http://localhost:8090/api/v1 (автоматично)
```

---

## ⚡ Quick Commands (Після Setup'у)

```bash
# 1. SSH до NVIDIA сервера через NGROK
ssh predator-ngrok

# 2. Виконати команду на сервері
ssh predator-ngrok docker ps

# 3. Переглядати логи API
ssh predator-ngrok docker-compose logs -f core-api

# 4. Перевірити health check
ssh predator-ngrok curl -s http://localhost:8090/api/v1/health | jq .

# 5. Copy файлів на сервер
scp -P 12345 ./file.txt dima@0.tcp.ngrok.io:/tmp/

# 6. Port forwarding (для локального доступу до API)
ssh -p 12345 -i ~/.ssh/id_ed25519_dev -L 8090:localhost:8090 dima@0.tcp.ngrok.io

# Потім на Mac:
curl -s http://localhost:8090/api/v1/health
```

---

## 🔐 Security Best Practices

### 1. NGROK Токен

```bash
# Перевірте що NGROK авторизований
ngrok config check

# Якщо потрібно:
ngrok authtoken YOUR_TOKEN_FROM_DASHBOARD
```

### 2. SSH Keys

```bash
# Перевірте права доступу
chmod 600 ~/.ssh/id_ed25519_dev
chmod 600 ~/.ssh/id_predator_v4
chmod 644 ~/.ssh/config

# Переведіть публічний ключ на сервер
ssh-copy-id -i ~/.ssh/id_ed25519_dev -p 12345 dima@0.tcp.ngrok.io
```

### 3. NGROK URL Безпека

- ✅ NGROK генерує випадкові URL (важко угадати)
- ✅ Більшість brute-force атак блокуються NGROK
- ✅ SSH key auth (не password) — більш безпечно

### 4. Network Segmentation

```bash
# На NVIDIA сервері — обмежте вихідні з'єднання
ssh predator-ngrok << 'CMD'
  sudo ufw allow from any to any port 6666
  sudo ufw default deny outgoing
  sudo ufw allow out to any port 53  # DNS
  sudo ufw allow out to any port 80  # HTTP
  sudo ufw allow out to any port 443 # HTTPS
CMD
```

---

## 📊 Monitoring & Debugging

### NGROK Dashboard

```bash
# Переглядати трафік через NGROK
open http://localhost:4040

# Або API
curl -s http://localhost:4040/api/tunnels | jq .
```

### Логи

```bash
# Backend логи
ssh predator-ngrok docker-compose logs -f

# API логи
ssh predator-ngrok docker-compose logs -f core-api --tail=50

# Database логи
ssh predator-ngrok docker-compose logs -f postgres

# NGROK на сервері
ssh predator-ngrok ps aux | grep ngrok
```

### Performance

```bash
# Перевірте CPU/Memory на сервері
ssh predator-ngrok free -h && df -h

# NGROK bandwidth
ssh predator-ngrok iftop  # якщо встановлено

# Перевірте latency
ssh predator-ngrok ping -c 5 8.8.8.8
```

---

## 🚨 Troubleshooting

### Проблема: SSH Connection Refused

```bash
# Перевірте NGROK статус
curl -s http://localhost:4040/api/tunnels | jq .

# Перезапустіть NGROK на сервері (або на bastion)
ssh bastion-server
pkill ngrok
ngrok tcp 194.177.1.240:6666  # або localhost:6666
```

### Проблема: Permission Denied (publickey)

```bash
# Перевірте SSH ключ на сервері
ssh predator-ngrok "cat ~/.ssh/authorized_keys"

# Додайте ключ якщо не там
ssh predator-ngrok "echo '$(cat ~/.ssh/id_ed25519_dev.pub)' >> ~/.ssh/authorized_keys"
```

### Проблема: Docker Services Not Running

```bash
# Перевірте контейнери
ssh predator-ngrok docker ps

# Запустіть їх
ssh predator-ngrok docker-compose -f docker-compose.prod.yml up -d

# Перевірте логи
ssh predator-ngrok docker-compose logs postgres | head -50
```

### Проблема: API Not Responding

```bash
# Перевірте port
ssh predator-ngrok netstat -tlnp | grep 8090

# Перевірте env vars
ssh predator-ngrok cat services/core-api/.env | head -10

# Перезапустіть API
ssh predator-ngrok docker-compose restart core-api
```

---

## ✅ Verification Checklist (Post-Deploy)

### Network & SSH
- [ ] `ssh predator-ngrok whoami` → `dima`
- [ ] `ssh predator-ngrok uname -a` → Linux output
- [ ] `ssh predator-ngrok docker --version` → Docker version

### Services
- [ ] `ssh predator-ngrok docker-compose ps` → All services running
- [ ] `ssh predator-ngrok docker-compose logs postgres | grep "ready"` → DB ready
- [ ] `ssh predator-ngrok docker-compose logs redis | grep "Ready"` → Redis ready

### API & Database
- [ ] `ssh predator-ngrok curl -s http://localhost:8090/api/v1/health` → 200 OK
- [ ] `ssh predator-ngrok curl -s http://localhost:8090/api/v1/config` → JSON
- [ ] `ssh predator-ngrok psql -U predator -d predator_analytics -c "SELECT version()"` → PostgreSQL version

### Frontend
- [ ] Open `http://localhost:3030` → React app loads
- [ ] Login → Works
- [ ] Data loads → Shows remote data
- [ ] Network tab → Requests go to `194.177.1.240:8090`

---

## 🎯 Next Actions (In Order)

### IMMEDIATELY

1. [ ] **Отримайте NGROK Public URL** від адміністратора
   - Або запустіть NGROK сам: `ngrok tcp 194.177.1.240:6666`
   - Або використайте bastion host

2. [ ] **Налаштуйте SSH Config** з отриманим URL
   ```bash
   cat >> ~/.ssh/config << 'EOF'
   Host predator-ngrok
       HostName <PUBLIC_HOST>
       Port <PUBLIC_PORT>
       User dima
       IdentityFile ~/.ssh/id_ed25519_dev
   EOF
   ```

3. [ ] **Перевірте SSH доступ**
   ```bash
   ssh predator-ngrok whoami
   ```

### WITHIN 5 MINUTES

4. [ ] **Розгорніть Backend**
   ```bash
   ssh predator-ngrok << 'CMD'
     cd /app/predator_21
     bash scripts/switch-to-remote.sh
     docker-compose -f docker-compose.prod.yml up -d
   CMD
   ```

5. [ ] **Переключіть Frontend**
   ```bash
   cd /Users/dima-mac/Documents/Predator_21
   bash scripts/switch-to-remote.sh
   ```

### FINAL VERIFICATION

6. [ ] **Перевірте API**
   ```bash
   curl -s http://194.177.1.240:8090/api/v1/health | jq .
   ```

7. [ ] **Перевірте Frontend**
   - Open `http://localhost:3030`
   - Логуйтеся
   - Перевірте дані завантажуються

---

## 📞 Contact Information

**If stuck, contact:**

1. **NVIDIA Server Admin**
   - Ask for: NGROK public URL OR bastion host access
   - Or: Whitelist IP 185.130.54.65 for port 6666

2. **Bastion Host Admin** (if using option B)
   - Ask them to run: `ngrok tcp 194.177.1.240:6666`
   - Get public URL from them

3. **GitHub Copilot**
   - Available for debugging
   - Run: `ssh predator-ngrok docker-compose logs` and share output

---

## 🏁 Timeline Estimate

| Activity | Time | Notes |
|----------|------|-------|
| Get NGROK URL | 5 min | From admin or run yourself |
| Setup SSH Config | 1 min | Copy-paste 4 lines |
| Verify SSH Access | 1 min | `ssh predator-ngrok whoami` |
| Deploy Backend | 5-10 min | `docker-compose up -d` |
| Verify Services | 3 min | `docker-compose ps` |
| Switch Frontend Config | 1 min | `bash scripts/switch-to-remote.sh` |
| Test Everything | 5 min | Login and check data load |
| **TOTAL** | **~20-30 min** | All automated, just follow steps |

---

**🎉 Ready to Deploy! Follow the steps above and you'll have full remote access in minutes.**

*Generated by GitHub Copilot — Senior Engineer Mode*  
*PREDATOR Analytics v56.1 | NGROK Secure Tunneling*
