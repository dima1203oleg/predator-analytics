# 🔄 Потоки Даних — Predator Analytics v45.0

## Основний ETL Pipeline

```
    FILE UPLOAD → VALIDATION → MinIO (RAW) → CELERY QUEUE
                                                   │
                    ┌──────────────────────────────┘
                    │
                    ▼
    ┌─────────────────────────────────────────────────────────┐
    │                  CELERY ETL WORKERS                      │
    │                                                          │
    │   EXTRACT → TRANSFORM → LOAD                             │
    │                           │                              │
    │              ┌────────────┼────────────┐                 │
    │              │            │            │                 │
    │              ▼            ▼            ▼                 │
    │        PostgreSQL    OpenSearch    Qdrant                │
    │       (Structured)   (Full-text)  (Vectors)              │
    └─────────────────────────────────────────────────────────┘
```

## Hybrid Search Flow

```
    User Query
         │
         ▼
    Query Parser (NLP)
         │
    ┌────┴────┬─────────┐
    │         │         │
    ▼         ▼         ▼
  SQL     Full-text  Semantic
(Postgres) (OpenSearch) (Qdrant)
    │         │         │
    └─────────┴─────────┘
              │
              ▼
      RRF Fusion + Ranking
              │
              ▼
      AI Enrichment (LiteLLM)
              │
              ▼
          Response
```

## Kafka Events

| Topic | Producer | Consumer |
|-------|----------|----------|
| `predator.data.ingested` | API | ETL Worker |
| `predator.cases.created` | API | Notifications |
| `predator.cases.analyzed` | Agents | Dashboard |
| `predator.system.alerts` | Monitor | Alerting |

## Backup Strategy

| Type | Frequency | Retention |
|------|-----------|-----------|
| WAL | Hourly | 24h |
| Full Dump | Daily | 7 days |
| Archive | Weekly | 30 days |

**RPO:** 1 hour | **RTO:** 30 minutes

*© 2026 Predator Analytics*
