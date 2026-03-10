FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY services/mcp-router/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/predator/.local/bin:$PATH" \
    PYTHONPATH="/app"

RUN groupadd -g 10001 predator && \
    useradd -u 10001 -g predator -s /bin/sh -m predator && \
    apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /root/.local /home/predator/.local
# Копіюємо вміст app/ та інші конфіги
COPY services/mcp-router/app/ ./app/
COPY services/mcp-router/mcp_servers.json ./
COPY services/shared/ ./services/shared/
COPY libs/ /libs/

RUN chown -R predator:predator /app /home/predator/.local

USER predator

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
