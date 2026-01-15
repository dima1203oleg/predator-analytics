---
description: Автоматична перевірка структурованих логів (JSON) та метрик OODA
---

Цей воркфлоу перевіряє, чи правильно сервіси генерують структуровані логи після міграції.

// turbo
1. Підключитися до сервера та перевірити останні 100 рядків логів backend:
```bash
./scripts/server-connect.sh "docker logs predator_backend --tail 100"
```

2. Перевірити наявність JSON структури та обов'язкових полів (request_id, event):
```bash
./scripts/server-connect.sh "docker logs predator_backend --tail 100 | grep '\"event\":' | head -n 5"
```

3. Перевірити логи Celery воркерів на наявність RequestLogger метрик:
```bash
./scripts/server-connect.sh "docker logs predator_celery_worker --tail 100 | grep 'duration_ms'"
```

4. Виконати тестовий запис бізнес-події через CLI (якщо доступно):
```bash
./scripts/server-connect.sh "docker exec predator_backend python3 -c 'from libs.core.structured_logger import get_logger, log_business_event; logger=get_logger(\"test\"); log_business_event(logger, \"manual_verify_event\", status=\"ok\")'"
```

5. Звітувати про статус обсервабільності (Observability Health Check).
