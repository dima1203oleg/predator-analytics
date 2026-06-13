# PREDATOR OSINT Service — Multi-stage Dockerfile
# HR-05: НІКОЛИ root (USER predator)

FROM python:3.12-slim-bookworm AS builder

WORKDIR /build

ENV PIP_NO_CACHE_DIR=1

# Встановлюємо системні залежності для збірки
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY libs/predator-common /libs/predator-common

# Встановлюємо Python залежності без важкого resolver Poetry
RUN pip install --timeout=1000 --retries=10 --no-cache-dir \
    /libs/predator-common \
    "fastapi>=0.110.0" \
    "uvicorn[standard]>=0.29.0" \
    "sqlalchemy[asyncio]>=2.0.29" \
    "asyncpg>=0.29.0" \
    "pydantic>=2.6.4" \
    "pydantic-settings>=2.2.1" \
    "celery[redis]>=5.3.6" \
    "redis>=5.0.0" \
    "aiokafka>=0.10.0" \
    "neo4j>=5.18.0" \
    "httpx>=0.27.0" \
    "aiofiles>=23.2.1" \
    "prometheus-client>=0.20.0" \
    "python-multipart>=0.0.9"

# ============================================================
# Production image
# ============================================================
FROM python:3.12-slim-bookworm AS production

# Мітки
LABEL maintainer="PREDATOR Engineering Team"
LABEL version="61.0-ELITE"
LABEL description="PREDATOR OSINT Service"

# Створюємо користувача (HR-05)
RUN groupadd -r predator && useradd -r -g predator predator

WORKDIR /app

# Встановлюємо OSINT інструменти
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    wget \
    unzip \
    libimage-exiftool-perl \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо Python залежності з builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Встановлюємо Python OSINT інструменти
RUN pip install --timeout=1000 --retries=10 --no-cache-dir \
    sherlock-project \
    maigret \
    theHarvester \
    photon

# Копіюємо код
COPY services/osint-service/app/ ./app/

# Права доступу
RUN chown -R predator:predator /app

# Переключаємося на непривілейованого користувача
USER predator

ENV APP_VERSION="61.0-ELITE"

# Порт (HR-10: канонічний порт OSINT Service)
EXPOSE 9200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:9200/health || exit 1

# Запуск
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9200"]
