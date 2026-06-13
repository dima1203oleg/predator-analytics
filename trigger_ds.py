import sys, asyncio
sys.path.append("libs/predator-common")
from predator_common.ai.deepseek_core import DeepSeekCore

async def trigger():
    print("🚀 Triggering DeepSeek R1...")
    brain = DeepSeekCore()
    res = await brain.evaluate_drift({
        "drift_score": 0.45,
        "model_id": "risk_engine_v1",
        "metrics": {"precision": 0.72}
    })
    print("✅ Decision:", res.decision)
    print("📝 Rationale:", res.rationale)

if __name__ == "__main__":
    asyncio.run(trigger())
