 # 📋 PREDATOR ANALYTICS - BACKLOG ЗАДАЧ ДЛЯ ІМПЛЕМЕНТАЦІЇ
## Production Readiness Checklist

**Версія:** 1.0.0
**Дата:** 2025-12-16
**Пріоритет:** P0 = критичний, P1 = високий, P2 = середній, P3 = низький

---

## 🔴 P0 - КРИТИЧНІ (Блокери production)

### TASK-001: Консолідація Telegram Bot файлів
**Статус:** ✅ DONE
**Оцінка:** 4 години

**Проблема:**
Існує 5+ дублюючих файлів Telegram бота:
- `apps/backend/app/services/telegram_assistant.py` (110KB) ❌
- `apps/backend/app/services/telegram_executor.py` (51KB) ❌
- `apps/backend/app/services/telegram_menu.py` (23KB) ❌
- `apps/backend/app/services/telegram_advanced.py` (16KB) ❌
- `apps/self-improve-orchestrator/agents/telegram_bot.py` (56KB) ✅ ОСНОВНИЙ

**Рішення:**
1. Залишити тільки `apps/self-improve-orchestrator/agents/telegram_bot.py`
2. Видалити дублі в `apps/backend/app/services/telegram_*`
3. Оновити імпорти

**Файли для редагування:**
```
DELETE: apps/backend/app/services/telegram_assistant.py
DELETE: apps/backend/app/services/telegram_executor.py
DELETE: apps/backend/app/services/telegram_menu.py
DELETE: apps/backend/app/services/telegram_advanced.py
```

---

### TASK-002: Виправити API ключі
**Статус:** ✅ DONE
**Оцінка:** 1 година

**Проблема:**
- Gemini API повертає 404
- Groq API повертає 401
- Потрібна ротація ключів

**Рішення:**
1. Отримати нові API ключі:
   - Gemini: https://aistudio.google.com/app/apikey
   - Groq: https://console.groq.com/keys
2. Оновити `.env` на сервері
3. Рестартнути контейнери

**Команди:**
```bash
ssh predator-server
nano ~/predator-analytics/.env
# Update GEMINI_API_KEY and GROQ_API_KEY
docker compose restart orchestrator telegram_controller
```

---

### TASK-003: Виправити PostgreSQL DSN для Celery
**Статус:** ✅ DONE
**Оцінка:** 30 хвилин

**Проблема:**
Celery використовує `postgresql+asyncpg://` URL, що несумісний з синхронним драйвером.

**Рішення:**
```yaml
# docker-compose.yml - celery_worker service
environment:
  - DATABASE_URL=postgresql://predator:predator_password@postgres:5432/predator_db
  # НЕ postgresql+asyncpg://
```

**Файли для редагування:**
- `docker-compose.yml` (рядки 119, 139)

---

### TASK-004: Запустити Prometheus
**Статус:** ✅ DONE
**Оцінка:** 30 хвилин

**Проблема:**
Контейнер `predator_prometheus` створено, але не запущено.

**Рішення:**
1. Перевірити конфігурацію `infra/prometheus/prometheus.yml`
2. Запустити сервіс
3. Переконатися що scrape endpoints доступні

**Команди:**
```bash
docker compose up -d prometheus
docker logs predator_prometheus
curl http://localhost:9092/targets
```

---

## 🟠 P1 - ВИСОКИЙ ПРІОРИТЕТ

### TASK-005: Оновити Frontend версію
**Статус:** 🔄 TODO
**Оцінка:** 30 хвилин

**Проблема:**
Frontend title показує `v20.0` замість `v22.0`

**Рішення:**
```typescript
// apps/frontend/src/App.tsx
// Знайти і замінити версію

// apps/frontend/index.html
<title>Predator Analytics v22.0</title>

// apps/frontend/package.json
"version": "22.0.0"
```

---

### TASK-006: Виправити diagnostics.html шлях
**Статус:** 🔄 TODO
**Оцінка:** 1 година

**Проблема:**
`diagnostics.html` відсутній в новій структурі `apps/`

**Рішення:**
1. Створити `apps/backend/app/static/diagnostics.html`
2. Або інтегрувати в Frontend як React view

**Файли:**
- Створити: `apps/backend/app/static/diagnostics.html`
- Або: `apps/frontend/src/views/DiagnosticsView.tsx`

---

### TASK-007: H2O LLM Studio Integration
**Статус:** 🔄 TODO
**Оцінка:** 4 години

**Проблема:**
Контейнер H2O створено, але не запущено (потребує GPU)

**Рішення:**
1. Переконатися що NVIDIA driver встановлено
2. Налаштувати GPU access в Docker
3. Створити training pipeline

**Файли для редагування:**
- `apps/self-improve-orchestrator/agents/training_manager.py`
- `configs/h2o/default_experiment.yaml`

---

