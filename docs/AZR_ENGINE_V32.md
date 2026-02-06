# 🧠 AZR Engine v32 - Sovereign Autonomous Response

## Огляд

AZR (Autonomous Zero-intervention Response) Engine v32 - це серцевина автономної системи Predator Analytics. Він забезпечує повністю автономну роботу системи з мінімальним втручанням людини.

## Ключові можливості v32

### 1. 🔄 OODA Loop (Observe-Orient-Decide-Act)
- **Observe**: Збір метрик з усіх підсистем (CPU, Memory, Disk, API, DB, AI)
- **Orient**: Аналіз даних, виявлення аномалій, прогнозування трендів
- **Decide**: Планування дій на основі досвіду та правил
- **Act**: Виконання змін з canary deployment та rollback

### 2. 🛡️ Constitutional Guard v2
Захисник конституційних аксіом з живим оновленням:
- 7 базових аксіом безпеки
- Динамічне завантаження з YAML
- Автоматичне блокування небезпечних дій
- Аудит усіх порушень

### 3. 📚 Experience Memory (Self-Learning)
Система самонавчання на основі досвіду:
- Запам'ятовування успішних/невдалих дій
- Blacklist для критичних помилок
- Ймовірнісна оцінка успіху нових дій
- Патерн-розпізнавання

### 4. 🔮 Predictive Anomaly Detection
Передбачення проблем до їх виникнення:
- Z-score аналіз відхилень
- Trend forecasting (INCREASING/DECREASING/STABLE)
- Автоматичні алерти

### 5. 🗳️ Multi-Model Consensus
Голосування кількох AI моделей:
- Підтримка Ollama, Gemini, Mistral
- Вагові коефіцієнти для різних провайдерів
- Fallback chain при недоступності

### 6. 🐥 Canary Deployment v2
Безпечне розгортання змін:
- Поступовий rollout (10% → 100%)
- Real-time health monitoring
- Автоматичний rollback при проблемах

### 7. 💥 Chaos Engineering
Тестування відмовостійкості:
- CPU spike simulation
- Memory pressure testing
- Network latency injection
- Database timeout simulation
- API error injection

### 8. 📱 Telegram Alerts (Live)
Миттєві сповіщення адміністратору:
- 🚨 **Critical**: Блокування конституцією
- ⚠️ **Warning**: Виявлені аномалії (High Z-score), Rollbacks
- ✅ **Success**: Успішне відновлення (optional)
- Налаштування через `TELEGRAM_BOT_TOKEN` та `TELEGRAM_ADMIN_ID`

## API Endpoints

### Статус
```
GET /api/azr/status          # Повний статус engine
GET /api/azr/health          # Детальний breakdown здоров'я
GET /api/azr/metrics         # Prometheus-сумісні метрики
```

### Досвід та Пам'ять
```
GET /api/azr/experience             # Статистика досвіду
GET /api/azr/experience/blacklist   # Заблоковані дії (admin)
DELETE /api/azr/experience/blacklist/{fingerprint}  # Розблокування (admin)
```

### Аномалії
```
GET /api/azr/anomalies       # Поточні аномалії та тренди
```

### Конституція
```
GET /api/azr/constitution    # Список аксіом
GET /api/azr/audit          # Аудит лог (admin)
```

### Керування
```
POST /api/azr/start          # Запуск engine (admin)
POST /api/azr/stop           # Зупинка engine (admin)
POST /api/azr/freeze         # Екстрена заморозка (admin)
POST /api/azr/unfreeze       # Розморозка (admin)
```

### Chaos Engineering
```
GET  /api/azr/chaos/status   # Статус chaos testing (admin)
POST /api/azr/chaos/enable   # Увімкнути chaos (admin)
POST /api/azr/chaos/disable  # Вимкнути chaos (admin)
```

## Конституційні Аксіоми

1. **NO_HUMAN_HARM** - Система не повинна шкодити людям
2. **DATA_INTEGRITY** - Тільки реальні дані, без фабрикацій
3. **SECURITY_FIRST** - Ніколи не знижувати рівень безпеки
4. **TRANSPARENCY** - Всі дії мають бути аудитованими
5. **REVERSIBILITY** - Деструктивні зміни потребують rollback
6. **RATE_LIMITING** - Дотримання лімітів API
7. **ISOLATION** - Зміни тестуються в sandbox

## Health Score Breakdown

| Компонент | Вага | Опис |
|-----------|------|------|
| CPU | 15% | Завантаження процесора |
| Memory | 15% | Використання RAM |
| Disk | 10% | Використання диску |
| API | 25% | Доступність API endpoints |
| Database | 20% | Здоров'я PostgreSQL |
| AI | 15% | Доступність Ollama моделей |

## Файлова структура

```
services/api-gateway/app/services/
├── azr_engine_v32.py       # Основний engine
├── azr_engine.py           # Legacy v31 (fallback)
└── ...

services/api-gateway/app/routers/
├── azr.py                  # API routes

apps/predator-analytics-ui/src/components/azr/
├── AZRDashboard.tsx        # React компонент
├── AZRDashboard.css        # Стилі
└── index.ts                # Експорт
```

## Конфігурація

### Environment Variables
```bash
SOVEREIGN_AUTO_APPROVE=true  # Режим повної автономії
CHAOS_ENABLED=false          # Chaos testing (off by default)
MISTRAL_API_KEY=xxx          # Для Multi-Model Consensus
GEMINI_API_KEY=xxx           # Для Multi-Model Consensus
```

### Axioms YAML (config/axioms/constitutional_axioms.yaml)
```yaml
axioms:
  - id: AXIOM_1
    name: NO_HUMAN_HARM
    description: System must never cause harm to humans
  # ...
```

## Метрики Prometheus

```
azr_cycle_count              # Кількість виконаних циклів
azr_health_score             # Загальний health score
azr_health_cpu               # CPU health
azr_health_memory            # Memory health
azr_actions_executed         # Всього виконано дій
azr_actions_blocked          # Всього заблоковано
azr_rollbacks                # Кількість відкатів
```

## Версії

| Версія | Дата | Зміни |
|--------|------|-------|
| v32.0.0 | 2026-01-23 | OODA Loop, Experience Memory, Anomaly Detection, Chaos Engine |
| v31.0.0 | 2026-01-18 | ZAR Unified, MCP Integration |
| v28.0.0 | 2026-01-15 | Constitutional Guard, Canary Deployment |

---

**Автор**: Predator Analytics Team
**Ліцензія**: Proprietary
**Статус**: Production Ready 🚀
