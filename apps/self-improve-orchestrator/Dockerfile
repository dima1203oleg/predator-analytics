FROM python:3.12-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    git \
    libmagic-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY apps/self-improve-orchestrator/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers and their system dependencies
RUN playwright install-deps chromium
RUN playwright install chromium

# Copy orchestrator code
COPY apps/self-improve-orchestrator ./orchestrator
# Legacy dependency on backend app structure (models/services)
COPY apps/backend/app ./app
# Shared Core Libraries
COPY libs ./libs
# CLI scripts for agents
COPY scripts ./scripts
RUN chmod +x ./scripts/*.py

# Create logs directory
RUN mkdir -p /app/logs

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

CMD ["python3", "-m", "orchestrator.main"]
