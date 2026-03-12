# PREDATOR Analytics v55.1 Ironclad - Graph Service
FROM python:3.12-slim as builder

# Встановлення Poetry
ENV POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_NO_INTERACTION=1

RUN apt-get update && apt-get install -y curl build-essential \
    && curl -sSL https://install.python-poetry.org | python3 -

ENV PATH="$POETRY_HOME/bin:$PATH"

WORKDIR /app

# Копіюємо локальні ліби
COPY libs/ /libs/
COPY services/graph-service/pyproject.toml services/graph-service/poetry.lock* ./
COPY services/graph-service/app/ ./app/

# Встановлюємо залежності
RUN poetry install --no-root

FROM python:3.12-slim as runtime

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH="/app:/libs/predator-common:/app/services/shared"

WORKDIR /app

RUN groupadd -g 1000 predator && \
    useradd -u 1000 -g predator -s /bin/bash -m predator && \
    chown -R predator:predator /app

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY services/graph-service/app/ ./app/
COPY services/shared/ ./services/shared/
COPY libs/ /libs/

# USER predator (HR-05) - Non-root user
USER predator

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
