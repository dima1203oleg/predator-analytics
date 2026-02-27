# 📡 ETL Data Sources Integration (v45.1)

## Огляд

Система підтримує інтеграцію з різноманітними джерелами даних через уніфіковану архітектуру connectors:

- **Telegram канали** - парсинг публічних та приватних каналів
- **Web Scraping** - скрапінг веб-сайтів з підтримкою JS-рендерингу
- **RSS/Atom** - автоматичний парсинг новинних стрічок
- **Публічні реєстри України** - Prozorro, ЄДР, data.gov.ua, НБУ

## Архітектура

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI (AddSourceModal)                      │
│         /parsers → Кнопка "Додати Джерело" → Форма               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Gateway (FastAPI)                          │
│         /api/v45/sources → sources_management.py                 │
│         - POST /sources (create)                                 │
│         - POST /sources/test (test connection)                   │
│         - POST /sources/{id}/sync (trigger sync)                 │
│         - GET /sources/{id}/preview (preview data)               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Connectors Layer                             │
│   ┌─────────────────┐    ┌─────────────────┐                    │
│   │ TelegramChannel │    │   WebScraper    │                    │
│   │   Connector     │    │   Connector     │                    │
│   │   (Telethon)    │    │  (Playwright +  │                    │
│   │                 │    │  BeautifulSoup) │                    │
│   └────────┬────────┘    └────────┬────────┘                    │
│            │                      │                              │
│   ┌────────┴──────────────────────┴────────┐                    │
│   │         ConnectorRegistry               │                    │
│   └────────────────────┬────────────────────┘                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Celery ETL Workers                            │
│         parse_external_source (telegram, web, rss)               │
│                         ↓                                        │
│         staging.raw_data → process_staging_records               │
│                         ↓                                        │
│         gold.documents → index_gold_documents                    │
│                         ↓                                        │
│         OpenSearch + Qdrant (vectors)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Telegram Channel Connector

### Налаштування

Додайте в `.env`:

```bash
# Telegram API (отримати на https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_SESSION_NAME=predator_telegram_session
TELEGRAM_PHONE=+380XXXXXXXXX  # Ваш номер телефону
```

### Використання через API

```bash
# Тестування підключення
curl -X POST http://localhost:8000/api/v45/sources/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "telegram",
    "name": "Новини UA",
    "channelUsername": "ukr_news"
  }'

# Створення джерела
curl -X POST http://localhost:8000/api/v45/sources \
  -H "Content-Type: application/json" \
  -d '{
    "type": "telegram",
    "name": "Новини UA",
    "channelUsername": "ukr_news",
    "schedule": "0 * * * *",
    "sector": "GOV"
  }'

# Запуск синхронізації
curl -X POST http://localhost:8000/api/v45/sources/{source_id}/sync
```

### Методи Connector

```python
from app.connectors.telegram_channel import telegram_channel_connector

# Отримати інформацію про канал
info = await telegram_channel_connector.get_by_id("channel_name")

# Пошук повідомлень
messages = await telegram_channel_connector.search(
    query="keyword",
    limit=100,
    channel_username="channel_name"
)

# Підписка на канал
subscription = await telegram_channel_connector.subscribe_to_channel("channel_name")
```

## Web Scraper Connector

### Функціональність

- **Статичний HTML** - httpx + BeautifulSoup
- **Динамічний JS** - Playwright (Chrome headless)
- **RSS/Atom** - автоматичний парсинг фідів
- **data.gov.ua** - спеціалізований API

### Використання через API

```bash
# Скрапінг веб-сторінки
curl -X POST http://localhost:8000/api/v45/sources/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web",
    "name": "Новини Порталу",
    "url": "https://example.com/news",
    "usePlaywright": false,
    "followLinks": true,
    "maxDepth": 2
  }'

# RSS фід
curl -X POST http://localhost:8000/api/v45/sources/test \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rss",
    "name": "BBC News",
    "url": "https://feeds.bbci.co.uk/news/rss.xml"
  }'
```

