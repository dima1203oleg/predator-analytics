# ============================================================
# Predator Analytics v22.0 - Backend Dockerfile
# FastAPI + ML Services + Multi-Agent System
# ============================================================

FROM python:3.12-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    libmagic-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY apps/backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY apps/backend/app ./app
COPY apps/backend/src ./src

# Copy shared libraries
COPY libs ./libs

# Set Python environment
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Labels
LABEL maintainer="Predator Analytics Team"
LABEL version="22.0.0"
LABEL description="Predator Analytics Backend - Semantic Search Platform"

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
