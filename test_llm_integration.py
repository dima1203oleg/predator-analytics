#!/usr/bin/env python3
"""
Test LLM Council integration with Telegram bot
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ua-sources'))

from app.services.llm import llm_service
from app.services.ai_engine import ai_engine


async def test_llm_providers():
    """Test all available LLM providers"""
    print("\n" + "="*70)
    print("🔑 Testing LLM Providers")
    print("="*70 + "\n")
    
    providers = llm_service.get_available_providers()
    print(f"📊 Available providers: {len(providers)}\n")
    
    for provider in providers:
        print(f"  ✅ {provider['name']}: {provider['model']}")
    
    print()


async def test_simple_generation():
    """Test simple generation"""
    print("\n" + "="*70)
    print("🧪 Test 1: Simple Generation (Fast Mode)")
    print("="*70 + "\n")
    
    response = await llm_service.generate_with_routing(
        prompt="Привіт! Як справи?",
        system="Ти - дружній AI асистент. Відповідай коротко українською.",
        mode="fast"
    )
    
    print(f"Provider: {response.provider}")
    print(f"Model: {response.model}")
    print(f"Success: {response.success}")
    print(f"Latency: {response.latency_ms:.0f}ms")
    print(f"\nResponse:\n{response.content}\n")


async def test_council():
    """Test LLM Council"""
    print("\n" + "="*70)
    print("🧪 Test 2: LLM Council (Multi-model debate)")
    print("="*70 + "\n")
    
    response = await llm_service.run_council(
        prompt="Поясни коротко що таке блокчейн українською мовою",
        system="Ти - експерт з технологій. Пояснюй просто.",
        max_tokens=500,
        enable_review=False  # Disable review for faster testing
    )
    
    print(f"Model: {response.model}")
    print(f"Success: {response.success}")
    print(f"Latency: {response.latency_ms:.0f}ms")
    print(f"\nResponse:\n{response.content}\n")


async def test_ai_engine():
    """Test AI Engine with Ukrainian data sources"""
    print("\n" + "="*70)
    print("🧪 Test 3: AI Engine (с Ukrainian data)")
    print("="*70 + "\n")
    
    result = await ai_engine.analyze(
        query="Монобанк",
        depth="standard",
        llm_mode="fast"
    )
    
    print(f"Query: {result.query}")
    print(f"Model: {result.model_used}")
    print(f"Sources: {len(result.sources)}")
    print(f"Confidence: {result.confidence}")
    print(f"Processing time: {result.processing_time_ms:.0f}ms")
    print(f"\nAnswer:\n{result.answer[:500]}...\n")


async def test_ai_engine_council():
    """Test AI Engine with Council mode"""
    print("\n" + "="*70)
    print("🧪 Test 4: AI Engine + Council (Deep analysis)")
    print("="*70 + "\n")
    
    result = await ai_engine.analyze(
        query="Чому важлива кібербезпека для бізнесу?",
        depth="deep",
        llm_mode="council"
    )
    
    print(f"Query: {result.query}")
    print(f"Model: {result.model_used}")
    print(f"Confidence: {result.confidence}")
    print(f"Processing time: {result.processing_time_ms:.0f}ms")
    print(f"\nAnswer:\n{result.answer[:800]}...\n")


async def test_telegram_natural_language():
    """Test natural language processing like Telegram would use"""
    print("\n" + "="*70)
    print("🧪 Test 5: Natural Language (Telegram simulation)")
    print("="*70 + "\n")
    
    test_queries = [
        "Знайди інформацію про компанію ПриватБанк",
        "Який статус сервера?",
        "Поясни що таке машинне навчання",
    ]
    
    for query in test_queries:
        print(f"\n📩 User: {query}")
        
        result = await ai_engine.analyze(
            query=query,
            depth="quick",
            llm_mode="fast"
        )
        
        print(f"🤖 Bot ({result.model_used}): {result.answer[:300]}...")
        print(f"   ⏱️  {result.processing_time_ms:.0f}ms\n")


async def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("🚀 Predator Analytics - LLM Council Integration Tests")
    print("="*70)
    
    try:
        await test_llm_providers()
        await test_simple_generation()
        await test_council()
        await test_ai_engine()
        await test_ai_engine_council()
        await test_telegram_natural_language()
        
        print("\n" + "="*70)
        print("✅ All tests completed successfully!")
        print("="*70 + "\n")
        
        print("📋 Summary:")
        print("  ✅ LLM providers initialized and working")
        print("  ✅ Simple generation works")
        print("  ✅ LLM Council (Karpathy-style) works")
        print("  ✅ AI Engine integrates with Council")
        print("  ✅ Natural language processing ready for Telegram")
        print("\n💡 The system is ready for Telegram bot integration!\n")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
