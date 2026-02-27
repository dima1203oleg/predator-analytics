# 🤖 PREDATOR ANALYTICS - ІНСТРУКЦІЇ ДЛЯ AI-РЕДАКТОРІВ
## Windsurf, Cursor, Copilot, Claude та інших AI-асистентів

**Версія:** 1.0.0
**Дата:** 2025-12-16

---

## 🎯 МЕТА ДОКУМЕНТА

Цей документ містить детальні інструкції для AI-редакторів (Windsurf, Cursor, Copilot тощо) для імплементації та підтримки проекту Predator Analytics. Дотримуючись цих інструкцій, AI-редактор зможе створити повністю робочу production-ready систему.

---

## 📋 КОНТЕКСТ ПРОЕКТУ

### Що це за проект?
**Predator Analytics** — AI-native платформа семантичного пошуку та аналітики з:
- Автономним циклом самовдосконалення (Self-Improvement Loop)
- LLM Council (3 AI моделі приймають рішення консенсусом)
- Гібридним пошуком (BM25 + Vector)
- Telegram Control Plane

### Поточний стан
- ✅ Base infrastructure готова
- ✅ Backend API працює
- ✅ Frontend MVP готовий
- ✅ Orchestrator базова версія
- 🔄 Потрібні покращення та стабілізація

---

## 🔴 КРИТИЧНІ ПРАВИЛА (MUST FOLLOW)

### 1. Структура проекту
```
ПРАВИЛЬНО: apps/backend/    apps/frontend/    apps/self-improve-orchestrator/
НЕПРАВИЛЬНО: backend/      frontend/          (ці застарілі в корені)
```

### 2. Environment Variables
```bash
# ЗАВЖДИ читай з os.getenv(), НІКОЛИ не хардкодь
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")  # ✅
GEMINI_API_KEY = "AIzaSy..."  # ❌ НІКОЛИ
```

### 3. Database URLs
```python
# Для async (FastAPI, Orchestrator):
DATABASE_URL = "postgresql+asyncpg://..."  # ✅

# Для sync (Celery):
DATABASE_URL = "postgresql://..."  # ✅ (без asyncpg!)
```

### 4. Імпорти
```python
# Використовуй абсолютні імпорти від кореня app/
from app.services.llm import ModelRouter  # ✅
from ..services.llm import ModelRouter    # ❌ уникай відносних
```

### 5. Error Handling
```python
# ЗАВЖДИ з fallback для LLM calls
try:
    response = await gemini.generate(prompt)
except Exception as e:
    logger.warning(f"Gemini failed: {e}, trying fallback...")
    response = await groq.generate(prompt)  # fallback
```

---

## 📁 ДЕТАЛЬНА СТРУКТУРА ФАЙЛІВ

### Backend (`apps/backend/`)

```
apps/backend/
├── app/
│   ├── main.py                 # 568 рядків - Entry point FastAPI
│   │   # Містить: startup event, health check, основні routes
│   │   # Lazy initialization для швидкого старту
│   │
│   ├── models.py               # SQLAlchemy моделі
│   │   # User, Document, SearchLog, RawData
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── search.py       # Пошукові ендпоінти
│   │   │   ├── auth.py         # Login, Register, JWT
│   │   │   └── federation.py   # Federated Learning
│   │   │
│   │   └── routers/
│   │       ├── search.py       # /api/v1/search - ГОЛОВНИЙ роутер пошуку
│   │       ├── council.py      # /api/v1/council - LLM Council
│   │       ├── llm_management.py # Управління LLM моделями
│   │       ├── diagnostics_api.py # Діагностика системи
│   │       ├── e2e.py          # E2E тестування UI
│   │       ├── metrics.py      # Prometheus метрики
│   │       └── stats.py        # Аналітика
│   │
│   ├── services/               # БІЗНЕС ЛОГІКА
│   │   ├── llm.py              # 38KB - Мультимодельний LLM роутер
│   │   │   # Критичний файл! Містить:
│   │   │   # - ModelRouter class
│   │   │   # - Fallback chain
│   │   │   # - Council voting
│   │   │
│   │   ├── embedding_service.py # Генерація ембедингів
│   │   │   # sentence-transformers/paraphrase-multilingual-mpnet-base-v2
│   │   │   # EMBEDDING_DIM = 768
│   │   │
│   │   ├── qdrant_service.py   # Векторний пошук
│   │   │   # COLLECTION_NAME = "predator_documents"
│   │   │
│   │   ├── opensearch_indexer.py # BM25 індексація
│   │   ├── search_fusion.py    # Hybrid search + RRF fusion
│   │   ├── model_router.py     # LLM routing logic
│   │   ├── diagnostics_service.py
│   │   └── auto_optimizer.py   # Self-improvement service
│   │
│   ├── core/
│   │   ├── config.py           # Settings через pydantic-settings
│   │   ├── security.py         # JWT, password hashing
│   │   ├── celery_app.py       # Celery configuration
│   │   └── cache.py            # Redis cache helpers
│   │
│   └── tasks/
│       ├── etl_tasks.py        # @celery_app.task(queue="etl")
│       ├── indexing_tasks.py   # @celery_app.task(queue="ingestion")
│       └── maintenance_tasks.py
│
├── requirements.txt            # 98 рядків залежностей
├── Dockerfile                  # Python 3.12-slim
└── tests/
```

