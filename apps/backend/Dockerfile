# ============================================================
# Predator Analytics v55.0 - Backend Dockerfile (GOD-MODE)
# FastAPI + ML Services + Sovereign Autonomous Agents
# ============================================================

FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies (including psutil build deps)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    libmagic-dev \
    libmagic1 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from root
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code and libs from root context
COPY app ./app
COPY libs ./libs

# Set Python environment
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_VERSION=55.0.0

# Health check (Use the new v45 status endpoint)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health/live || exit 1

# Expose port (Internal FastAPI port)
EXPOSE 8000

# Labels
LABEL maintainer="Predator Analytics Team"
LABEL version="55.0.0"
LABEL description="Predator Analytics Backend - God-Mode Sovereignty"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
