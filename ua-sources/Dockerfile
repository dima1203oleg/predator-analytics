# ==========================================
# Predator Analytics Backend - Optimized
# Multi-stage build
# ==========================================

# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies to temporary prefix
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt
# Ensure async drivers are present
RUN pip install --no-cache-dir --prefix=/install psycopg2-binary asyncpg

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Install minimal runtime libs
RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Environment setup
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["uvicorn", "app.main_v21:app", "--host", "0.0.0.0", "--port", "8000"]
