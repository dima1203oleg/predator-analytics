#!/usr/bin/env python3
"""🚀 ULTRA-ROUTER v55.3 — Запуск LiteLLM Proxy з конфігом
"""
import os

from litellm.proxy.proxy_server import app
import uvicorn

if __name__ == '__main__':
    os.environ["LITELLM_CONFIG"] = "/app/config.yaml"


    uvicorn.run(
        app,
        host="0.0.0.0",
        port=4000,
        log_level="info"
    )
