FROM python:3.12-slim-bookworm as builder
# HR-05: Multi-stage, never root, Python 3.12 (HR-01)

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY services/core-api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ----------------- Runtime -----------------
FROM python:3.12-slim-bookworm as production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Create non-root user (HR-05)
RUN groupadd -g 10001 predator && \
    useradd -u 10001 -g predator -s /bin/sh -m predator && \
    apt-get update && apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy Python packages
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app

# Copy application code
COPY services/core-api/app/ ./app/
COPY libs/ /libs/
COPY services/shared/ /services/shared/

# Create logs directory
RUN mkdir -p /app/logs && chown -R predator:predator /app

# Set permissions
USER predator

# Ensure all dependencies are in Python path
ENV PYTHONPATH="/app:/libs/predator-common:/app/services/shared:$PYTHONPATH"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health/live || exit 1

EXPOSE 8000

# Run with uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop"]
