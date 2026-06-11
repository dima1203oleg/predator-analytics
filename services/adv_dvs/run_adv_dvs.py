import asyncio
from orchestrator import AdvDvsOrchestrator
import json

async def run():
    o = AdvDvsOrchestrator()
    res = await o.run_all()
    print("Deployment Readiness Index (DRI):", res['deployment_readiness_index'], "%")
    print("Overall Status:", res['overall_status'])
    print("Details:", json.dumps({k: v['status'] for k, v in res['levels'].items()}, indent=2))

if __name__ == "__main__":
    asyncio.run(run())
