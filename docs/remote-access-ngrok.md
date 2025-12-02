# Доступ до сервера через ngrok (SSH TCP тунель)

Цей документ пояснює, як швидко налаштувати ngrok, щоб підключатися до сервера (ssh) з іншого комп'ютера.

Коротко:
- ngrok дає тимчасовий TCP endpoint у форматі 0.tcp.<region>.ngrok.io:PORT
- Використовуйте ngrok для швидкого тестового доступу або відлагодження.
- Для сталих адрес потрібно платний план (reserved TCP address).

Сценарій (сервер)
1. Зареєструйтесь на ngrok.com і отримаєте authtoken.
2. На сервері встановіть ngrok (див. `scripts/setup_ngrok_server.sh`) і додайте authtoken.

Примітка: замініть <NGROK_AUTHTOKEN> на ваш токен **без** кутових дужок — наприклад:

```bash
# НЕ використовуйте < > в команді — підставте значення токена без дужок
ngrok config add-authtoken 1a2b3c4d5e6f7g8h9i0j
ngrok tcp 22
```

3. У виводі ви побачите адресу на кшталт: 0.tcp.eu.ngrok.io:XXXXX — використайте її з клієнта.

Автоматизація

- Ми додали скрипт `scripts/setup_ngrok_server.sh`. Перед виконанням зробіть скрипти виконуваними:

```bash
chmod +x scripts/setup_ngrok_server.sh
chmod +x scripts/setup_ngrok_client.sh
```

Потім на сервері (Linux) запустіть з sudo і передайте ваш токен:

```bash
sudo ./scripts/setup_ngrok_server.sh 1a2b3c4d5e6f7g8h9i0j
```

На macOS скрипт вкаже, що systemd відсутній — використайте `brew services start ngrok` або `ngrok tcp 22` вручну для тимчасового тунелю.

Сервер (systemd)
- Скрипт створить systemd-сервіс `/etc/systemd/system/ngrok-ssh.service` щоб автоматично стартувати тунель.

Клієнт
- Використайте `scripts/setup_ngrok_client.sh` для прикладу `~/.ssh/config` або просто запустіть:

```bash
ssh superuser@0.tcp.eu.ngrok.io -p <PORT>
```

Діагностика
- На сервері: `sudo systemctl status ngrok-ssh.service` та `sudo journalctl -u ngrok-ssh -f`.
- На клієнті: `ssh -vvv superuser@0.tcp.eu.ngrok.io -p <PORT>` або `nc -vz 0.tcp.eu.ngrok.io <PORT>`.

Безпека
- Використовуйте SSH-ключі замість паролів.
- Для продакшн-рішень розгляньте cloudflared + Cloudflare Access.
