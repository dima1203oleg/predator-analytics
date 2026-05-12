# 🛡️ PREDATOR WireGuard Tunnel Setup

Ця директорія містить конфігурації для захищеного тунелю між MacBook (Developer) та iMac (Compute Node).

## 📋 Файли
1. `PREDATOR_MACBOOK.conf` — Імпортуйте цей файл у додаток WireGuard на MacBook.
2. `PREDATOR_IMAC.conf` — Встановіть цей конфіг на iMac (`/etc/wireguard/wg0.conf`).

## 🚀 Інструкція
1. Відкрийте **WireGuard** на MacBook.
2. Натисніть **"Import tunnel(s) from file"** та оберіть `PREDATOR_MACBOOK.conf`.
3. Натисніть **Activate**.
4. На iMac виконайте: `sudo wg-quick up wg0`.

## 🌐 Публічний доступ (різні мережі)

iMac має статичний публічний IP `178.214.200.25`. Щоб тунель працював навіть коли MacBook та iMac **не в одній локальній мережі**, виконайте на роутері iMac:

1. **Port Forwarding** — пробросьте порт `51820/UDP` на внутрішній IP iMac (`192.168.0.199`).
2. **DMZ (опціонально)** — або вкажіть iMac як DMZ-хост.
3. **Firewall** — переконайтеся, що UDP `51820` відкритий для зовнішніх з'єднань.

У `PREDATOR_MACBOOK.conf` поле `Endpoint` вже вказано на статичний IP iMac (`178.214.200.25:51820`), а `PersistentKeepalive = 25` підтримує з'єднання через NAT.

## ⚠️ Увага
- Згідно з `HR-22`, iMac має внутрішній IP `192.168.0.199`. При зміні внутрішнього IP оновіть правила port forwarding на роутері.
- Якщо статичний публічний IP зміниться, оновіть поле `Endpoint` у `PREDATOR_MACBOOK.conf`.
- Для резервного/альтернативного доступу використовуйте `zrok` згідно з `HR-23`.
