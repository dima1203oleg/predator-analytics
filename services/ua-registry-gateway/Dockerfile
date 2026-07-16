# ─────────────────────────────────────────────
# Stage 1: builder
# ─────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

# Встановлюємо залежності для збірки
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Копіюємо тільки requirements для кешу шарів
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─────────────────────────────────────────────
# Stage 2: runtime (HR-05: non-root USER predator)
# ─────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Системний user predator (HR-05)
RUN groupadd --gid 1001 predator && \
    useradd --uid 1001 --gid predator --shell /bin/bash --create-home predator

# Копіюємо встановлені пакети зі stage builder
COPY --from=builder /install /usr/local

# Копіюємо код застосунку
COPY --chown=predator:predator app/ ./app/

# Переключаємось на non-root user (HR-05)
USER predator

# Відкриваємо порт сервісу
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')"

# Запуск через uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002", "--workers", "2"]
