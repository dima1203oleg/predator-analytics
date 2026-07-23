# PREDATOR Core API — Multi-stage Dockerfile v61.0-ELITE
# HR-05: Multi-stage build, non-root user (USER predator)
# HR-01: Python 3.12 ONLY

# ============================================================
# Stage 1: Builder — встановлення залежностей
# ============================================================
FROM python:3.12-bookworm AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Копіюємо predator-common спочатку (рідко змінюється — кешується)
COPY libs/predator-common /libs/predator-common
RUN pip install --timeout=1000 --retries=10 --prefix=/install /libs/predator-common

# Копіюємо requirements core-api
COPY services/core-api/requirements.txt .
RUN pip install --timeout=1000 --retries=10 --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: Runtime — тільки необхідне
# ============================================================
FROM python:3.12-slim-bookworm AS runtime

# Runtime системні залежності
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# HR-05: Ніколи root
RUN useradd --create-home --shell /bin/bash predator

WORKDIR /app

# Копіюємо встановлені Python пакети
COPY --from=builder /install /usr/local

# Копіюємо predator-common library
COPY --chown=predator:predator libs/predator-common /libs/predator-common

# Копіюємо application code
COPY --chown=predator:predator services/core-api/app/ ./app/
# 12. Копіюємо міграції
COPY --chown=predator:predator services/core-api/migrations/ ./migrations/
COPY --chown=predator:predator services/core-api/alembic.ini ./alembic.ini

# Створити директорію для offline Kafka повідомлень
RUN mkdir -p /app/data/kafka_offline && chown -R predator:predator /app/data

USER predator

ENV PYTHONPATH="/app:/libs/predator-common" \
    PYTHONUNBUFFERED=1 \
    APP_VERSION="61.0-ELITE"

# Cloud Run sets the PORT environment variable
ENV PORT=8000
EXPOSE ${PORT}

# Kubernetes probes
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/v1/health/live || exit 1

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --workers 1 --timeout-keep-alive 65 --access-log --log-level info"]
