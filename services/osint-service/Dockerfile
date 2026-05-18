# PREDATOR OSINT Service — Multi-stage Dockerfile
# HR-05: НІКОЛИ root (USER predator)

FROM python:3.12-slim AS builder

WORKDIR /build

ENV PIP_NO_CACHE_DIR=1

# Встановлюємо системні залежності для збірки
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо залежності
COPY services/osint-service/pyproject.toml ./
COPY libs/predator-common /libs/predator-common

# Встановлюємо Poetry та залежності
RUN pip install --no-cache-dir "poetry==1.8.5" && \
    poetry config virtualenvs.create false && \
    poetry install --only main --no-interaction --no-ansi

# ============================================================
# Production image
# ============================================================
FROM python:3.12-slim AS production

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
RUN pip install --no-cache-dir \
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
