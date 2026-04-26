# 🌐 Predator Analytics Web Interface - Інструкція з Доступу

**Дата:** 2025-12-20
**Статус:** ✅ Веб інтерфейс працює

---

## 📊 Статус Сервісів

| Сервіс | Порт | Статус | Час роботи |
|--------|------|--------|------------|
| **Frontend** | 8092 | ✅ Працює | 9 годин |
| **Backend** | 8090 | ✅ Healthy | 2 години |
| OpenSearch | 9200 | ✅ Працює | 11 годин |
| Grafana | 3001 | ✅ Працює | 3 дні |
| MLflow | 5001 | ✅ Працює | 2 дні |

---

## 🔗 Варіанти Доступу

### Варіант 1: Прямий Доступ через Статичний IP (Рекомендований)

**Frontend (React UI):**
```
http://194.177.1.240:8092
```

**Backend API:**
```
http://194.177.1.240:8090
```

**Документація API:**
```
http://194.177.1.240:8090/docs
```

### Варіант 2: SSH Тунель (якщо доступ заблоковано провайдером)

#### З Mac/Linux:
```bash
# Frontend тунель
ssh -L 8092:localhost:8092 -p 6666 dima@194.177.1.240

# Потім відкрийте:
http://localhost:8092
```

#### З Windows (PowerShell):
```powershell
ssh -L 8092:localhost:8092 -P 6666 dima@194.177.1.240
```

#### Багато сервісів одночасно:
```bash
ssh -L 8092:localhost:8092 \
    -L 8090:localhost:8090 \
    -L 3001:localhost:3001 \
    -L 5001:localhost:5001 \
    -p 6666 dima@194.177.1.240
```

Потім доступ:
- Frontend: `http://localhost:8092`
- Backend: `http://localhost:8090`
- Grafana: `http://localhost:3001`
- MLflow: `http://localhost:5001`

### Варіант 3: Ngrok (для тимчасового публічного доступу)

На сервері:
```bash
# Встановлення ngrok (якщо немає)
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Запуск тунелю для frontend
ngrok http 8092
```

Отримаєте URL типу: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`

---

## 🔒 Перевірка Доступності

### На сервері (має працювати ✅):
```bash
curl http://localhost:8092
```

### З іншого комп'ютера в локальній мережі:
```bash
curl http://192.168.1.106:8092
```

### З інтернету:
```bash
curl http://194.177.1.240:8092
```

---

## 🛠️ Якщо Не Працює

### 1. Перевірка Firewall на Сервері

```bash
# Перевірка статусу
sudo ufw status

# Якщо порт 8092 не відкритий, додайте:
sudo ufw allow 8092/tcp
sudo ufw reload
```

### 2. Перевірка Docker Контейнерів

```bash
cd ~/predator-analytics
docker compose ps

# Якщо не працює, перезапустіть:
docker compose restart frontend backend
```

### 3. Перевірка Логів

```bash
# Frontend логи
docker compose logs -f --tail=100 frontend

# Backend логи
docker compose logs -f --tail=100 backend
```

### 4. Перевірка Bindings

```bash
# Має показати 0.0.0.0:8092
sudo netstat -tulpn | grep 8092
```

---

## 🌍 Налаштування Зовнішнього Доступу

### Можливі Причини Блокування:

1. **Провайдер блокує порти** - рішення: SSH тунель або ngrok
2. **NAT/Router** - потрібен port forwarding на роутері
3. **Firewall провайдера** - зв'яжіться з провайдером для відкриття портів

### Рекомендоване Рішення для Production:

#### Варіант A: Nginx Reverse Proxy з HTTPS

```bash
# На сервері встановіть Nginx (якщо немає)
sudo apt install nginx certbot python3-certbot-nginx

# Конфігурація Nginx для Predator
sudo nano /etc/nginx/sites-available/predator

# Додайте:
server {
    listen 80;
    server_name predator.yourdomain.com;  # або просто IP

    location / {
        proxy_pass http://localhost:8092;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8090/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Активуйте конфіг
sudo ln -s /etc/nginx/sites-available/predator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Тепер доступ: http://194.177.1.240 (без порту)
```

#### Варіант B: zrok Tunnel (Основний стандарт v61.0)

zrok — це open-source альтернатива ngrok, побудована на OpenZiti. Вона забезпечує більш стабільні та швидкі тунелі.

```bash
# Встановлення zrok
curl -sSLf https://get.openziti.io/install.bash | sudo bash -s zrok

# Реєстрація (якщо немає акаунта)
zrok invite

# Активація середовища (токен з пошти)
zrok enable <your-token>

# Запуск тунелю для frontend
zrok share public http://localhost:8092 --headless
```

Для статичних тунелів використовуйте:
`zrok reserve public http://localhost:8092`
`zrok share reserved <share_token>`

---

## 📱 Доступ з Мобільного

Якщо ви в локальній мережі:
```
http://192.168.1.106:8092
```

Якщо через інтернет (SSH тунель на Mac):
1. Створіть тунель на Mac
2. На iPhone/Android підключіться до Mac через SSH або використовуйте ngrok

---

## 🔐 Безпека

### Рекомендації:

1. **Не використовуйте відкритий доступ без аутентифікації** в production
2. **Налаштуйте HTTPS** через Nginx + Let's Encrypt
3. **Обмежте доступ за IP** в ufw/iptables
4. **Використовуйте VPN** для доступу до внутрішньої мережі

### Приклад обмеження за IP:

```bash
# Дозволити доступ тільки з вашого IP
sudo ufw delete allow 8092/tcp
sudo ufw allow from YOUR_IP_ADDRESS to any port 8092
```

---

## 🚀 Швидкий Старт для Команди

### Для розробників (SSH доступ):
```bash
# 1. Підключення
ssh -L 8092:localhost:8092 -p 6666 dima@194.177.1.240

# 2. Відкрийте браузер
http://localhost:8092
```

### Для менеджерів/демо (Ngrok):
```bash
# На сервері (одноразово)
ngrok http 8092

# Надішліть їм URL: https://xxxx.ngrok-free.app
```

---

## ✅ Checklist Доступу

- [ ] Firewall відкритий (8092/tcp) ✅
- [ ] Docker контейнери працюють ✅
- [ ] Локальний доступ працює ✅
- [ ] Ngrok/SSH тунель налаштований (для зовнішнього доступу)
- [ ] HTTPS налаштовано (опціонально)
- [ ] Аутентифікація налаштована (опціонально)

---

## 💡 Поточна Рекомендація

**Для швидкого доступу ЗАРАЗ:**

1. **З вашого Mac створіть SSH тунель:**
   ```bash
   ssh -L 8092:localhost:8092 -p 6666 dima@194.177.1.240
   ```

2. **Відкрийте в браузері:**
   ```
   http://localhost:8092
   ```

3. **З іншого комп'ютера в локальній мережі:**
   ```
   http://192.168.1.106:8092
   ```

**Для постійного публічного доступу:**
- Налаштуйте Nginx reverse proxy (порт 80/443)
- Або використовуйте zrok Tunnel (основний стандарт v61.0)

---

**Оновлено:** 2025-12-20 11:50
**Статус:** ✅ Працює (через SSH тунель або локальну мережу)
