FROM python:3.12-slim-bookworm

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY services/mcp_router/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and shared services
COPY services/mcp_router/ ./services/mcp_router/
COPY services/shared/ ./services/shared/

# Set Python environment to include root
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["uvicorn", "services.mcp_router.router:app", "--host", "0.0.0.0", "--port", "8080"]
