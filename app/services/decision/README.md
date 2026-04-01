# 🧠 Decision Intelligence Engine — v55.2

> **Predator Analytics** — Модуль для прийняття бізнес-рішень на основі OSINT даних

## 📋 Огляд

Decision Intelligence Engine — це AI-адвізор для бізнесу, який аналізує:
- **Ризики контрагентів** (суди, санкції, офшори, PEP)
- **Ринкові можливості** (конкуренція, ціни, попит)
- **Постачальників** (рейтинг країн, ТОП-10, демпінг)
- **Ринкові ніші** (малоконкурентні товари з попитом)
- **Прогнози попиту** (ML, сезонність, тренди)

## 🚀 Швидкий старт

### 1. Інсталяція залежностей

```bash
pip install -r requirements.txt
```

### 2. Запуск сервера

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Відкриття UI

```
http://localhost:3030/decision-intelligence
```

## 📚 API Документація

### Основні endpoints

| Method | Endpoint | Опис | TTL кешу |
|--------|----------|------|-----------|
| POST | `/decision/recommend` | Повна рекомендація з 3 сценаріями | — |
| GET | `/decision/quick-score/{edrpou}` | Швидкий ризик-скор за 100мс | 300s |
| POST | `/decision/counterparty` | Повне досьє контрагента | — |
| GET | `/decision/procurement/{code}` | Аналіз постачальників та цін | 300s |
| GET | `/decision/market-entry/{code}` | Оцінка входу на ринок | 600s |
| GET | `/decision/niche-finder` | Пошук ринкових ніш | 600s |
| POST | `/decision/batch` | Масовий аналіз до 100 компаній | — |

### Приклади запитів

#### Швидкий ризик-скор

```bash
curl -X GET "http://localhost:8000/api/v1/decision/quick-score/12345678"
```

**Відповідь:**
```json
{
  "edrpou": "12345678",
  "cers_score": 42,
  "risk_level": "medium",
  "verdict": "З ОБЕРЕЖНІСТЮ",
  "color": "yellow",
  "top_risk_factor": "payment_delays"
}
```

#### Досьє контрагента

```bash
curl -X POST "http://localhost:8000/api/v1/decision/counterparty" \
  -H "Content-Type: application/json" \
  -d '{
    "ueid": "12345678",
    "edrpou": "12345678",
    "company_name": "ТОВ Приклад"
  }'
```

#### Масовий аналіз

```bash
curl -X POST "http://localhost:8000/api/v1/decision/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "edrpou_list": ["12345678", "87654321", "11111111"],
    "analysis_type": "quick_score"
  }'
```

## 💻 CLI Утиліта

Встановлена як модуль Python для швидкого аналізу з командної строки:

```bash
# Швидкий скор
python -m app.services.decision.cli quick-score 12345678

# Повне досьє
python -m app.services.decision.cli counterparty 12345678 --json-output

# Масовий аналіз з файлу
python -m app.services.decision.cli batch edrpou_list.txt

# Повна рекомендація
python -m app.services.decision.cli recommend 12345678 87032310 --months 12
```

### Формат файлу для batch-аналізу

**Текстовий файл** (`edrpou_list.txt`):
```
12345678
87654321
11111111
22222222
```

**JSON файл** (`companies.json`):
```json
{
  "edrpou_list": ["12345678", "87654321", "11111111"]
}
```

## 🎯 Frontend Інтеграція

### React компоненти

```typescript
import { decisionApi } from '@/services/api/decision';

// Швидкий скор
const score = await decisionApi.getQuickScore('12345678');

// Досьє контрагента
const profile = await decisionApi.getCounterpartyProfile({
  ueid: '12345678',
  edrpou: '12345678'
});

// Масовий аналіз
const batch = await decisionApi.batchAnalysis({
  edrpou_list: ['12345678', '87654321'],
  analysis_type: 'quick_score'
});
```

### UI Компоненти

