from __future__ import annotations

import os
import sys
import time

import requests


BASE_URL = "http://localhost:8000/api/v1"
FILE_PATH = "sample_data/companies_ukraine.csv"

def wait_for_api():
    print("⏳ Waiting for API to be ready...")
    for _ in range(30):
        try:
            resp = requests.get("http://localhost:8000/health")
            if resp.status_code == 200:
                print("✅ API is UP!")
                return True
        except:
            time.sleep(2)
    print("❌ API failed to start.")
    return False

def upload_file():
    print(f"🚀 Uploading {FILE_PATH}...")
    if not os.path.exists(FILE_PATH):
        print(f"❌ File not found: {FILE_PATH}")
        return None

    with open(FILE_PATH, "rb") as f:
        files = {"file": ("companies_ukraine.csv", f, "text/csv")}
        resp = requests.post(f"{BASE_URL}/data/upload?dataset_type=general", files=files)

    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Upload successful. Indexed: {data.get('indexing', {}).get('indexed_opensearch')} docs")
        return True
    print(f"❌ Upload failed: {resp.text}")
    return None

def verify_search():
    print("🔍 Verifying Hybrid Search...")
    # Give some time for celery workers to process
    time.sleep(10)

    # Query for a known company in the CSV
    query = "ТОВ"

    try:
        resp = requests.get(f"{BASE_URL}/search/search/?q={query}&mode=hybrid") # Note: Router prefix might be /search so path is /search/search? verify main.py logic
        # Checking main_v25.py... usually prefix="/api/v1" + router prefix="/search" -> /api/v1/search/
        # Let's try /api/v1/search/ first (trailing slash if root is empty) or just /api/v1/search
    except:
        print("❌ Search request failed connection.")
        return None

    # Retry path correction if 404
    if resp.status_code == 404:
         resp = requests.get(f"{BASE_URL}/search/?q={query}&mode=hybrid")

    if resp.status_code == 200:
        data = resp.json()
        results = data.get("results", [])
        total = data.get("total", 0)
        stype = data.get("searchType")

        print("✅ Search Status: 200 OK")
        print(f"   Mode: {stype}")
        print(f"   Total Hits: {total}")
        print(f"   Returned: {len(results)}")

        if len(results) > 0:
            top = results[0]
            print(f"   Top Result: {top.get('title')} (Score: {top.get('score'):.3f})")
            return True
        print("⚠️ No results found yet. Indexing might be slow.")
        return False
    print(f"❌ Search failed: {resp.status_code} {resp.text}")
    return False

if __name__ == "__main__":
    if not wait_for_api():
        sys.exit(1)

    task_id = upload_file()
    if not task_id:
        sys.exit(1)

    print("⏳ Waiting 30s for ETL processing...")
    time.sleep(30)

    if verify_search():
        print("🎉 END-TO-END VERIFICATION SUCCESSFUL!")
        sys.exit(0)
    else:
        sys.exit(1)
