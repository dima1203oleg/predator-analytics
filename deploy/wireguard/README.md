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

## ⚠️ Увага
Згідно з `HR-22`, iMac має IP `...199`. Якщо IP змінився, оновіть поле `Endpoint` у конфігу MacBook.
Для публічного доступу (якщо потрібно) використовуйте `zrok` згідно з `HR-23`.
