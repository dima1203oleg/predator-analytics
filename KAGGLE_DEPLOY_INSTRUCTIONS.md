# 🦅 PREDATOR Analytics — Інструкції деплою на Kaggle

> **Версія**: v68.0-ELITE (100 Datasets Coverage)  
> **Режим**: CPU Only, Max RAM (30 GB)  
> **Тунель**: zrok (HR-23 compliant)  
> **Час деплою**: ~3 хвилини

---

## 📋 Передумови

1. **Kaggle акаунт** з підтвердженим телефоном (для Internet доступу)
2. **zrok токен** — отримати на [zrok.io](https://zrok.io):
   - Зареєструватися → Отримати invite token → `zrok enable <token>`
   - Поточний токен: зберігається як Kaggle Secret `ZROK_TOKEN`

---

## 🚀 Крок 1: Створення Kaggle Notebook

1. Відкрити [kaggle.com/code](https://www.kaggle.com/code)
2. Натиснути **"New Notebook"**
3. Налаштування Notebook:
   - **Accelerator**: `None` (CPU Only)
   - **Language**: `Python`
   - **Persistence**: `Files` 
   - **Internet**: `ON` ⚠️ **ОБОВ'ЯЗКОВО!**

---

## 🔐 Крок 2: Налаштування Secrets

1. У Kaggle Notebook натиснути **"Add-ons" → "Secrets"**
2. Додати секрет:
   - **Label**: `ZROK_TOKEN`
   - **Value**: ваш zrok invite token (наприклад `1eeje4um7yvA`)
3. Увімкнути секрет (toggle ON)

> [!IMPORTANT]
> Без секрету `ZROK_TOKEN` тунель не запуститься і бекенд буде доступний тільки всередині Kaggle.

---

## 📝 Крок 3: Код у Notebook

### Варіант A: Одна клітинка (рекомендовано)

Скопіювати весь вміст файлу `scripts/predator_kaggle_prod_v67.py` в одну клітинку Kaggle Notebook.

### Варіант B: Завантаження з GitHub (автоматично)

Створити **Cell 1** з наступним кодом:

```python
# Cell 1: Завантаження та запуск PREDATOR Backend
import subprocess, sys, os

# Завантаження скрипту з GitHub
REPO_URL = "https://raw.githubusercontent.com/dima1203oleg/predator-analytics/main/scripts/predator_kaggle_prod_v67.py"
SCRIPT_PATH = "/kaggle/working/predator_backend.py"

subprocess.run(["wget", "-q", REPO_URL, "-O", SCRIPT_PATH], check=False)

# Встановлення zrok token з Kaggle Secrets
from kaggle_secrets import UserSecretsClient
try:
    secrets = UserSecretsClient()
    os.environ["KAGGLE_SECRET_ZROK_TOKEN"] = secrets.get_secret("ZROK_TOKEN")
    print("✅ ZROK_TOKEN завантажено з Kaggle Secrets")
except Exception as e:
    print(f"⚠️ Secrets недоступні: {e}")
    os.environ["KAGGLE_SECRET_ZROK_TOKEN"] = ""

# Запуск
exec(open(SCRIPT_PATH).read())
```

### Варіант C: Notebook файл

Використати готовий notebook: `predator_kaggle_v67.ipynb` — завантажити на Kaggle через **"File" → "Import Notebook"**.

---

## ▶️ Крок 4: Запуск

1. Натиснути **"Run All"** або `Ctrl+Shift+Enter`
2. Дочекатися виводу:

```
═══════════════════════════════════════════════════════════
🔥 PREDATOR KAGGLE 67.0-ELITE IS LIVE!
🔗 PUBLIC URL: https://abc123.share.zrok.io
📋 Встановіть у .env.local: VITE_API_URL=https://abc123.share.zrok.io/api/v1
═══════════════════════════════════════════════════════════
```

3. Скопіювати `PUBLIC URL` — це адреса вашого бекенду

---

## 🖥️ Крок 5: Підключення Frontend

### На MacBook (IDE):

1. Відкрити файл `.env.local` у директорії фронтенду:

```bash
nano /Users/Shared/Predator_60/apps/predator-analytics-ui/.env.local
```

2. Замінити `VITE_API_URL` на URL з Kaggle:

```env
# PREDATOR Analytics Frontend — Kaggle Backend
VITE_API_URL=https://YOUR-ZROK-URL.share.zrok.io/api/v1
VITE_WS_URL=https://YOUR-ZROK-URL.share.zrok.io/api/v1/events/stream
VITE_ENV=production
VITE_MODE=remote
VITE_PREDATOR_NODE=KAGGLE_PROD
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TELEMETRY=false
VITE_APP_TITLE=PREDATOR Analytics v67.0 (Kaggle Production)
VITE_APP_VERSION=67.0.0
VITE_LANGUAGE=uk
```

3. Перезапустити dev server:

```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

4. Відкрити `http://localhost:3030` — UI підключений до Kaggle бекенду!

---

## 🔑 Облікові записи

| Логін | Пароль | Роль | Опис |
|-------|--------|------|------|
| `admin` | `admin123` | `admin` | Повний доступ |
| `analyst` | `analyst123` | `analyst` | Читання + аналітика + AI Copilot |
| `operator` | `operator123` | `operator` | Читання + інгестія |
| `viewer` | `viewer123` | `viewer` | Тільки читання |

---

## 📊 Що включено в бекенд

### Бази даних (10 DB Architecture)

| БД | Emulation | Роль |
|----|-----------|------|
| PostgreSQL | SQLite (main) | SSOT — метадані, користувачі |
| ClickHouse | SQLite (OLAP) | Аналітика, агрегації |
| Neo4j | NetworkX (in-memory) | Граф зв'язків (500 nodes, 1500+ edges) |
| Redis | Dict (in-memory) | Кеш, сесії |
| Qdrant | NumPy (in-memory) | Векторна пам'ять |
| OpenSearch | SQLite (FTS) | Повнотекстовий пошук |
| Kafka | Threading (in-memory) | Черги повідомлень |
| MinIO | Files (local) | Файлове сховище |
| TimescaleDB | SQLite (hypertable) | Часові ряди |
| MongoDB | SQLite (document) | Документи |

### Нові таблиці для 100 датасетів (v68.0-ELITE)

| Таблиця | Опис | Кількість записів |
|--------|------|-------------------|
| customs_officials | Митні чиновники | 50 |
| official_visits | Візити чиновників на митні пости | 100 |
| warehouse_registry | Реєстр складів | 30 |
| comtrade_data | Дані COMTRADE | 200 |
| media_investigations | Медіа-розслідування | 50 |
| financial_transactions | Фінансові транзакції | 300 |

### Seed дані

| Сутність | Кількість |
|----------|-----------|
| Компанії | 500 |
| Транзакції | 2000 |
| Алерти | 120 |
| Оцінки ризику | ~250 |
| Graph Nodes | 500 |
| Graph Edges | ~1500 |
| Користувачі | 4 |
| **Митні чиновники** | **50** |
| **Візити чиновників** | **100** |
| **Склади** | **30** |
| **COMTRADE дані** | **200** |
| **Медіа-розслідування** | **50** |
| **Фінансові транзакції** | **300** |

### API Endpoints (105 async функцій + 100 аналітичних датасетів)

- **Health & Monitoring** — `/health`, `/api/v1/health`, `/api/v1/azr/status`
- **Auth** — login, me
- **Companies** — CRUD, CSV export/import, фільтрація, пагінація
- **Transactions** — список з фільтрацією
- **Alerts** — список, resolve
- **Dashboard** — overview з агрегаціями
- **Risk Engine** — оцінка ризику компанії
- **OSINT** — due diligence, tools
- **Graph** — summary, subgraph
- **System** — stats, nodes, databases, logs, diagnostics, engines
- **Factory / OODA** — stats, patterns, start/stop
- **Tornado** — strategic radar
- **Wargaming** — scenarios
- **Agents** — AI agents list
- **Finance** — SWIFT, offshore, frozen assets, VaR
- **Maritime** — vessels, ports
- **Registries** — search, company by EDRPOU
- **Intel** — channels, messages, hot topics, disinfo
- **Prozorro** — tenders, stats, analytics
- **AI / Copilot** — query, chat, streaming, hypotheses
- **Ingestion** — upload, telegram, website, API, RSS
- **ETL** — jobs, status
- **UBO / PEP** — beneficiary map, PEP database
- **Geo** — risk events
- **M&A** — targets
- **Market** — entry scores
- **Monitoring** — cluster status
- **LLM** — providers
- **Neural** — training status, start/stop
- **Antigravity** — status, tasks
- **Customs** — declarations, statistics, HS codes, risk profiles
- **SSE** — real-time event stream
- **Admin v2** — telemetry, agents, chaos
- **100 Аналітичних Датасетів** — `/api/v1/datasets/` (список), `/api/v1/datasets/{1-100}` (конкретні датасети)

---

## ⚠️ Обмеження Kaggle

| Обмеження | Значення | Вплив |
|-----------|----------|-------|
| Час виконання | 12 годин (CPU) | Потрібно перезапускати |
| Диск | 20 GB output | Достатньо |
| RAM | 30 GB | Більш ніж достатньо |
| GPU | Недоступний (CPU mode) | Не потрібен для бекенду |
| Internet | Потрібен | Для zrok тунелю |
| Persistent Storage | Ні | БД перестворюється при перезапуску |

---

## 🔧 Troubleshooting

### zrok тунель не запускається
```bash
# Перевірити токен
echo $KAGGLE_SECRET_ZROK_TOKEN

# Спробувати вручну
./zrok disable
./zrok enable YOUR_TOKEN
./zrok share public http://localhost:8000 --headless
```

### Frontend не підключається
1. Перевірити що URL в `.env.local` відповідає URL з Kaggle
2. Перевірити CORS (має бути `allow_origins=["*"]`)
3. Спробувати відкрити `https://YOUR-URL.share.zrok.io/api/v1/health` у браузері

### Бекенд падає
- Перевірити логи в Kaggle notebook output
- Переконатися що Internet включений
- Перевірити що всі залежності встановлені

### SSE замість WebSocket
zrok не підтримує WebSocket. Використовується SSE (Server-Sent Events) на ендпоінті:
```
GET /api/v1/events/stream
```

---

## 🧪 Тестування 100 датасетів

Після запуску бекенду на Kaggle, ви можете протестувати 100 аналітичних датасетів:

### Отримання списку всіх датасетів
```bash
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/
```

### Тестування конкретних датасетів
```bash
# #1 Митний сплеск за розпорядженням
curl "https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/1-customs-spike?days_before=30&days_after=30"

# #2 Бум за ніч
curl "https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/2-overnight-import?days_threshold=7"

# #11 Профіль митного чиновника
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/11-customs-official-profile

# #21 Лінія впливу
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/21-line-of-influence

# #67 Вихід з тіні
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/67-exit-from-shadow

# #70 Відкатний каскад
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/70-rollback-cascade

# #83 Пункт віртуального призначення
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/83-virtual-destination-point

# #93 Країна, що не знає про свій експорт
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/93-country-that-does-not-know-about-its-export

# Будь-який датасет (загальний endpoint)
curl https://YOUR-ZROK-URL.share.zrok.io/api/v1/datasets/42
```

### Примітка
Kaggle backend використовує SQLite emulation та генеровані дані для тестування API endpoints та логіки датасетів. Для повноцінного тестування з реальними даними треба розгорнути на NVIDIA або NVIDIA сервер.

---

## 🔄 Автоматичний перезапуск

Kaggle сесія закінчується через 12 годин. Для автоматичного перезапуску:

1. Зберегти notebook
2. Використати Kaggle API:
```bash
pip install kaggle
kaggle kernels push -p ./kaggle-notebook
```

Або налаштувати GitHub Actions для автоматичного пушу нового notebook.

---

## 📁 Файли проекту

| Файл | Опис |
|------|------|
| `scripts/predator_kaggle_prod_v67.py` | Головний бекенд скрипт |
| `predator_kaggle_v67.ipynb` | Готовий Kaggle notebook |
| `KAGGLE_DEPLOY_INSTRUCTIONS.md` | Ці інструкції |
| `apps/predator-analytics-ui/.env.local` | Конфігурація фронтенду |
