#!/usr/bin/env python3
"""Тестовий скрипт для перевірки додаткових Gemini моделей"""
import requests
import json

GEMINI_API_KEY = "AQ.Ab8RN6LjLcAHpcUY2mYkjRXO461k2wU9i95FPSt89eL9I3dqQA"

MODELS = [
    "gemini-2.0-flash",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite"
]

payload = {
    "contents": [{
        "parts": [{"text": "Привіт! Напиши короткий привіт українською."}]
    }],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 100
    }
}

print("=" * 60)
print("🧪 Тестування додаткових Gemini моделей")
print("=" * 60)

for model in MODELS:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
    
    print(f"\n📡 Тестую: {model}")
    print("-" * 60)
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        usage = data.get("usageMetadata", {})
        
        print(f"✅ {model} працює!")
        print(f"📝 Відповідь: {content}")
        print(f"📊 Tokens: {usage}")
        
    except Exception as e:
        print(f"❌ {model} помилка: {e}")
        if 'response' in locals():
            print(f"📄 Response: {response.text[:200]}")

print("\n" + "=" * 60)
print("🏁 Тестування завершено")
print("=" * 60)
