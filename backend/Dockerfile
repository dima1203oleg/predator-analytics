FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies in a separate layer for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a non‑root user and switch to it
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Environment variables for a clean Python runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose the HTTP port used by the app
EXPOSE 8000

# Health‑check to ensure the service is up
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default command to run the FastAPI app with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
