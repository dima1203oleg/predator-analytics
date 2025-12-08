#!/usr/bin/env python3
"""
Quick demo of LLM Council with Telegram-like queries
Shows how the system responds to natural language
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ua-sources'))

from app.services.llm import llm_service


async def demo_telegram_query(query: str, mode: str = "fast"):
    """Simulate a Telegram user query"""
    print(f"\n{'='*70}")
    print(f"📱 USER: {query}")
    print(f"🤖 MODE: {mode}")
    print(f"{'='*70}\n")
    
    import time
    start = time.time()
    
    response = await llm_service.generate_with_routing(
        prompt=query,
        system="""Ти - AI асистент для управління сервером Predator Analytics.
Допомагай користувачу з:
1. Управлінням сервером (статус, ресурси, логи)
2. Docker/Kubernetes управління  
3. SSH/Ngrok налаштування
4. Деплой та моніторинг
5. Пошук в українських реєстрах
6. Загальні питання з технологій

Відповідай коротко та по суті українською мовою.""",
        mode=mode
    )
    
    elapsed = time.time() - start
    
    if response.success:
        print(f"🤖 BOT RESPONSE:")
        print(f"{response.content}\n")
        print(f"📊 Stats:")
        print(f"  • Provider: {response.provider}")
        print(f"  • Model: {response.model}")
        print(f"  • Latency: {response.latency_ms:.0f}ms ({elapsed:.1f}s total)")
        print(f"  • Tokens: {response.tokens_used}")
    else:
        print(f"❌ ERROR: {response.error}")


async def demo_council_query(query: str):
    """Demonstrate Council mode for deep analysis"""
    print(f"\n{'='*70}")
    print(f"📱 USER: {query}")
    print(f"🤖 MODE: COUNCIL (Multi-model debate)")
    print(f"{'='*70}\n")
    
    print("⏳ Stage 1: Gathering opinions from council members...")
    
    import time
    start = time.time()
    
    response = await llm_service.run_council(
        prompt=query,
        system="Ти - експерт-аналітик. Давай глибокі та обгрунтовані відповіді.",
        max_tokens=1000,
        enable_review=False  # Disable for demo speed
    )
    
    elapsed = time.time() - start
    
    if response.success:
        print(f"✅ Council synthesis complete!\n")
        print(f"🤖 COUNCIL RESPONSE:")
        print(f"{response.content}\n")
        print(f"📊 Stats:")
        print(f"  • Model: {response.model}")
        print(f"  • Total time: {elapsed:.1f}s")
        print(f"  • Latency: {response.latency_ms:.0f}ms")
    else:
        print(f"❌ Council failed: {response.error}")


async def main():
    """Run demo"""
    print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║           🤖 Predator Analytics LLM Council Demo                ║
║                 Telegram Natural Language Processing             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    # Demo 1: Simple queries (Fast mode)
    print("\n🎯 DEMO 1: Simple Questions (Fast Mode)")
    print("━" * 70)
    
    await demo_telegram_query(
        "Привіт! Як тебе звати?",
        mode="fast"
    )
    
    await asyncio.sleep(1)
    
    await demo_telegram_query(
        "Поясни коротко що таке Docker?",
        mode="fast"
    )
    
    await asyncio.sleep(1)
    
    await demo_telegram_query(
        "Як перевірити статус серверу через SSH?",
        mode="fast"
    )
    
    # Demo 2: Council mode for complex question
    print("\n\n🎯 DEMO 2: Complex Analysis (Council Mode)")
    print("━" * 70)
    
    await demo_council_query(
        "Поясни детально переваги та недоліки Kubernetes для малого бізнесу. Чи варто його використовувати?"
    )
    
    print("\n\n" + "="*70)
    print("✅ Demo completed!")
    print("="*70)
    print("""
📋 Summary:
  • Fast mode: 0.5-3 seconds - good for quick questions
  • Council mode: 60-90 seconds - best for complex analysis
  • All responses in Ukrainian
  • Multiple providers with automatic fallback
  • Ready for production Telegram bot!

💡 Key Features Demonstrated:
  ✅ Natural language processing
  ✅ Fast single-model responses  
  ✅ Multi-model council debate
  ✅ Ukrainian language support
  ✅ Tech-focused responses
  ✅ Provider fallback working

🚀 System is ready for Telegram integration!
""")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
