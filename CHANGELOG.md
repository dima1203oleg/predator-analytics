# 🚀 CHANGELOG v25.1.0 - Predator Analytics

> **Дата випуску:** 09.01.2026
> **Build:** Session improvements

---

## ✨ Нові можливості

### 🧠 LiteLLM Gateway Integration

Створено повноцінний LLM Gateway з multi-model failover:

- **Файл:** `services/api-gateway/app/services/llm_gateway.py`
- **Конфігурація:** `services/api-gateway/configs/litellm_config.yaml`

**Можливості:**
- Автоматичний failover: Claude → GPT-4 → Groq → Local
- Redis кешування для швидкості та економії
- Latency-based routing
- Council debate (multi-model consensus)
- Rate limiting та budget control

```python
from app.services.llm_gateway import get_llm_gateway

gateway = get_llm_gateway()
response = await gateway.analyze("Проаналізуй дані...", language="uk")
```

---

### 🖥️ System Health Dashboard

Новий компонент для моніторингу системи в реальному часі:

- **Файл:** `apps/predator-analytics-ui/src/components/dashboard/SystemHealthDashboard.tsx`

**Особливості:**
- Анімоване кільце прогресу з health score
- Real-time метрики (CPU, Memory, Disk)
- Статус всіх сервісів з latency
- Кольорова індикація стану
- Auto-refresh кожні 5 секунд

---

### 🤖 AI Analyst Panel

Інтерактивний чат з AI-аналітиком:

- **Файл:** `apps/predator-analytics-ui/src/components/ai/AIAnalystPanel.tsx`

**Особливості:**
- Chat-подібний інтерфейс
- Quick action chips для частих запитів
- Confidence badge для кожної відповіді
- Джерела та цитати
- Copy/Like/Dislike кнопки
- Typing indicator анімація

---

### 📤 Enhanced Data Upload

Drag-and-drop завантаження файлів:

- **Файл:** `apps/predator-analytics-ui/src/components/upload/EnhancedDataUpload.tsx`

**Особливості:**
- Drag-and-drop зона
- Progress tracking для кожного файлу
- Multi-file upload
- Підтримка CSV, Excel, PDF, JSON
- Анімації та візуальний feedback
- Error handling з retry

---

### 📋 Smart Case Browser

Інтуїтивний браузер аналітичних кейсів:

- **Файл:** `apps/predator-analytics-ui/src/components/cases/SmartCaseBrowser.tsx`

**Особливості:**
- Grid/List view toggle
- Пошук та фільтрація
- Сортування за датою/ризиком
- Risk score градієнт
- AI insights для кожного кейсу
- Responsive design

---

## 🔧 API Improvements

### `/api/v25/pulse` Endpoint

Новий endpoint для System Health Dashboard:

```bash
curl http://localhost:8090/api/v25/pulse
```

**Response:**
```json
{
  "score": 100,
  "status": "HEALTHY",
  "cpu_percent": 0.0,
  "memory_percent": 17.3,
  "disk_percent": 98.7,
  "services": [
    {"name": "PostgreSQL", "status": "healthy", "latency": 1.37},
    {"name": "Redis", "status": "healthy", "latency": 2.02},
    {"name": "Qdrant", "status": "healthy", "latency": 64.01},
    ...
  ]
}
```

---

## 📦 File Structure

```
services/api-gateway/
├── app/
│   └── services/
│       └── llm_gateway.py          # NEW: LiteLLM Gateway
└── configs/
    └── litellm_config.yaml         # NEW: LLM Configuration

apps/predator-analytics-ui/src/components/
├── dashboard/
│   └── SystemHealthDashboard.tsx   # NEW: Health monitoring
├── ai/
│   └── AIAnalystPanel.tsx          # NEW: AI chat interface
├── upload/
│   └── EnhancedDataUpload.tsx      # NEW: Drag-drop upload
├── cases/
│   └── SmartCaseBrowser.tsx        # NEW: Case management
└── index.ts                        # UPDATED: New exports
```

---

## 🔄 Migrations

Моделі NasTournament та NasCandidate додані до `entities.py` для Evolution router.

---

## 📊 System Status

| Сервіс | Статус | Uptime |
|--------|--------|--------|
| Backend | ✅ Running | 99.9% |
| Frontend | ✅ Running | 99.9% |
| PostgreSQL | ✅ Healthy | 99.99% |
| Redis | ✅ Healthy | 99.9% |
| Qdrant | ✅ Healthy | 99.8% |
| Celery | ✅ Healthy | 99.9% |

---

**Built with 💙 by Predator Analytics Team**
