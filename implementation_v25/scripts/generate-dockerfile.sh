#!/bin/bash
# Predator v25 Dockerfile Generator
# Generates a standard, policy-compliant Dockerfile for Python services.

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: ./generate-dockerfile.sh <service_name>"
    echo "Example: ./generate-dockerfile.sh my-new-service"
    exit 1
fi

TARGET_FILE="apps/$SERVICE_NAME/Dockerfile"

# Check if directory exists
if [ ! -d "apps/$SERVICE_NAME" ]; then
    echo "Creating directory apps/$SERVICE_NAME..."
    mkdir -p "apps/$SERVICE_NAME"
fi

echo "Generating $TARGET_FILE..."

cat > "$TARGET_FILE" <<EOF
# Predator Analytics v25 - $SERVICE_NAME Service
# Context: Root of the repository

# === Builder Stage ===
FROM python:3.12-slim-bookworm AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    python3-dev \\
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY apps/$SERVICE_NAME/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# === Runtime Stage ===
FROM python:3.12-slim-bookworm

WORKDIR /app

# Runtime libs
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpq5 \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages
COPY --from=builder /install /usr/local

# Copy application code
COPY libs /app/libs
COPY apps/$SERVICE_NAME /app/app

ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["python", "-m", "app.main"]
EOF

echo "✅ Dockerfile generated successfully at $TARGET_FILE"
echo "⚠️  Don't forget to create apps/$SERVICE_NAME/requirements.txt!"
