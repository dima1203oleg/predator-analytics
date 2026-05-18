# PREDATOR Graph Service — Multi-stage Dockerfile v61.0-ELITE
# HR-05: Multi-stage build, non-root user (USER predator)
# HR-01: Python 3.12 ONLY

# ============================================================
# Stage 1: Builder
# ============================================================
FROM python:3.12-slim-bookworm AS builder

ENV POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_NO_INTERACTION=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && pip install --no-cache-dir "poetry==1.8.5" \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY libs/ /libs/
COPY services/graph-service/pyproject.toml services/graph-service/poetry.lock* ./
COPY services/graph-service/app/ ./app/

RUN poetry install --no-root

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM python:3.12-slim-bookworm AS runtime

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app:/libs/predator-common:/app/services/shared" \
    APP_VERSION="61.0-ELITE"

WORKDIR /app

# HR-05: Ніколи root
RUN groupadd -g 1000 predator && \
    useradd -u 1000 -g predator -s /bin/bash -m predator && \
    chown -R predator:predator /app

COPY --from=builder /app/.venv /app/.venv
COPY --chown=predator:predator services/graph-service/app/ ./app/
COPY --chown=predator:predator services/shared/ ./services/shared/
COPY --chown=predator:predator libs/ /libs/

USER predator

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/v1/health')" || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
