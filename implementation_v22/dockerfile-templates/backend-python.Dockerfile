# Backend Multi-stage Dockerfile template
# - builder: python:3.11-slim
# - runtime: gcr.io/distroless/python3

FROM python:3.11-slim AS builder

WORKDIR /app

# Install build tools and system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    curl \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtualenv in /opt/venv to avoid copying global site packages
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install wheel
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Optional: Run test or build steps specific to your app
# RUN python -m pytest -q

# Final minimal image
FROM gcr.io/distroless/python3

# Copy venv and app
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app
WORKDIR /app

ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD ["/opt/venv/bin/python", "-c", "import urllib.request, sys; urllib.request.urlopen('http://localhost:8000/health'); sys.exit(0)"]

CMD ["/opt/venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
