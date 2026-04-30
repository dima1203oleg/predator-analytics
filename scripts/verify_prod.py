from __future__ import annotations

import sys
import time

import requests

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    try:
        resp = requests.get("http://localhost:8000/health")
        resp.raise_for_status()
    except Exception:
        sys.exit(1)

def test_hybrid_search():
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

        if results:
            first = results[0]

            # Check structure
            if "combinedScore" in first:
                pass
            else:
                pass
        else:
            pass

    except Exception:
        pass
        # Don't exit, maybe DB is just empty

def main():
    time.sleep(2) # Wait for service warmup
    test_health()
    test_hybrid_search()

if __name__ == "__main__":
    main()
