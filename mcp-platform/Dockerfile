# syntax=docker/dockerfile:1
# Multi-stage build, Python 3.12, non-root (user: predator)

FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=builder /install /usr/local
COPY mcp ./mcp
COPY README.md ./
RUN useradd -m predator && chown -R predator:predator /app
USER predator
# Expose web server port for health probes
EXPOSE 8000
ENTRYPOINT ["uvicorn"]
CMD ["mcp.web:app", "--host", "0.0.0.0", "--port", "8000"]
