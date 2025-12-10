# Cloudflare Tunnel Setup — Predator Analytics

**Альтернатива ngrok без лімітів трафіку**

---

## Переваги Cloudflare Tunnel

| Параметр | ngrok (Free) | Cloudflare Tunnel |
|----------|--------------|-------------------|
| **Трафік** | 1GB/місяць | ∞ Безлімітний |
| **Ціна** | Безкоштовно | Безкоштовно |
| **SSH** | ✅ | ✅ |
| **HTTP** | ✅ | ✅ |
| **Стабільність URL** | Змінюється | Постійний |

---

## Крок 1: Реєстрація Cloudflare

1. Зареєструйтесь на [cloudflare.com](https://cloudflare.com)
2. Додайте домен (або використайте безкоштовний `.cfargotunnel.com`)

---

## Крок 2: Встановлення cloudflared на сервері

```bash
# Ubuntu/Debian
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Або через apt
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared jammy main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install cloudflared
```

---

## Крок 3: Авторизація cloudflared

```bash
cloudflared tunnel login
```

Це відкриє браузер для авторизації. Виберіть зону (домен).

---

## Крок 4: Створення тунелю

```bash
# Створити тунель
cloudflared tunnel create predator-ssh

# Отримаєте UUID тунелю, наприклад: a1b2c3d4-e5f6-...
```

---

## Крок 5: Конфігурація тунелю

Створіть файл `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /home/dima/.cloudflared/<TUNNEL_UUID>.json

ingress:
  # SSH доступ
  - hostname: ssh.predator.example.com
    service: ssh://localhost:22
  
  # HTTP backend (опціонально)
  - hostname: api.predator.example.com
    service: http://localhost:8000
  
  # HTTP frontend (опціонально)
  - hostname: app.predator.example.com
    service: http://localhost:5173
  
  # Catch-all
  - service: http_status:404
```

---

## Крок 6: Додавання DNS записів

```bash
# Для кожного hostname
cloudflared tunnel route dns predator-ssh ssh.predator.example.com
cloudflared tunnel route dns predator-ssh api.predator.example.com
```

---

## Крок 7: Запуск тунелю

```bash
# Вручну
cloudflared tunnel run predator-ssh

# Або як systemd сервіс (рекомендовано)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Крок 8: Підключення з клієнта (SSH)

### Варіант A: Через cloudflared на клієнті

```bash
# Встановити cloudflared на Mac
brew install cloudflared

# Підключення
cloudflared access ssh --hostname ssh.predator.example.com
```

### Варіант B: Через ProxyCommand в SSH config

Додайте до `~/.ssh/config`:

```ssh-config
Host predator-cf
    HostName ssh.predator.example.com
    User dima
    ProxyCommand cloudflared access ssh --hostname %h
    IdentityFile ~/.ssh/id_ed25519_ngrok
```

Тепер: `ssh predator-cf`

---

## Крок 9: VS Code Remote-SSH

З налаштованим `~/.ssh/config`:

1. `Cmd+Shift+P` → `Remote-SSH: Connect to Host...`
2. Виберіть `predator-cf`
3. Відкрийте `/home/dima/predator_v22`

---

## Швидкий старт (скрипт для сервера)

```bash
#!/bin/bash
# install_cloudflare_tunnel.sh

# Встановлення
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Авторизація (відкриє браузер)
cloudflared tunnel login

# Створення тунелю
cloudflared tunnel create predator-ssh

echo "✅ Cloudflare Tunnel створено!"
echo "Налаштуйте ~/.cloudflared/config.yml і запустіть:"
echo "cloudflared tunnel run predator-ssh"
```

---

## Порівняння команд

| Дія | ngrok | Cloudflare Tunnel |
|-----|-------|-------------------|
| Запуск SSH тунелю | `ngrok tcp 22` | `cloudflared tunnel run predator-ssh` |
| Підключення SSH | `ssh -p PORT user@X.tcp.eu.ngrok.io` | `ssh predator-cf` |
| Сервіс systemd | `ngrok-ssh.service` | `cloudflared.service` |

---

*Дата оновлення: 2025-12-11*
