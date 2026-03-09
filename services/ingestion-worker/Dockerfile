# PREDATOR Ingestion Worker Dockerfile - v55.1 Ironclad
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
COPY pyproject.toml ./
# COPY local libs if needed
COPY libs/predator-common /app/libs/predator-common

RUN /opt/poetry/bin/poetry install --no-dev

FROM python:3.12-slim AS runtime

RUN useradd -ms /bin/bash predator
USER predator
WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY services/ingestion-worker/app /app/app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app"

CMD ["python", "app/main.py"]
