import asyncio
import httpx
import time
from typing import Dict, List

NODES = [
    {"name": "NVIDIA Direct", "url": "http://194.177.1.240:8000/health"},
    {"name": "NVIDIA ZROK", "url": "https://predator.share.zrok.io/health"},
    {"name": "NVIDIA Colab Mirror", "url": "https://predator-mirror.share.zrok.io/health"},
    {"name": "Local Mock API", "url": "http://localhost:9080/api/v1/health"},
]

async def check_node(node: Dict[str, str]):
    start_time = time.time()
    try:
        async with httpx.AsyncClient(verify=False, timeout=5.0) as client:
            response = await client.get(node["url"])
            latency = (time.time() - start_time) * 1000
            if response.status_code == 200:
                return {"status": "✅ ONLINE", "latency": f"{latency:.0f}ms", "version": response.json().get("version", "unknown")}
            else:
                return {"status": f"❌ ERROR ({response.status_code})", "latency": "-", "version": "-"}
    except Exception as e:
        return {"status": f"🔴 OFFLINE", "latency": "-", "version": "-"}

async def main():
    print("🦅 PREDATOR Analytics — Node Status Report")
    print("=" * 60)
    print(f"{'Node Name':<25} | {'Status':<12} | {'Latency':<8} | {'Version'}")
    print("-" * 60)
    
    tasks = [check_node(node) for node in NODES]
    results = await asyncio.gather(*tasks)
    
    for node, result in zip(NODES, results):
        print(f"{node['name']:<25} | {result['status']:<12} | {result['latency']:<8} | {result['version']}")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
