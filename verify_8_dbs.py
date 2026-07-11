import requests
import json
import time
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "http://localhost:8090/api/v1"

def test_endpoints():
    print("=== PREDATOR 8-NODE DATABASE CLUSTER VERIFICATION ===\n")
    
    endpoints = [
        # 1. Postgres + Redis
        {
            "name": "System Health (Postgres+Redis)",
            "url": f"{BASE_URL}/health",
            "method": "GET"
        },
        # 2. OpenSearch
        {
            "name": "OpenSearch (Full-text)",
            "url": f"{BASE_URL}/search/?q=test",
            "method": "GET"
        },
        # 3. Neo4j
        {
            "name": "Neo4j (Shadow Map)",
            "url": f"{BASE_URL}/graph/shadow/123",
            "method": "GET"
        },
        # 4. Qdrant / Copilot
        {
            "name": "Qdrant/LLM (Copilot)",
            "url": f"{BASE_URL}/copilot/chat",
            "method": "POST"
        },
        # 5. ClickHouse
        {
            "name": "ClickHouse (Market Trends)",
            "url": f"{BASE_URL}/market/overview",
            "method": "GET"
        },
        # 6. Auth Check
        {
            "name": "Auth Check",
            "url": f"{BASE_URL}/companies/",
            "method": "GET"
        }
    ]

    for ep in endpoints:
        print(f"Testing {ep['name']} -> {ep['url']}")
        try:
            start_time = time.time()
            if ep["method"] == "GET":
                resp = requests.get(ep["url"], verify=False, timeout=10)
            else:
                resp = requests.post(ep["url"], json={"prompt": "test"}, verify=False, timeout=10)
            latency = (time.time() - start_time) * 1000
            print(f"  Status: {resp.status_code} | Latency: {latency:.2f}ms")
            
            # Print response snippet
            try:
                data = resp.json()
                data_str = json.dumps(data)
                if len(data_str) > 150:
                    print(f"  Response Preview: {data_str[:150]}...")
                else:
                    print(f"  Error Response: {data_str}")
            except Exception:
                pass
                
        except Exception as e:
            print(f"  FAILED: {str(e)}")
        print("-" * 40)

if __name__ == "__main__":
    test_endpoints()
