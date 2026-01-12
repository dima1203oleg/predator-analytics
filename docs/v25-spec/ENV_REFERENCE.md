# 🔐 Environment Variables Reference — Predator v25.0

> **Версія:** 25.0
> **Оновлено:** 10.01.2026

---

## Зміст

1. [Core Application](#1-core-application)
2. [Database](#2-database)
3. [Redis & Caching](#3-redis--caching)
4. [AI/LLM Configuration](#4-aillm-configuration)
5. [Search & Indexing](#5-search--indexing)
6. [Security & Auth](#6-security--auth)
7. [Storage](#7-storage)
8. [Messaging & Queues](#8-messaging--queues)
9. [Monitoring](#9-monitoring)
10. [Feature Flags](#10-feature-flags)

---

## 1. Core Application

### Backend (FastAPI)

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `APP_ENV` | Середовище | `development`, `staging`, `production` | ✅ |
| `APP_DEBUG` | Debug режим | `true`, `false` | ❌ |
| `APP_HOST` | Host сервера | `0.0.0.0` | ❌ |
| `APP_PORT` | Port сервера | `8000` | ❌ |
| `APP_WORKERS` | Кількість workers | `4` | ❌ |
| `APP_LOG_LEVEL` | Рівень логування | `DEBUG`, `INFO`, `WARNING`, `ERROR` | ❌ |
| `APP_SECRET_KEY` | Секретний ключ | `your-secret-key-here` | ✅ |
| `APP_ALLOWED_HOSTS` | Дозволені hosts | `localhost,predator.ai` | ✅ |
| `APP_CORS_ORIGINS` | CORS origins | `http://localhost,https://predator.ai` | ✅ |

### Frontend (Vite/React)

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000/api/v1` | ✅ |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8000/ws` | ✅ |
| `VITE_APP_TITLE` | Назва додатку | `Predator Analytics` | ❌ |
| `VITE_ENABLE_3D` | 3D візуалізації | `true`, `false` | ❌ |
| `VITE_SENTRY_DSN` | Sentry для errors | `https://...@sentry.io/...` | ❌ |
| `VITE_GA_ID` | Google Analytics | `G-XXXXXXXXXX` | ❌ |

---

## 2. Database

### PostgreSQL

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `DATABASE_URL` | Повний connection string | `postgresql://user:pass@host:5432/db` | ✅ |
| `POSTGRES_HOST` | Host бази | `localhost`, `postgres` | ✅ |
| `POSTGRES_PORT` | Port | `5432` | ❌ |
| `POSTGRES_USER` | Користувач | `predator` | ✅ |
| `POSTGRES_PASSWORD` | Пароль | `secret` | ✅ |
| `POSTGRES_DB` | Назва бази | `predator_db` | ✅ |
| `POSTGRES_SSL_MODE` | SSL режим | `disable`, `require`, `verify-full` | ❌ |
| `POSTGRES_POOL_SIZE` | Розмір пулу | `20` | ❌ |
| `POSTGRES_MAX_OVERFLOW` | Max overflow | `10` | ❌ |

### Connection String Format

```bash
# Стандартний
DATABASE_URL=postgresql://predator:password@localhost:5432/predator_db

# З SSL
DATABASE_URL=postgresql://predator:password@localhost:5432/predator_db?sslmode=require

# Asyncio
DATABASE_URL_ASYNC=postgresql+asyncpg://predator:password@localhost:5432/predator_db
```

---

## 3. Redis & Caching

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `REDIS_URL` | Повний URL | `redis://localhost:6379/0` | ✅ |
| `REDIS_HOST` | Host | `localhost`, `redis` | ✅ |
| `REDIS_PORT` | Port | `6379` | ❌ |
| `REDIS_PASSWORD` | Пароль | `secret` | ❌ |
| `REDIS_DB` | Номер бази | `0` | ❌ |
| `REDIS_SSL` | SSL | `true`, `false` | ❌ |
| `CACHE_TTL` | Default TTL (сек) | `3600` | ❌ |
| `CACHE_PREFIX` | Prefix ключів | `predator:` | ❌ |

### Redis URL Formats

```bash
# Без пароля
REDIS_URL=redis://localhost:6379/0

# З паролем
REDIS_URL=redis://:password@localhost:6379/0

# SSL
REDIS_URL=rediss://:password@localhost:6379/0

# Sentinel
REDIS_URL=redis+sentinel://localhost:26379/mymaster/0
```

---

## 4. AI/LLM Configuration

### LiteLLM Gateway

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `LITELLM_MASTER_KEY` | Master API key | `sk-1234567890` | ✅ |
| `LITELLM_CONFIG_PATH` | Шлях до конфігу | `/app/configs/litellm_config.yaml` | ❌ |
| `LITELLM_PORT` | Port | `4000` | ❌ |
| `LITELLM_LOG_LEVEL` | Log level | `DEBUG`, `INFO` | ❌ |

### LLM Providers

| Змінна | Опис | Required |
|--------|------|----------|
| `GROQ_API_KEY` | Groq Cloud API key | ✅ (primary) |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ (fallback) |
| `OPENAI_API_KEY` | OpenAI API key | ❌ |
| `ANTHROPIC_API_KEY` | Claude API key | ❌ |
| `AZURE_API_KEY` | Azure OpenAI key | ❌ |
| `AZURE_API_BASE` | Azure endpoint | ❌ |
| `AWS_ACCESS_KEY_ID` | AWS Bedrock | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS Bedrock | ❌ |
| `OLLAMA_BASE_URL` | Local Ollama | `http://localhost:11434` |

### LLM Settings

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `LLM_DEFAULT_MODEL` | Default модель | `groq/llama-3.1-8b-instant` | ❌ |
| `LLM_TIMEOUT` | Timeout (сек) | `60` | ❌ |
| `LLM_MAX_TOKENS` | Max tokens | `4096` | ❌ |
| `LLM_TEMPERATURE` | Temperature | `0.7` | ❌ |
| `LLM_CACHE_ENABLED` | Кешування | `true` | ❌ |
| `LLM_CACHE_TTL` | Cache TTL (сек) | `3600` | ❌ |

---

## 5. Search & Indexing

### OpenSearch

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `OPENSEARCH_URL` | URL | `http://localhost:9200` | ✅ |
| `OPENSEARCH_USER` | Користувач | `admin` | ❌ |
| `OPENSEARCH_PASSWORD` | Пароль | `admin` | ❌ |
| `OPENSEARCH_INDEX_PREFIX` | Prefix індексів | `predator_` | ❌ |
| `OPENSEARCH_SSL_VERIFY` | SSL verify | `true`, `false` | ❌ |

### Qdrant (Vector DB)

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `QDRANT_URL` | URL | `http://localhost:6333` | ✅ |
| `QDRANT_API_KEY` | API key | `secret` | ❌ |
| `QDRANT_COLLECTION` | Default collection | `threats` | ❌ |
| `QDRANT_VECTOR_SIZE` | Vector size | `384` | ❌ |

### Embeddings

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `EMBEDDING_MODEL` | Модель | `all-MiniLM-L6-v2` | ❌ |
| `EMBEDDING_DEVICE` | Device | `cpu`, `cuda` | ❌ |
| `SPLADE_MODEL` | SPLADE модель | `naver/splade-cocondenser-ensembledistil` | ❌ |

---

## 6. Security & Auth

### JWT Configuration

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `JWT_SECRET_KEY` | Секретний ключ | `super-secret-key` | ✅ |
| `JWT_ALGORITHM` | Алгоритм | `HS256`, `RS256` | ❌ |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Час життя | `30` | ❌ |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token | `7` | ❌ |

### OAuth/OIDC

| Змінна | Опис | Required |
|--------|------|----------|
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth | ❌ |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth | ❌ |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth | ❌ |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth | ❌ |
| `OIDC_ISSUER` | OIDC issuer | ❌ |
| `OIDC_CLIENT_ID` | OIDC client | ❌ |

### PQC (Post-Quantum Cryptography)

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `PQC_ENABLED` | Увімкнути PQC | `true`, `false` | ❌ |
| `PQC_KEM_ALGORITHM` | KEM алгоритм | `Kyber768` | ❌ |
| `PQC_SIG_ALGORITHM` | Signature алгоритм | `Dilithium3` | ❌ |

### Session

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `SESSION_DRIVER` | Driver | `redis`, `database` | ❌ |
| `SESSION_LIFETIME` | Час (хв) | `120` | ❌ |
| `SESSION_SECURE` | Secure cookie | `true` | ❌ |

---

## 7. Storage

### MinIO (S3-Compatible)

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `MINIO_ENDPOINT` | Endpoint | `localhost:9000` | ✅ |
| `MINIO_ACCESS_KEY` | Access key | `minioadmin` | ✅ |
| `MINIO_SECRET_KEY` | Secret key | `minioadmin` | ✅ |
| `MINIO_BUCKET` | Default bucket | `predator` | ❌ |
| `MINIO_SECURE` | HTTPS | `true`, `false` | ❌ |

### AWS S3 (Alternative)

| Змінна | Опис | Required |
|--------|------|----------|
| `AWS_S3_BUCKET` | Bucket name | ❌ |
| `AWS_S3_REGION` | Region | ❌ |
| `AWS_ACCESS_KEY_ID` | Access key | ❌ |
| `AWS_SECRET_ACCESS_KEY` | Secret key | ❌ |

---

## 8. Messaging & Queues

### Kafka

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `KAFKA_BOOTSTRAP_SERVERS` | Servers | `localhost:9092` | ✅ |
| `KAFKA_SECURITY_PROTOCOL` | Protocol | `PLAINTEXT`, `SSL`, `SASL_SSL` | ❌ |
| `KAFKA_SASL_MECHANISM` | SASL | `PLAIN`, `SCRAM-SHA-256` | ❌ |
| `KAFKA_SASL_USERNAME` | Username | ❌ | ❌ |
| `KAFKA_SASL_PASSWORD` | Password | ❌ | ❌ |
| `KAFKA_CONSUMER_GROUP` | Group ID | `predator-consumers` | ❌ |

### Celery

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `CELERY_BROKER_URL` | Broker | `redis://localhost:6379/1` | ✅ |
| `CELERY_RESULT_BACKEND` | Backend | `redis://localhost:6379/2` | ❌ |
| `CELERY_TASK_ALWAYS_EAGER` | Sync mode | `true`, `false` | ❌ |
| `CELERY_WORKER_CONCURRENCY` | Concurrency | `4` | ❌ |

### Temporal

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `TEMPORAL_HOST` | Host | `localhost:7233` | ✅ |
| `TEMPORAL_NAMESPACE` | Namespace | `predator` | ❌ |
| `TEMPORAL_TASK_QUEUE` | Task queue | `predator-tasks` | ❌ |

---

## 9. Monitoring

### Prometheus

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `PROMETHEUS_ENABLED` | Увімкнути | `true` | ❌ |
| `PROMETHEUS_PORT` | Port | `9090` | ❌ |

### Sentry

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `SENTRY_DSN` | DSN | `https://...@sentry.io/...` | ❌ |
| `SENTRY_ENVIRONMENT` | Environment | `production` | ❌ |
| `SENTRY_TRACES_SAMPLE_RATE` | Sample rate | `0.1` | ❌ |

### OpenTelemetry

| Змінна | Опис | Приклад | Required |
|--------|------|---------|----------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Endpoint | `http://localhost:4317` | ❌ |
| `OTEL_SERVICE_NAME` | Service name | `predator-api` | ❌ |
| `OTEL_TRACES_SAMPLER` | Sampler | `parentbased_traceidratio` | ❌ |

---

## 10. Feature Flags

| Змінна | Опис | Default |
|--------|------|---------|
| `FEATURE_HYBRID_SEARCH` | Гібридний пошук | `true` |
| `FEATURE_PQC_ENCRYPTION` | PQC шифрування | `false` |
| `FEATURE_SELF_HEALING` | Self-healing | `true` |
| `FEATURE_AI_AGENTS` | AI агенти | `true` |
| `FEATURE_VOICE_INPUT` | Голосовий ввід | `true` |
| `FEATURE_3D_VISUALIZATION` | 3D візуалізації | `true` |
| `FEATURE_TACTICAL_MODE` | Mobile tactical | `true` |
| `FEATURE_DARK_MODE` | Dark mode | `true` |

---

## 📋 Приклад .env файлу

```bash
# .env.example

# === Core ===
APP_ENV=development
APP_DEBUG=true
APP_SECRET_KEY=your-super-secret-key-change-in-production

# === Database ===
DATABASE_URL=postgresql://predator:password@localhost:5432/predator_db
POSTGRES_HOST=localhost
POSTGRES_USER=predator
POSTGRES_PASSWORD=password
POSTGRES_DB=predator_db

# === Redis ===
REDIS_URL=redis://localhost:6379/0

# === LLM ===
GROQ_API_KEY=gsk_your_groq_key
GEMINI_API_KEY=your_gemini_key
LLM_DEFAULT_MODEL=groq/llama-3.1-8b-instant

# === Search ===
OPENSEARCH_URL=http://localhost:9200
QDRANT_URL=http://localhost:6333

# === Security ===
JWT_SECRET_KEY=your-jwt-secret-key

# === Storage ===
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# === Messaging ===
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
TEMPORAL_HOST=localhost:7233

# === Feature Flags ===
FEATURE_HYBRID_SEARCH=true
FEATURE_AI_AGENTS=true
```

---

## 🔒 Security Best Practices

1. **Ніколи не комітьте `.env` файли**
2. Використовуйте **secrets management** (Vault, AWS Secrets Manager)
3. **Ротація ключів** кожні 90 днів
4. Різні ключі для **різних середовищ**
5. Мінімальні права (**principle of least privilege**)

---

*© 2026 Predator Analytics. Усі права захищено.*
