# PREDATOR UTOS Service — Multi-stage Dockerfile
# HR-05: Multi-stage build, non-root user (USER predator)
# HR-01: Python 3.12 ONLY (playwright python image provides python environment)

# ============================================================
# Stage 1: Builder
# ============================================================
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy AS builder

WORKDIR /build

COPY services/utos/requirements.txt .
RUN pip install --timeout=1000 --retries=10 --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM mcr.microsoft.com/playwright/python:v1.42.0-jammy AS runtime

# Створюємо користувача predator
RUN useradd --create-home --shell /bin/bash predator

# Встановлюємо кириличні шрифти для генерації PDF звітів
RUN apt-get update && apt-get install -y fonts-dejavu && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копіюємо Python пакети
COPY --from=builder /install/local /usr/local

# Копіюємо application code
COPY --chown=predator:predator services/utos /app/utos

USER predator

ENV PYTHONPATH=/app \
    HOST=0.0.0.0 \
    PORT=8003

EXPOSE 8003

CMD ["uvicorn", "utos.main:app", "--host", "0.0.0.0", "--port", "8003"]