### Frontend (`apps/frontend/`)

```
apps/frontend/
├── src/
│   ├── App.tsx                 # Main router
│   ├── index.tsx               # Entry point
│   ├── index.css               # 18KB глобальні стилі
│   │   # CSS Variables для темізації
│   │   # Dark theme за замовчуванням
│   │
│   ├── types.ts                # TypeScript типи
│   │   # SearchResult, User, Document, etc.
│   │
│   ├── components/
│   │   ├── Layout.tsx          # 20KB - Main layout з sidebar
│   │   ├── BootScreen.tsx      # Startup анімація
│   │   ├── LoginScreen.tsx     # Auth UI
│   │   ├── CommandCenter.tsx   # Ctrl+K palette
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Skeleton.tsx        # Loading states
│   │
│   ├── views/                  # СТОРІНКИ
│   │   ├── DashboardView.tsx   # 30KB - Головна
│   │   ├── SearchConsole.tsx   # 42KB - Пошукова консоль
│   │   ├── AnalyticsView.tsx   # 52KB - Аналітика
│   │   ├── LLMView.tsx         # 40KB - LLM Management
│   │   ├── AgentsView.tsx      # 12KB - AI Agents
│   │   ├── TestingView.tsx     # 32KB - E2E Testing
│   │   ├── IntegrationView.tsx # 61KB - Data Sources
│   │   ├── MonitoringView.tsx  # Моніторинг
│   │   ├── SecurityView.tsx    # Безпека
│   │   └── SettingsView.tsx    # Налаштування
│   │
│   ├── services/
│   │   └── api.ts              # Axios клієнт
│   │
│   └── context/
│       ├── AuthContext.tsx
│       └── ThemeContext.tsx
│
├── package.json                # React 18, Vite, TailwindCSS
├── vite.config.ts
└── Dockerfile                  # Node 18 → Nginx
```

### Orchestrator (`apps/self-improve-orchestrator/`)

```
apps/self-improve-orchestrator/
├── main.py                     # 665 рядків - BRAIN of the system
│   # class AutonomousOrchestrator:
│   #   - initialize()
│   #   - infinite_loop()
│   #   - gather_metrics()
│   #   - identify_task()
│   #   - council_vote()
│   #   - execute_task()
│
├── config.py                   # API keys, URLs, thresholds
│
├── council/                    # LLM COUNCIL
│   ├── __init__.py
│   ├── chairman.py             # Gemini - Decision maker
│   ├── critic.py               # Groq - Code reviewer
│   ├── analyst.py              # DeepSeek - System analyst
│   ├── consensus.py            # Voting logic (2/3 majority)
│   └── ultimate_fallback.py    # Multi-model fallback chain
│
├── agents/                     # AI AGENTS
│   ├── telegram_bot.py         # 56KB - Telegram V4 bot
│   ├── git_committer.py        # Auto git commits
│   ├── change_observer.py      # File system watcher
│   ├── reflexion_agent.py      # Learn from errors
│   ├── self_healing.py         # Auto-recovery
│   ├── performance_predictor.py
│   ├── training_manager.py     # H2O LLM Studio
│   └── voice_handler.py        # Voice commands
│
├── tasks/                      # TASK EXECUTORS
│   ├── code_improver.py        # Generate code improvements
│   ├── ui_guardian.py          # Playwright UI tests
│   └── data_sentinel.py        # Data validation
│
├── memory/
│   └── manager.py              # Redis-based context memory
│
└── knowledge/
    └── graph.py                # Codebase knowledge graph
```

