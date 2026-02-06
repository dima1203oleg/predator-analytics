---
description: Повна перевірка статусу системи PREDATOR (Уніфікована)
---
# 🛰️ /system_status: Unified AZR Control

Це глобальний статус-дашборд, що об'єднує контроль за версіями, мовою та інфраструктурою.

// turbo
## 🛠️ Запуск повного аудиту системи
```bash
python3 scripts/azr_system_status.py
```

## 📜 Вторинні перевірки (Remote)
Якщо основний дашборд показує помилки, перевірте віддалений сервер:
```bash
ssh -p 6666 dima@194.177.1.240 "cd ~/predator-analytics && docker compose ps"
```

## 🛡️ Контроль за правилами (Axiom 15)
Перевірити дотримання Python 3.12 та Української мови:
```bash
python3 scripts/azr_constitutional_guard.py
```
