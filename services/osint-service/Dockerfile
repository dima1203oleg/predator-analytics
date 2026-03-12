# PREDATOR OSINT Service — Multi-stage Dockerfile
# HR-05: НІКОЛИ root (USER predator)

FROM python:3.12-slim AS builder

WORKDIR /build

# Встановлюємо системні залежності для збірки
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо залежності
COPY pyproject.toml ./
COPY ../../libs/predator-common /libs/predator-common

# Встановлюємо Poetry та залежності
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-dev --no-interaction --no-ansi

# ============================================================
# Production image
# ============================================================
FROM python:3.12-slim AS production

# Мітки
LABEL maintainer="PREDATOR Engineering Team"
LABEL version="1.0.0"
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
COPY app/ ./app/

# Права доступу
RUN chown -R predator:predator /app

# Переключаємося на непривілейованого користувача
USER predator

# Порт
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Запуск
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
