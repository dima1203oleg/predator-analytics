#!/usr/bin/env python3
"""
🚀 ULTRA-ROUTER v55.3 — Запуск LiteLLM Proxy з конфігом
"""
import os
import sys
import uvicorn
from litellm.proxy.proxy_server import app

if __name__ == '__main__':
    os.environ["LITELLM_CONFIG"] = "/app/config.yaml"
    
    print("🚀 Запуск ULTRA-ROUTER v55.3 на порті 4000...")
    print("📋 Конфіг: /app/config.yaml (через LITELLM_CONFIG)")
    print("═══════════════════════════════════════════════════════════════")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=4000,
        log_level="info"
    )