---

## 🔧 ІМПЛЕМЕНТАЦІЙНІ ПАТЕРНИ

### Pattern 1: LLM Fallback Chain

```python
# apps/backend/app/services/llm.py

class ModelRouter:
    FALLBACK_CHAIN = ["groq", "gemini", "ollama"]

    async def generate_with_fallback(self, prompt: str) -> str:
        for provider in self.FALLBACK_CHAIN:
            try:
                return await self._call_provider(provider, prompt)
            except Exception as e:
                logger.warning(f"{provider} failed: {e}")
                continue
        raise Exception("All LLM providers failed")
```

### Pattern 2: Hybrid Search with RRF

```python
# apps/backend/app/services/search_fusion.py

async def hybrid_search_with_rrf(
    query: str,
    limit: int = 10,
    alpha: float = 0.5,  # 0 = pure BM25, 1 = pure vector
    k: int = 60  # RRF parameter
) -> List[SearchResult]:
    # 1. BM25 search
    bm25_results = await opensearch.search(query)

    # 2. Vector search
    embedding = await embed_service.embed_text(query)
    vector_results = await qdrant.search(embedding)

    # 3. RRF Fusion
    combined = reciprocal_rank_fusion(
        bm25_results, vector_results, k=k
    )

    # 4. Rerank (optional)
    if rerank:
        combined = await cross_encoder.rerank(query, combined)

    return combined[:limit]
```

### Pattern 3: Council Consensus

```python
# apps/self-improve-orchestrator/council/consensus.py

async def reach_consensus(proposals: List[Dict]) -> Dict:
    """
    2/3 majority required for approval
    """
    approvals = sum(1 for p in proposals if p["decision"] == "approve")
    total = len(proposals)

    if approvals >= (total * 2 / 3):
        return {"status": "approved", "confidence": approvals / total}
    return {"status": "rejected", "reason": "No consensus"}
```

### Pattern 4: Telegram Menu System

```python
# apps/self-improve-orchestrator/agents/telegram_bot.py

class MenuSystem:
    @staticmethod
    def get_main_menu() -> InlineKeyboardMarkup:
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="📊 Dashboard", callback_data="menu_dashboard")],
            [InlineKeyboardButton(text="🤖 AI Assistant", callback_data="menu_ai")],
            [InlineKeyboardButton(text="⚙️ System Control", callback_data="menu_system")],
            # ... more buttons
        ])
```

---

## 📝 ТИПОВІ ЗАДАЧІ ТА РІШЕННЯ

### Задача 1: Додати новий API endpoint

```python
# 1. Створи router в apps/backend/app/api/routers/new_feature.py
from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter(prefix="/api/v1/new-feature", tags=["new-feature"])

@router.get("/")
async def get_items(user: dict = Depends(get_current_user)):
    return {"items": []}

# 2. Зареєструй в apps/backend/app/main.py
from app.api.routers import new_feature
app.include_router(new_feature.router)
```

### Задача 2: Додати нову view у Frontend

```typescript
// 1. Створи apps/frontend/src/views/NewFeatureView.tsx
import { useState, useEffect } from 'react';
import { ViewHeader } from '../components/ViewHeader';

export function NewFeatureView() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/v1/new-feature')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="view-container">
      <ViewHeader title="New Feature" />
      {/* content */}
    </div>
  );
}

// 2. Додай route в apps/frontend/src/App.tsx
import { NewFeatureView } from './views/NewFeatureView';
// В Router: <Route path="/new-feature" element={<NewFeatureView />} />

// 3. Додай пункт меню в apps/frontend/src/components/Layout.tsx
```

### Задача 3: Додати нового LLM провайдера