### Методи Connector

```python
from app.connectors.web_scraper import web_scraper_connector

# Скрапінг сторінки (статичний)
result = await web_scraper_connector.search(
    "https://example.com/page",
    limit=10,
    use_playwright=False
)

# Скрапінг з JS рендерингом
result = await web_scraper_connector.search(
    "https://spa-app.com",
    use_playwright=True
)

# RSS парсинг
feed = await web_scraper_connector.scrape_rss_feed("https://feed.url/rss.xml")

# Датасет з data.gov.ua
dataset = await web_scraper_connector.scrape_gov_ua_dataset("dataset-id")
```

## UI: Додавання Джерел

### ParsersView (`/parsers`)

Сторінка містить:
- Кнопку **"Додати Джерело"** (зелений градієнт)
- Картку **"Пряма Ін'єкція Файлів"** (кліка на неї теж відкриває модал)

### AddSourceModal

Модальне вікно з двома кроками:

1. **Вибір типу** - Telegram, Web, RSS, Registry, API
2. **Конфігурація**:
   - Назва джерела
   - Специфічні поля (URL, channelUsername, API key)
   - Розклад оновлення (cron)
   - Сектор

### Кнопки:
- **Тестувати** - перевірка підключення без збереження
- **Зберегти** - створення джерела в БД

## Celery Task

### parse_external_source

```python
from app.tasks.etl_workers import parse_external_source

# Telegram
parse_external_source.delay("telegram", {
    "channelUsername": "news_ua",
    "limit": 100
})

# Web
parse_external_source.delay("web", {
    "url": "https://example.com",
    "usePlaywright": True,
    "followLinks": True,
    "maxDepth": 2
})

# RSS
parse_external_source.delay("rss", {
    "url": "https://feed.example.com/rss"
})
```

## База Даних

### gold.data_sources

```sql
CREATE TABLE gold.data_sources (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) NOT NULL,  -- file, api, telegram, registry
    connector VARCHAR(50) NOT NULL,    -- upload, telegram_channel, web_scraper
    status VARCHAR(50) DEFAULT 'draft', -- draft, parsing, indexed, error
    tenant_id UUID NOT NULL,
    config JSONB DEFAULT '{}',
    sector VARCHAR(50),                 -- GOV, BIZ, MED, SCI
    schedule JSONB,                     -- {"cron": "0 * * * *"}
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### staging.raw_data

Нові dataset_type:
- `telegram_messages`
- `web_pages`
- `rss_items`

## Залежності

Додані в `requirements.txt`:

```
Telethon          # Telegram MTProto client
beautifulsoup4    # HTML parsing
lxml              # XML/HTML parser
feedparser        # RSS/Atom parsing
```

Playwright встановлюється через:

```bash
pip install playwright
playwright install chromium
```

## Безпека

### Telegram
- API credentials зберігаються в `.env`
- Session file (`*.session`) НЕ комітиться в git
- Авторизація потребує 2FA код при першому запуску

### Web Scraper
- Чорний список доменів (соцмережі, пошукові системи)
- Rate limiting (500ms між запитами)
- User-Agent ідентифікація

### API
- JWT авторизація для всіх endpoints
- Tenant isolation
- API keys шифруються перед збереженням

## Моніторинг

### Метрики (Prometheus)
- `predator_source_sync_total` - кількість синхронізацій
- `predator_source_sync_duration_seconds` - тривалість
- `predator_source_records_fetched` - отримано записів

### Логи (структуровані)
```json
{
  "event": "ingestion_completed",
  "source_type": "telegram",
  "records_fetched": 127,
  "timestamp": "2026-01-21T13:00:00Z"
}
```

## Roadmap

- [ ] Real-time streaming для Telegram (WebSocket)
- [ ] Selenium Grid для масштабування Playwright
- [ ] OCR для зображень в Telegram
- [ ] Автоматичне визначення схеми контенту
