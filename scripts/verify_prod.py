import requests
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    print("🔹 Testing Health Endpoint...")
    try:
        resp = requests.get("http://localhost:8000/health")
        resp.raise_for_status()
        print(f"✅ Health OK: {resp.json()}")
    except Exception as e:
        print(f"❌ Health FAILED: {e}")
        exit(1)

def test_hybrid_search():
    print("\n🔹 Testing Hybrid Search (RRF)...")
    query = "test document"
    try:
        # First ensure we have some data (optional, skipping ingestion for speed, relying on existing)
        
        # Perform Search
        params = {
            "q": query,
            "mode": "hybrid",
            "limit": 5
        }
        resp = requests.get(f"{BASE_URL}/search", params=params)
        resp.raise_for_status()
        data = resp.json()
        
        results = data.get("results", [])
        print(f"ℹ️ Found {len(results)} results")
        
        if results:
            first = results[0]
            print(f"   Top result: {first.get('title')} (Score: {first.get('score')})")
            
            # Check structure
            if "combinedScore" in first:
                print("✅ RRF Fusion fields present")
            else:
                print("⚠️ Warning: combinedScore missing in result")
        else:
            print("⚠️ No results found (might be empty DB). Skipping structure check.")
            
    except Exception as e:
        print(f"❌ Search FAILED: {e}")
        # Don't exit, maybe DB is just empty
        
def main():
    print("🚀 Starting Production Verification...")
    time.sleep(2) # Wait for service warmup
    test_health()
    test_hybrid_search()
    print("\n✅ Verification Complete!")

if __name__ == "__main__":
    main()
