import asyncio
import json
import os
import sys

# Додаємо поточну директорію в PYTHONPATH, щоб імпорт працював при прямому запуску
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from adv_dvs.orchestrator import AdvDvsOrchestrator

async def main():
    print("Starting ADV-DVS Comprehensive Validation (17 Levels)...")
    orchestrator = AdvDvsOrchestrator()
    result = await orchestrator.run_all(chaos_mode=False)
    
    print("\n--- Validation Complete ---")
    print(f"Overall Status: {result['overall_status']}")
    print(f"Deployment Readiness Index: {result['deployment_readiness_index']}%")
    print(f"Ready for Prod: {result['is_ready']}")
    print("\nDetailed Report saved to /app/reports/deployment_audit.json (if in docker) or local ./reports")
    
if __name__ == "__main__":
    asyncio.run(main())
