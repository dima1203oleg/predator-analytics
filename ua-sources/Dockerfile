FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir psycopg2-binary asyncpg

# Copy application code
COPY . .

# Environment setup
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Run the application with main_v21 (TS-compliant version)
CMD ["uvicorn", "app.main_v21:app", "--host", "0.0.0.0", "--port", "8000"]