### TASK-008: Hardcoded Passwords → Environment Variables
**Статус:** ✅ DONE
**Оцінка:** 2 години

**Проблема:**
`docker-compose.yml` має hardcoded паролі

**Рішення:**
```yaml
# docker-compose.yml
postgres:
  environment:
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-predator_password}

minio:
  environment:
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-predator_secret_key}
```

**Файли:**
- `docker-compose.yml`
- `.env.example` (додати нові змінні)

---

## 🟡 P2 - СЕРЕДНІЙ ПРІОРИТЕТ

### TASK-009: Видалити застарілі файли в корені
**Статус:** 🔄 TODO
**Оцінка:** 1 година

**Проблема:**
В корені проекту є застарілі `backend/` та `frontend/` директорії

**Рішення:**
```bash
# Перевірити що нічого важливого не втратимо
diff -r backend apps/backend
diff -r frontend apps/frontend

# Видалити після перевірки
rm -rf backend/
rm -rf frontend/
```

---

### TASK-010: Повна документація workflows
**Статус:** 🔄 TODO
**Оцінка:** 4 години

**Поточні workflows:**
- `.agent/workflows/auto_fix.md`
- `.agent/workflows/run_diagnostics.md`
- `.agent/workflows/switch-to-server.md`
- `.agent/workflows/system_status.md`
- `.agent/workflows/verify_e2e_ui.md`

**Потрібно додати:**
- `deploy_production.md`
- `rollback_changes.md`
- `scale_services.md`
- `backup_restore.md`
- `security_audit.md`

---

### TASK-011: CI/CD через GitHub Actions
**Статус:** 🔄 TODO
**Оцінка:** 4 години

**Створити:**
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on: [push, pull_request]

jobs:
### TASK-012: Rate Limiting для API
**Статус:** ✅ DONE
**Оцінка:** 2 години

**Імплементація:**
Реалізовано в `apps/backend/app/middleware/rate_limit.py` та підключено в `main.py`.
```

---

### TASK-013: WebSocket для Real-time Updates
**Статус:** 🔄 TODO
**Оцінка:** 4 години

**Імплементація:**
```python
# apps/backend/app/api/websocket.py
from fastapi import WebSocket

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    pubsub = redis.pubsub()
    await pubsub.subscribe("predator:events")

    async for message in pubsub.listen():
        if message["type"] == "message":
            await websocket.send_json(message["data"])
```

---

## 🟢 P3 - НИЗЬКИЙ ПРІОРИТЕТ

### TASK-014: Kubernetes Deployment
**Статус:** 🔄 TODO
**Оцінка:** 8 годин

**Структура:**
```
k8s/
├── namespace.yaml
├── backend/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
├── frontend/
├── postgres/
├── redis/
└── ingress.yaml
```

---

### TASK-015: Federated Learning з Flower
**Статус:** 🔄 TODO
**Оцінка:** 16 годин

**Документація:** https://flower.dev/

---

### TASK-016: Multi-tenant A/B Testing
**Статус:** 🔄 TODO
**Оцінка:** 8 годин

---

### TASK-017: Advanced XAI Visualizations
**Статус:** 🔄 TODO
**Оцінка:** 8 годин

**Технології:**
- SHAP для feature importance
- LIME для local explanations
- ECharts для візуалізації

---

### TASK-018: FinOps Dashboard
**Статус:** 🔄 TODO
**Оцінка:** 8 годин

**Метрики:**
- Cost per query
- LLM API costs per provider
- Resource utilization
- Budget alerts

---

### TASK-019: Offline Vector Search (Edge AI)
**Статус:** 🔄 TODO
**Оцінка:** 12 годин

**Технології:**
- Transformers.js
- RxDB для локального сховища
- Service Worker для offline

---

### TASK-020: Voice Interface
**Статус:** 🔄 TODO
**Оцінка:** 8 годин

**Технології:**
- Google Cloud TTS/STT
- Whisper.js fallback
- eSpeak-ng для offline

---

## 📊 SUMMARY

| Пріоритет | Кількість задач | Орієнтовний час |
|-----------|-----------------|-----------------|
| P0 (Critical) | 4 | ~6 годин |
| P1 (High) | 4 | ~7.5 годин |
| P2 (Medium) | 5 | ~15 годин |
| P3 (Low) | 7 | ~68 годин |
| **TOTAL** | **20** | **~96.5 годин** |

---

## ✅ КРИТЕРІЇ ГОТОВНОСТІ (Definition of Done)

Для кожної задачі:
1. [ ] Код написано та працює локально
2. [ ] Unit тести додано (якщо applicable)
3. [ ] Документація оновлена
4. [ ] Code review пройдено
5. [ ] Задеплоєно на staging
6. [ ] Протестовано на staging
7. [ ] Задеплоєно на production
8. [ ] Моніторинг підтверджує здоровий стан

---

**Останнє оновлення:** 2025-12-16T18:15:00+02:00
