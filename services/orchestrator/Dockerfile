FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright dependencies (full set for Chromium)
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libcups2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements (lightweight version without PyTorch)
COPY services/orchestrator/requirements-lite.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium

# Copy orchestrator code
COPY services/orchestrator ./orchestrator
# Legacy dependency on backend app structure (models/services)
COPY services/api-gateway/app ./app
# Shared Core Libraries
COPY libs ./libs
# CLI scripts for agents (optional)
# Note: scripts directory may not exist, build context will fail if missing
# COPY scripts ./scripts

# Create logs directory
RUN mkdir -p /app/logs

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["python3", "-m", "orchestrator.main"]
