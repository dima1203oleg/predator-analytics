"""Мінімальний FastAPI web-сервер для health/ready probes."""
from __future__ import annotations

import os
from typing import Dict

from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI(title="MCP Platform Health API", version="0.1.0")

@app.get("/healthz", response_class=PlainTextResponse)
async def healthz() -> str:
    return "OK"

@app.get("/readyz", response_class=PlainTextResponse)
async def readyz() -> str:
    # Тут можна перевірити підключення до NATS/Neo4j/Qdrant, якщо потрібно
    return "OK"

@app.get("/info")
async def info() -> Dict[str, str]:
    return {
        "service": "mcp-platform",
        "version": "0.1.0",
        "python": os.getenv("PYTHON_VERSION", "3.12"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
