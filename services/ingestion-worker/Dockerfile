# PREDATOR Ingestion Worker — Multi-stage Dockerfile v58.2-WRAITH
# HR-05: Multi-stage build, non-root user (USER predator)
# HR-01: Python 3.12 ONLY

# ============================================================
# Stage 1: Builder
# ============================================================
FROM python:3.12-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# predator-common
COPY libs/predator-common /libs/predator-common
RUN pip install --prefix=/install /libs/predator-common

# Worker залежності
COPY services/ingestion-worker/pyproject.toml .
COPY services/ingestion-worker/requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# HR-05: Ніколи root
RUN useradd --create-home --shell /bin/bash predator

WORKDIR /app

COPY --from=builder /install /usr/local
COPY --chown=predator:predator libs/predator-common /libs/predator-common
COPY --chown=predator:predator services/ingestion-worker/app/ ./app/

USER predator

ENV PYTHONPATH="/app:/libs/predator-common" \
    PYTHONUNBUFFERED=1 \
    APP_VERSION="58.2-WRAITH"

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["python", "-m", "app.main"]
