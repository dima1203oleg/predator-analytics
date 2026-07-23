# Multi-stage Dockerfile
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim

# Create non-root user (HR-05)
RUN useradd -m -U predator

WORKDIR /app
COPY --from=builder /root/.local /home/predator/.local
COPY . .

# Set permissions
RUN chown -R predator:predator /app
USER predator

ENV PATH=/home/predator/.local/bin:$PATH
ENV PYTHONPATH=/app

EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
