# Multi-stage build for Trinity Bot
FROM python:3.12-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir \
    aiogram \
    google-cloud-aiplatform \
    mistralai \
    opentelemetry-api \
    kubernetes \
    qdrant-client \
    asyncpg \
    SpeechRecognition \
    aiohttp \
    pydub \
    sqlalchemy \
    pydantic-settings \
    psycopg2-binary \
    google-generativeai

# Final stage
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy common libraries and the bot code
COPY libs /app/libs
COPY apps/trinity_bot /app/apps/trinity_bot

# Set PYTHONPATH to include the root and the bot directory
ENV PYTHONPATH="/app:/app/apps/trinity_bot"

# Run the bot
CMD ["python3", "apps/trinity_bot/bot/main.py"]
