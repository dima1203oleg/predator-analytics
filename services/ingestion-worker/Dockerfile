# PREDATOR Ingestion Worker Dockerfile - v55.1 Ironclad
# HR-05: Multi-stage build, non-root user
FROM python:3.12-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    POETRY_VERSION=1.8.2 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 -

WORKDIR /app

# Копіюємо локальні ліби та файл проекту
COPY libs/predator-common /libs/predator-common
COPY services/ingestion-worker/pyproject.toml services/ingestion-worker/poetry.lock* ./

RUN /opt/poetry/bin/poetry install --only main --no-root

# ============================================================
# Runtime stage
# ============================================================
FROM python:3.12-slim AS runtime

# Встановлюємо runtime залежності
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# HR-05: Ніколи root
RUN useradd -ms /bin/bash predator
WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY --chown=predator:predator services/ingestion-worker/app/ ./app/
COPY --chown=predator:predator libs/predator-common /libs/predator-common

USER predator

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app:/libs/predator-common" \
    PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

CMD ["python", "-m", "app.main"]
