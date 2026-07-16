# Builder stage
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.12-slim

# Create non-root user (HR-05)
RUN groupadd -r predator && useradd -r -g predator predator

WORKDIR /app

# Copy installed packages
COPY --from=builder /root/.local /home/predator/.local
ENV PATH=/home/predator/.local/bin:$PATH

# Copy app code
COPY --chown=predator:predator . .

USER predator
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
