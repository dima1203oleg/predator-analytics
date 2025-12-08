#!/usr/bin/env python3
"""
System Verification Script
Tests Gemini 2.5, Model Selection, and Telegram Logic
"""
import asyncio
import sys
import os
import logging
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ua-sources'))

from app.services.llm import llm_service
from app.services.telegram_assistant import telegram_assistant, init_assistant

# Setup logging
logging.basicConfig(level=logging.ERROR)

async def test_gemini_2_5():
    print("\n" + "="*50)
    print("🧪 TEST 1: Gemini 2.5 Flash")
    print("="*50)
    
    try:
        response = await llm_service.generate(
            prompt="Hello! Are you working?",
            provider="gemini",
            max_tokens=20
        )
        print(f"Status: {'✅ SUCCESS' if response.success else '❌ FAILED'}")
        print(f"Model: {response.model}")
        print(f"Content: {response.content}")
        if response.error:
            print(f"Error: {response.error}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

async def test_model_selection():
    print("\n" + "="*50)
    print("🧪 TEST 2: Model Selection & Multi-Account")
    print("="*50)
    
    # 1. Add extra key manualy
    print("🔹 Adding extra Groq key...")
    llm_service.add_api_key("groq", "gsk_TEST_KEY_FAKE_123456789")
    
    keys_info = llm_service.get_keys_info("groq")
    print(f"Groq keys count: {keys_info['count']}")
    
    # 2. Check manual selection
    print("🔹 Setting Groq model to 'llama-3.1-70b-versatile'...")
    llm_service.set_provider_model("groq", "llama-3.1-70b-versatile")
    
    provider_models = llm_service.get_provider_models("groq")
    current_model = llm_service.providers["groq"]["model"]
    print(f"Current Groq model: {current_model}")
    
    if current_model == "llama-3.1-70b-versatile":
        print("✅ Manual model selection works")
    else:
        print("❌ Manual selection failed")

async def test_telegram_logic():
    print("\n" + "="*50)
    print("🧪 TEST 3: Telegram Assistant Logic")
    print("="*50)
    
    bot = init_assistant("FAKE_TOKEN")
    
    queries = [
        "Привіт, як справи?",
        "Знайди інформацію про компанію Нова Пошта",
        "Що таке Docker?"
    ]
    
    for q in queries:
        print(f"\n📩 User: {q}")
        response = await bot._handle_ai_query(q, 12345)
        print(f"🤖 Bot: {response[:100]}...")
        if "❌" in response:
             print("   ⚠️ Bot returned error!")
        else:
             print("   ✅ Bot replied successfully")

async def main():
    print("🚀 Starting System Verification...")
    await test_gemini_2_5()
    await test_model_selection()
    await test_telegram_logic()
    print("\n✅ Verification Complete!")

if __name__ == "__main__":
    asyncio.run(main())
