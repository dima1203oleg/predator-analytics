import asyncio
import os
import sys

# Додаємо шлях до сервісів
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../services"))

from orchestrator.council.analyst import Analyst
from orchestrator.agents.shadow_mode import ShadowModeService

async def test_shadow_mode():
    print("👤 [PREDATOR SHADOW MODE VERIFICATION] Starting...")

    analyst = Analyst()
    shadow_service = ShadowModeService()

    # Симулюємо вхідні метрики
    metrics = {
        "cpu_usage": 0.85,  # Високе навантаження, щоб спровокувати різницю в shadow моделі
        "memory_usage": 0.4,
        "api_latency_p95": 450
    }

    print("📊 Executing dual analysis (Production + Candidate)...")
    result = await shadow_service.execute_dual_analysis(metrics, analyst)

    print(f"✅ Production Result: {result.get('health_status')}")

    # Перевіряємо лог відхилень
    report = shadow_service.get_shadow_report()
    if report:
        last = report[-1]
        print(f"📈 Shadow Mode Logged:")
        print(f"   - Candidate: {last['candidate_model']}")
        print(f"   - Deviation Score: {last['deviation_score']}")
        print(f"   - Prod Status: {last['prod_status']}")
        print(f"   - Shadow Status: {last['shadow_status']}")

        if last['deviation_score'] > 0:
            print("🏆 SHADOW MODE VERIFIED: Successfully captured model discrepancy.")
        else:
            print("⚠️ Shadow mode ran but no difference detected (expected deviation due to high CPU).")
    else:
        print("❌ No shadow mode report generated.")

if __name__ == "__main__":
    asyncio.run(test_shadow_mode())
