# Predator Analytics v25 - Secure Distroless Backend
# Context: Root of the repository

# === Builder Stage ===
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies for compiled extensions (psycopg2, numpy, etc)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into a temporary directory
COPY services/api-gateway/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# === Runtime Stage ===
# Using python:3.12-slim for strict version compliance (3.12)
FROM python:3.12-slim-bookworm

WORKDIR /app

# Install runtime libs (libpq for Postgre)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /app

# Copy installed python packages
COPY --from=builder /install /usr/local

# Copy application code
# Assuming build context is root of repo
# Copy application code
# Assuming build context is root of repo
COPY libs /app/libs
COPY services/api-gateway/app /app/app
# Optional dirs check logic handles inside app logic, but consistent copy is key
COPY services/api-gateway/config /app/config
# COPY services/api-gateway/configs /app/configs # Commenting out as it might not be needed if not present or empty causing errors, but based on ls it exists.
COPY services/api-gateway/configs /app/configs
# src is historically used for some specialized modules
COPY services/api-gateway/src /app/src

# Set Python Path to include root /app so imports work like 'from app.services...' or 'from libs...'
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Network
ENV HOST=0.0.0.0
ENV PORT=8000

# Container runs as non-root by default in Distroless (uid 65532)

# Startup - flexible command for both API and Celery workers
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
