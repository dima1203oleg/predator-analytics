#!/usr/bin/env python3
"""
🚀 ULTRA-ROUTER v55.3 — Запуск LiteLLM Proxy (STATELESS)
"""
import sys
import os
import yaml

# Додати поточну директорію до path
sys.path.insert(0, '/app')

if __name__ == '__main__':
    # Запустити через litellm proxy
    from litellm.proxy.proxy_server import app
    import uvicorn
    
    print("🚀 Запуск ULTRA-ROUTER v55.3 на порті 4000...")
    print("📊 STATELESS MODE (без БД)")
    print("💰 Провайдери: Groq (5x) + HF + Together + Ollama")
    
    # LiteLLM завантажуватиме конфіг з YAML
    # Встановимо змінні оточення для моделей
    os.environ.setdefault('GROQ_API_KEY', 'gsk_test_1')
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=4000,
        log_level="info",
        access_log=True,
    )
