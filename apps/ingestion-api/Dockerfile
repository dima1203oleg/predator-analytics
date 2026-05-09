# 🚀 PREDATOR Analytics - Ingestion API v61.0-ELITE
# Compliance: HR-01 (Python 3.12), HR-05 (Non-root user)

# Stage 1: Builder
FROM python:3.12-slim as builder

WORKDIR /app

# Встановлення системних залежностей для компіляції (librdkafka)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim

# Створення користувача predator згідно з HR-05
RUN groupadd -r predator && useradd -r -g predator -m -s /sbin/nologin predator

WORKDIR /app

# Встановлення лише необхідних runtime бібліотек
RUN apt-get update && apt-get install -y --no-install-recommends \
    librdkafka1 \
    && rm -rf /var/lib/apt/lists/*

# Копіювання встановлених пакетів з builder
COPY --from=builder /root/.local /home/predator/.local
ENV PATH=/home/predator/.local/bin:$PATH
ENV PYTHONPATH=/app

# Налаштування прав доступу
RUN chown -R predator:predator /app

# Копіювання коду застосунку
# Примітка: Копіюємо libs з кореня проєкту (якщо вони там є)
COPY libs/ /app/libs/
COPY apps/ingestion-api/app/ /app/app/

# Перемикання на безпечного користувача
USER predator

EXPOSE 8000

# Запуск FastAPI через uvicorn з оптимізаціями
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--log-level", "info"]
