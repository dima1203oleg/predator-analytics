# Dockerfile for Predator Analytics Core API (FastAPI)
# Python 3.12 slim image, strict typing, Ruff, ruff, mypy, poetry for deps
# Build stage
FROM python:3.12-slim AS builder

# System deps (no root, use non‑root user later)
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl && rm -rf /var/lib/apt/lists/*

# Create a non‑root user
ARG USER=predator
RUN useradd -ms /bin/bash $USER

# Set workdir
WORKDIR /app

# Install uv (fast Python package manager) – required by project
RUN curl -LsSf https://github.com/astral-sh/uv/releases/latest/download/uv-linux-x86_64.tar.gz | tar -xz -C /usr/local/bin uv

# Copy pyproject & lock files
COPY pyproject.toml poetry.lock ./

# Install dependencies (no‑dev)
RUN uv pip install --system --no-cache-dir -r <(uv pip compile pyproject.toml --no-dev)

# Copy source code
COPY . .

# Runtime stage
FROM python:3.12-slim AS runtime

ARG USER=predator
RUN useradd -ms /bin/bash $USER && \
    mkdir /app && chown $USER:$USER /app
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy only needed source files (avoid .git, tests, etc.)
COPY app ./app
COPY docs ./docs
COPY alembic ./alembic
COPY scripts ./scripts

# Set env vars (production)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_SYSTEM_PYTHON=1

USER $USER

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
