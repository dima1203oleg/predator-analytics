# 🦅 PREDATOR Analytics v61.0-ELITE — Core API Dockerfile
# Compliance: HR-01 (Python 3.12), HR-05 (Multi-stage, USER predator)

# ============================================================
# Stage 1: Builder
# ============================================================
FROM python:3.12-slim as builder

WORKDIR /app

# Встановлення системних залежностей для збірки
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Встановлення залежностей Python у локальну директорію користувача
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM python:3.12-slim as runtime

# Створення користувача predator згідно з HR-05
RUN groupadd -r predator && useradd -r -g predator -m -s /sbin/nologin predator

WORKDIR /app

# Встановлення runtime-залежностей (libpq для PostgreSQL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Копіювання встановлених пакетів з builder
COPY --from=builder /root/.local /home/predator/.local
ENV PATH=/home/predator/.local/bin:$PATH
ENV PYTHONPATH=/app

# Налаштування прав доступу
RUN chown -R predator:predator /app

# Копіювання коду застосунку
COPY --chown=predator:predator . .

# Компіляція файлів перекладу (HR-04)
RUN if [ -d "locales" ]; then \
    msgfmt locales/uk/LC_MESSAGES/messages.po -o locales/uk/LC_MESSAGES/messages.mo || true; \
    fi

# Перемикання на безпечного користувача
USER predator

# Експорт порту (за замовчуванням 8000 для PREDATOR)
EXPOSE 8000

# Змінні середовища для оптимізації Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Команда запуску Core API
CMD ["python", "-m", "app.main"]
