#!/usr/bin/env python3
"""
🚀 ULTRA-ROUTER v55.3 — Запуск LiteLLM Proxy (STATELESS)
Pass-through режим — пропускає невідомі моделі напряму до провайдерів
"""
import sys
import os

# Додати поточну директорію до path
sys.path.insert(0, '/app')

if __name__ == '__main__':
    # Встановити оточення для LiteLLM
    os.environ.setdefault('GROQ_API_KEY', 'gsk_test_1')
    
    # Запустити через litellm proxy
    from litellm.proxy.proxy_server import app
    import uvicorn
    
    print("🚀 Запуск ULTRA-ROUTER v55.3 на порті 4000...")
    print("📊 STATELESS MODE (Pass-through)")
    print("💰 Провайдери: Groq + HF + Together + Ollama")
    print("═══════════════════════════════════════════════════════════════")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=4000,
        log_level="info",
        access_log=True,
    )
