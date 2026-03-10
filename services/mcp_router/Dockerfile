FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY services/mcp_router/requirements.txt .
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
COPY services/mcp_router/ ./services/mcp_router/
COPY services/shared/ ./services/shared/

RUN chown -R predator:predator /app /home/predator/.local

USER predator

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "services.mcp_router.router:app", "--host", "0.0.0.0", "--port", "8080"]
