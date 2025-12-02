# Cloudflared + Cloudflare Access — рекомендовано для production

Cloudflared дає стабільний hostname та можливість контролю доступу через Cloudflare Zero Trust (Access). Переваги: MFA, політики доступу, надійність і приватні routing.

Кроки (сервер)
1. Встановіть `cloudflared` (скрипт `scripts/setup_cloudflared_server.sh` підготує двійник і systemd unit).
2. Створіть тунель: `cloudflared tunnel create <NAME>` — це видасть uuid та файл credentials.
3. Прив’яжіть DNS: `cloudflared tunnel route dns <NAME> ssh.example.com`.
4. Оновіть `/etc/cloudflared/config.yml` (файл створює скрипт) та перезапустіть `systemctl restart cloudflared`.

Примітка: перед запуском серверного скрипта зробіть його виконуваним:

```bash
chmod +x scripts/setup_cloudflared_server.sh
sudo ./scripts/setup_cloudflared_server.sh
```

Якщо ви на macOS, `systemctl` відсутній — після створення тунелю використовуйте `brew services start cloudflared` або запуск вручну `cloudflared tunnel run <NAME>`.

Кроки (клієнт)
1. На клієнті виконайте `cloudflared login` — відкриється браузер для авторизації.
2. Додайте до `~/.ssh/config` ProxyCommand (замінивши шлях до `cloudflared`, якщо він відрізняється):
```text
ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

Поради з безпеки
- Пов'язуйте Access Application з потрібною email allow-list або group, увімкніть MFA.
- Дотримуйтесь least-privilege для користувачів на сервері.

Додаткова діагностика
- Перевірка сервісу (Linux): `sudo systemctl status cloudflared`.
- На macOS перевірте: `brew services list` або `ps aux | grep cloudflared`.
- Іnfo тунелю: `cloudflared tunnel info <NAME>`.
