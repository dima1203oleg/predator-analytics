# ═══════════════════════════════════════════════════════════════
# ULTRA-ROUTER v55.3 — Docker Image (LiteLLM Proxy)
# Base: Python 3.12 + LiteLLM + STATELESS mode
# ═══════════════════════════════════════════════════════════════

FROM python:3.12-slim as base

WORKDIR /app

# ═══════════════════════════════════════════════════════════════
# STAGE 1: Builder
# ═══════════════════════════════════════════════════════════════

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Встановити LiteLLM з proxy
RUN pip install --no-cache-dir \
    "litellm[proxy]>=1.40.0" \
    pyyaml \
    uvicorn \
    fastapi

# ═══════════════════════════════════════════════════════════════
# STAGE 2: Runtime
# ═══════════════════════════════════════════════════════════════

FROM python:3.12-slim

WORKDIR /app

# Користувач (PREDATOR)
RUN groupadd -r predator && useradd -r -g predator predator

# Копіювати бібліотеки з builder
COPY --from=base /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages

# Конфіг буде змонтований з volumes (docker-compose)
COPY run-proxy.py ./run-proxy.py

# Директорія логів
RUN mkdir -p /app/logs && chown -R predator:predator /app

# ═══════════════════════════════════════════════════════════════
# HEALTHCHECK
# ═══════════════════════════════════════════════════════════════

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

# ═══════════════════════════════════════════════════════════════
# EXPOSE + RUN
# ═══════════════════════════════════════════════════════════════

EXPOSE 4000

USER predator

# CMD — запуск LiteLLM Proxy
ENV LITELLM_PROXY_ADMIN_KEY="sk-antigravity-master-2026"
CMD ["python", "-m", "litellm.proxy.proxy_server", "--model", "gpt-3.5-turbo", "--model", "gpt-4"]
