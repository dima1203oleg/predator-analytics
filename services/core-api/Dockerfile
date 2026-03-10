FROM python:3.12-slim-bookworm as builder
# HR-05: Multi-stage, never root, Python 3.12 (HR-01)

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/root/.local/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копіюємо локальні ліби та файл проекту
COPY libs/ /libs/
COPY services/core-api/pyproject.toml .
# Встановлення Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi --no-root \
    && pip install setuptools

# ----------------- Runtime -----------------
FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN groupadd -g 10001 predator && \
    useradd -u 10001 -g predator -s /bin/sh -m predator && \
    apt-get update && apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

WORKDIR /app
COPY services/core-api/app/ ./app/
COPY services/shared/ ./services/shared/
COPY libs/ /libs/

# Додаємо лібу спільну (якщо монтується) або встановлюємо з локального source.
# Але оскільки ми в docker, краще мати її як submodule або install з локального wheel

USER predator

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop"]