```python
# apps/backend/app/services/llm.py

# 1. Додай константи
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
ANTHROPIC_MODEL = "claude-3-haiku-20240307"

# 2. Додай метод виклику
async def _call_anthropic(self, prompt: str) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

# 3. Додай в FALLBACK_CHAIN
FALLBACK_CHAIN = ["groq", "gemini", "anthropic", "ollama"]
```

### Задача 4: Додати Celery task

```python
# apps/backend/app/tasks/new_tasks.py

from app.core.celery_app import celery_app

@celery_app.task(queue="maintenance", bind=True, max_retries=3)
def process_something(self, item_id: str):
    try:
        # logic here
        pass
    except Exception as e:
        self.retry(exc=e, countdown=60)

# Виклик task:
# from app.tasks.new_tasks import process_something
# process_something.delay(item_id="123")
```

### Задача 5: Додати Telegram команду

```python
# apps/self-improve-orchestrator/agents/telegram_bot.py

# 1. Додай callback handler
@dp.callback_query(F.data == "new_action")
async def handle_new_action(callback: CallbackQuery):
    await callback.answer()
    await callback.message.edit_text(
        "🚀 Виконую нову дію...",
        reply_markup=MenuSystem.get_main_menu()
    )
    # Execute action
    result = await some_service.do_something()
    await callback.message.edit_text(f"✅ Результат: {result}")

# 2. Додай кнопку в меню
class MenuSystem:
    @staticmethod
    def get_system_menu():
        return InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="🆕 New Action", callback_data="new_action")],
            # ...
        ])
```

---

## ⚠️ ВІДОМІ ПРОБЛЕМИ ТА РІШЕННЯ

### Проблема 1: SyntaxError в коді
**Симптом:** Кириличні символи в Python коді
```python
text.strip()пр  # ❌ Помилка!
text.strip()    # ✅ Правильно
```

### Проблема 2: Undefined json module
**Рішення:** Завжди додавай import
```python
import json  # Обов'язково на початку файлу
```

### Проблема 3: Celery + asyncpg несумісність
**Симптом:** `asyncpg` не працює з синхронним Celery
**Рішення:**
```python
# Для Celery використовуй psycopg2:
DATABASE_URL = "postgresql://..."  # без +asyncpg
```

### Проблема 4: API ключі 401/404
**Рішення:**
1. Перевір `.env` файл
2. Ротуй ключі щомісяця
3. Перевір ліміти free tier

### Проблема 5: H2O LLM Studio не запускається
**Причина:** Потребує GPU
**Рішення:** Використовуй тільки на NVIDIA сервері

---

## 🚀 ШВИДКИЙ СТАРТ ДЛЯ AI-РЕДАКТОРА

### Крок 1: Розуміння структури
```bash
# Переглянь основні файли:
cat apps/backend/app/main.py
cat apps/frontend/src/App.tsx
cat apps/self-improve-orchestrator/main.py
cat docker-compose.yml
```

### Крок 2: Запуск локально
```bash
docker compose up -d
docker compose logs -f backend
curl http://localhost:8090/health
```

### Крок 3: Внесення змін
1. Редагуй файли в правильних директоріях (`apps/`)
2. Тестуй локально
3. Коміть з чіткими повідомленнями
4. Push та деплой

### Крок 4: Деплой на сервер
```bash
ssh dima@194.177.1.240 -p 6666
cd ~/predator-analytics
git pull
docker compose up -d --build
```

---

## 📊 МЕТРИКИ УСПІХУ

| Метрика | Ціль | Як виміряти |
|---------|------|-------------|
| Tests Pass | 100% | `pytest` |
| Coverage | > 70% | `pytest --cov` |
| Build Success | 100% | `docker compose build` |
| API Health | 100% | `curl /health` |
| Latency P95 | < 800ms | Prometheus |

---

## 🔗 ПОСИЛАННЯ

- **Main Spec:** `docs/TECHNICAL_SPECIFICATION_COMPLETE.md`
- **System Audit:** `docs/SYSTEM_AUDIT_REPORT.md`
- **Orchestrator Docs:** `docs/ORCHESTRATOR_v45.md`
- **Quick Start:** `docs/QUICK_START.md`

---

**Ready for Implementation! 🚀**