- **DecisionIntelligenceView** — головний компонент з 6 вкладками
- **QuickScoreCard** — картка швидкого скорингу
- **CounterpartyProfile** — детальне досьє
- **BatchAnalysis** — масовий аналіз

## 📊 Метрики та Моніторинг

### Prometheus метрики

```
predator_decision_requests_total{endpoint="quick_score",status="success"}
predator_decision_latency_seconds{endpoint="batch"}
predator_decision_cache_hits_total{prefix="decision:quickscore"}
predator_decision_risk_scores{level="high"}
```

### Redis кешування

- **quick_score**: 300 секунд
- **procurement**: 300 секунд  
- **market_entry**: 600 секунд
- **niche_finder**: 600 секунд

## 🏗️ Архітектура

```
Decision Intelligence Engine
├── app/services/decision/
│   ├── decision_engine.py      # Основний двигун
│   ├── batch_processor.py      # Масовий аналіз
│   ├── __init__.py             # Експорти
│   └── cli.py                  # CLI утиліта
├── app/api/v1/decision.py      # FastAPI endpoints
├── apps/predator-analytics-ui/src/features/decision/
│   ├── DecisionIntelligenceView.tsx  # UI компонент
│   └── __tests__/              # Тести
└── src/services/api/decision.ts    # Frontend API
```

## 🧪 Тестування

### Backend тести

```bash
pytest tests/api/test_decision_api.py -v
```

### Frontend тести

```bash
cd apps/predator-analytics-ui
npm run test:unit DecisionIntelligenceView
```

### E2E тести

```bash
npx playwright test decision-intelligence
```

## 📈 Приклади використання

### 1. Due diligence постачальника

```python
from app.services.decision import get_decision_engine

engine = get_decision_engine()
result = await engine.recommend(
    ueid="12345678",
    product_code="87032310",
    db=session
)

if result.risk_score > 60:
    print("⚠️ Високий ризик - рекомендуємо додаткову перевірку")
```

### 2. Аналіз ринку для нового товару

```python
from app.services.decision import get_procurement_analyzer

analyzer = get_procurement_analyzer()
procurement = await analyzer.analyze(
    product_code="87032310",
    db=session
)

print(f"Найкраща країна: {procurement.best_country}")
print(f"Економія: ${procurement.estimated_savings:,}")
```

### 3. Масовий моніторинг контрагентів

```python
from app.services.decision import BatchProcessor

processor = BatchProcessor(max_concurrent=20)
results = await processor.analyze_companies(
    edrpou_list=["12345678", "87654321", ...],
    analysis_type="quick_score"
)

high_risk = [r.edrpou for r in results if r.data and r.data["cers_score"] > 75]
print(f"Знайдено {len(high_risk)} високоризикових компаній")
```

## 🔧 Конфігурація

### Environment Variables

```bash
# Redis для кешування
REDIS_URL=redis://localhost:6379/0

# База даних
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/predator

# Prometheus
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
```

### Налаштування кешування

```python
# app/core/cache.py
CACHE_TTLS = {
    "decision:quickscore": 300,
    "decision:procurement": 300,
    "decision:marketentry": 600,
    "decision:niches": 600,
}
```

## 🚨 Обмеження

- **Batch processing**: до 100 компаній за запит
- **Concurrent requests**: 10 паралельних запитів
- **Cache TTL**: від 300 до 600 секунд
- **Rate limiting**: 100 запитів/хвилина на IP

## 📝 Логування

```python
import logging

logger = logging.getLogger("predator.decision_engine")
logger.info("Processing recommendation for %s", ueid)
```

## 🤝 Внески

1. Fork репозиторію
2. Створіть feature branch (`git checkout -b feature/amazing-feature`)
3. Commit зміни (`git commit -m 'Add amazing feature'`)
4. Push до branch (`git push origin feature/amazing-feature`)
5. Відкрийте Pull Request

## 📄 Ліцензія

Predator Analytics v55.2 — Внутрішній продукт

---

**🧠 Predator Analytics Decision Intelligence Engine**  
*AI-адвізор для розумних бізнес-рішень*
