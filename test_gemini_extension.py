#!/usr/bin/env python3
"""Тестовий скрипт для перевірки Gemini API"""
import requests
import os

GEMINI_API_KEY = "AQ.Ab8RN6LjLcAHpcUY2mYkjRXO461k2wU9i95FPSt89eL9I3dqQA"
MODEL = "gemini-2.5-flash"

url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_API_KEY}"

payload = {
    "contents": [{
        "parts": [{"text": "Привіт! Напиши короткий привіт українською."}]
    }],
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 100
    }
}

print(f"Тестую Gemini API: {MODEL}")
print("-" * 50)

try:
    response = requests.post(url, json=payload, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    
    print(f"✅ Gemini API працює!")
    print(f"📝 Відповідь: {content}")
    print(f"📊 Tokens: {data.get('usageMetadata', {})}")
    
except Exception as e:
    print(f"❌ Помилка: {e}")
    print(f"📄 Response: {response.text if 'response' in locals() else 'N/A'}")
