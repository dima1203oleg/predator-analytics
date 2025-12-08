# 📊 DATA LAYER STATUS REPORT

**Дата:** 8 грудня 2025  
**Статус:** ✅ OPERATIONAL

---

## 🗄️ Бази Даних (PostgreSQL як System of Record)

| База | Статус | Версія | Деталі |
|------|--------|--------|--------|
| **PostgreSQL** | ✅ CONNECTED | 15.15 | 11 таблиць, 11.52 MB |
| **Redis** | ✅ CONNECTED | 7.4.7 | 1.72 MB cache |
| **Qdrant** | ✅ CONNECTED | - | 1 колекція, 6 vectors |
| **OpenSearch** | ✅ CONNECTED | 2.11+ | 3 індекси, yellow cluster |
| **MinIO** | ✅ CONNECTED | - | Object storage active |

---

## 📋 PostgreSQL Tables (System of Record)

| Таблиця | Призначення | Записів |
|---------|-------------|---------|
| `ua_customs_imports` | Митні імпорти | 1,000 |
| `staging_customs` | Staging митних даних | 0 |
| `staging_general` | Загальний staging | 0 |
| `staging_generic` | Generic staging | 0 |
| `users` | Користувачі системи | 0 |
| `user_tokens` | Токени авторизації | 0 |
| `ml_models` | ML моделі реєстр | 0 |
| `search_logs` | Логи пошуку | 0 |
| `rate_limits` | Rate limiting | 0 |
| `analytics_events` | Аналітичні події | 0 |
| `document_summaries` | Резюме документів | 0 |

---

## 🔍 OpenSearch Indices

| Індекс | Документів | Розмір | Статус |
|--------|-----------|--------|--------|
| `customs-v1` | 1,000 | 974.8 KB | ✅ green |
| `customs-v2` | 1,000 | 3.1 MB | ⚠️ yellow |
| `documents_safe` | 2,009 | 1.8 MB | ✅ green |

---

## 🔮 Qdrant Vector Collections

| Колекція | Vectors | Dimensions | Distance |
|----------|---------|------------|----------|
| `documents_vectors` | 6 | 384 | Cosine |

---

## 🇺🇦 Ukrainian Data Sources

| Джерело | API Endpoint | Статус | Записів |
|---------|-------------|--------|---------|
| **Prozorro** | prozorro.gov.ua/api | ✅ ACTIVE | ~12.5M |
| **ЄДР** | data.gov.ua | ✅ ACTIVE | ~5.2M |
| **Митні декларації** | data.gov.ua | ✅ ACTIVE | ~8.9M |
| **Судовий реєстр** | reyestr.court.gov.ua | ✅ ACTIVE | ~42M |
| **Sanctions NAZK** | sanctions.nazk.gov.ua | ✅ ACTIVE | ~15K |
| **NBU Курси** | bank.gov.ua/NBU_Exchange | ✅ ACTIVE | Daily |
| **OpenDataBot** | opendatabot.ua/api | ⚙️ CONFIGURED | - |

---

## 🌐 API Endpoints (via Nginx 8082)
```
GET  /api/v1/databases/                 → Real DB status
GET  /api/v1/databases/{id}/status      → Specific DB status
GET  /api/v1/databases/vectors          → Qdrant collections
GET  /api/v1/databases/{id}/stats       → Database statistics
POST /api/v1/databases/query            → Execute SQL (proxied to 8001)
POST /api/v1/databases/backup           → Trigger backup

GET  /api/v1/sources/                   → Ukrainian sources list
GET  /api/v1/sources/connectors         → Available connectors
POST /api/v1/sources/connectors/{id}/test → Test connector
POST /api/v1/sources/connectors/{id}/sync → Start sync

GET  /api/v1/system/metrics             → CPU/Memory metrics

# Direct ports (for debugging):
# - ua-sources API: 8001
# - Backend API: 8080
```

---

## 🏗️ Architecture (Data Layer)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                   IS_TRUTH_ONLY_MODE = true                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Nginx Proxy    │
                    │  (port 8082)    │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  ua-sources  │  │ Backend API  │  │ Backend Task │
    │  (port 8001) │  │  (port 8080) │  │  Worker      │
    └──────┬───────┘  └──────┬───────┘  └──────────────┘
           │                 │
           └────────┬────────┘
                    │
    ┌───────────────┼───────────────────────────────────┐
    │               │                                    │
    ▼               ▼               ▼              ▼     │
┌────────┐   ┌──────────┐   ┌─────────────┐  ┌───────┐  │
│Postgres│   │OpenSearch│   │   Qdrant    │  │ Redis │  │
│(5432)  │   │  (9200)  │   │   (6333)    │  │(6379) │  │
│SoR Gold│   │Full-Text │   │  Vectors    │  │ Cache │  │
└────────┘   └──────────┘   └─────────────┘  └───────┘  │
                                                         │
                         ┌───────────────────────────────┘
                         ▼
                  ┌──────────────┐
                  │    MinIO     │
                  │    (9000)    │
                  │ Raw Storage  │
                  └──────────────┘
```

---

## ✅ Verification Commands

```bash
# Test databases endpoint
curl http://localhost:8082/api/v1/databases/ | jq

# Test sources endpoint  
curl http://localhost:8082/api/v1/sources/ | jq

# Test SQL execution
curl -X POST http://localhost:8082/api/v1/databases/query \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) FROM ua_customs_imports"}'

# Test Prozorro connector
curl -X POST http://localhost:8082/api/v1/sources/connectors/prozorro/test

# Test Customs connector
curl -X POST http://localhost:8082/api/v1/sources/connectors/customs/test
```

---

## 📈 Next Steps

1. **Apply Data Layer Schema** - Run `init_data_layer_schema()` to create full schema
2. **Implement Auto-Sync** - Cron jobs for periodic data fetching
3. **Enable Vector Indexing** - Auto-embed new documents to Qdrant
4. **OpenSearch Reindex** - Sync PostgreSQL → OpenSearch automatically
5. **Deploy to NVIDIA** - Priority server for production

---

*Last Updated: 2025-12-08 00:48 UTC*
