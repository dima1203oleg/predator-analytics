# SSH Setup — Predator Analytics Dev Server

**Мета:** Безпечне безпарольне SSH-підключення до дев‑сервера з інтеграцією VS Code Remote-SSH.

---

## 📋 Параметри підключення (Актуальні: 2025-12-10)

| Параметр | Значення | Опис |
|----------|----------|------|
| `SERVER_IP` | `6.tcp.eu.ngrok.io` | ngrok TCP endpoint |
| `SSH_USER` | `dima` | Ім'я користувача |
| `SSH_PORT` | `19476` | Порт SSH (ngrok) |
| `REMOTE_DIR` | `/home/dima` | Робоча директорія |
| `SSH_KEY` | `~/.ssh/id_ed25519_ngrok` | SSH ключ |

> ⚠️ **Увага:** ngrok endpoint може змінитись після перезапуску сервера. Перевіряйте актуальну адресу в ngrok dashboard або через Telegram бота.

### Швидке підключення
```bash
ssh dev-ngrok
# або напряму:
ssh -i ~/.ssh/id_ed25519_ngrok -p 19476 dima@6.tcp.eu.ngrok.io
```

---

## 🔑 1. Генерація SSH-ключів (на клієнті)

```bash
# Створити ED25519 ключ (рекомендовано)
ssh-keygen -t ed25519 -C "dev@predator-analytics" -f ~/.ssh/id_ed25519_predator

# Або RSA 4096 для сумісності зі старими системами
ssh-keygen -t rsa -b 4096 -C "dev@predator-analytics" -f ~/.ssh/id_rsa_predator
```

---

## 📤 2. Копіювання ключа на сервер

### Метод A: ssh-copy-id (найпростіше)
```bash
ssh-copy-id -i ~/.ssh/id_ed25519_predator.pub -p SSH_PORT SSH_USER@SERVER_IP
```

### Метод B: Ручне копіювання
```bash
cat ~/.ssh/id_ed25519_predator.pub | ssh -p SSH_PORT SSH_USER@SERVER_IP \
  'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

### Метод C: Скрипт (є в репо)
```bash
# Скопіювати скрипт на сервер
scp -P SSH_PORT scripts/add_ssh_pubkey.sh SSH_USER@SERVER_IP:/tmp/

# Запустити на сервері
ssh -p SSH_PORT SSH_USER@SERVER_IP 'bash /tmp/add_ssh_pubkey.sh "$(cat ~/.ssh/id_ed25519_predator.pub)"'
```

---

## ⚙️ 3. Налаштування ~/.ssh/config (клієнт)

Додайте до `~/.ssh/config`:

```ssh-config
Host predator-dev
    HostName SERVER_IP
    User dima
    Port SSH_PORT
    IdentityFile ~/.ssh/id_ed25519_predator
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ForwardAgent no
    
    # Опціонально: проброс портів для dev
    # LocalForward 8000 127.0.0.1:8000
    # LocalForward 5173 127.0.0.1:5173

# Для ngrok (динамічний endpoint)
Host predator-ngrok
    HostName 5.tcp.eu.ngrok.io
    User dima
    Port 14564
    IdentityFile ~/.ssh/id_ed25519_ngrok
    ServerAliveInterval 30
    ConnectTimeout 15
```

Тепер підключення:
```bash
ssh predator-dev
# або
ssh predator-ngrok
```

---

## 🔒 4. Налаштування sshd на сервері (рекомендовано)

**Редагувати `/etc/ssh/sshd_config`:**

```bash
sudo nano /etc/ssh/sshd_config
```

Рекомендовані налаштування:
```
Port 22
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
MaxAuthTries 3
ClientAliveInterval 120
ClientAliveCountMax 3
```

**Перезапуск (після перевірки ключа в іншому терміналі!):**
```bash
sudo systemctl restart sshd
```

---

## 🛡️ 5. Firewall (UFW)

```bash
# Дозволити SSH порт
sudo ufw allow 22/tcp
# або для нестандартного порту
sudo ufw allow 2222/tcp

sudo ufw enable
sudo ufw status
```

---

## 🦊 6. Fail2ban (захист від brute-force)

```bash
sudo apt update
sudo apt install fail2ban -y
sudo systemctl enable --now fail2ban

# Перевірка статусу
sudo fail2ban-client status sshd
```

---

## 💻 7. VS Code Remote-SSH

1. Встановіть розширення: `Remote - SSH`
2. `Cmd+Shift+P` → `Remote-SSH: Connect to Host...`
3. Виберіть `predator-dev` або введіть `ssh predator-dev`
4. Відкрийте папку: `/home/dima/predator_v22`

### Проброс портів у VS Code:
- Remote Explorer → Forward a Port
- Або автоматично через `ports` в налаштуваннях

---

## ✅ Чеклист перевірки

- [ ] Клієнт підключається: `ssh predator-dev` без пароля
- [ ] Робоча директорія доступна: `ls /home/dima/predator_v22`
- [ ] sshd конфіг застосовано: `PasswordAuthentication no`
- [ ] Firewall дозволяє SSH порт
- [ ] VS Code підключається через Remote-SSH
- [ ] (Опціонально) Порти 8000, 5173 проброшені

---

## 🚨 Ревокація ключа (швидке відключення доступу)

```bash
# На сервері: видалити конкретний ключ
grep -v "key-comment-or-fingerprint" ~/.ssh/authorized_keys > ~/.ssh/authorized_keys.tmp
mv ~/.ssh/authorized_keys.tmp ~/.ssh/authorized_keys

# Або видалити всі ключі
rm ~/.ssh/authorized_keys
```

---

## 📞 Діагностика

```bash
# Перевірка доступності порту
nc -zv SERVER_IP SSH_PORT

# Детальний debug SSH
ssh -vvv predator-dev

# Перевірка sshd на сервері
sudo systemctl status sshd
sudo journalctl -u sshd -f
```

---

## 🔗 Пов'язані файли

- `scripts/add_ssh_pubkey.sh` — скрипт для безпечного додавання ключа
- `scripts/sshd_config_sample.conf` — зразок sshd конфігу
- `scripts/server-connect.sh` — швидке підключення до сервера
- `docs/remote-access-ngrok.md` — налаштування ngrok тунелю

---

*Останнє оновлення: 2025-12-10*
