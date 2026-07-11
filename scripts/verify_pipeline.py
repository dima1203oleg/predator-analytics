from __future__ import annotations

import os
import sys
import time

import requests

BASE_URL = "http://localhost:8000/api/v1"
FILE_PATH = "sample_data/companies_ukraine.csv"

def wait_for_api():
    for _ in range(30):
        try:
            resp = requests.get("http://localhost:8000/health")
            if resp.status_code == 200:
                return True
        except:
            time.sleep(2)
    return False

def upload_file():
    if not os.path.exists(FILE_PATH):
        return None

    with open(FILE_PATH, "rb") as f:
        files = {"file": ("companies_ukraine.csv", f, "text/csv")}
        resp = requests.post(f"{BASE_URL}/data/upload?dataset_type=general", files=files)

    if resp.status_code == 200:
        resp.json()
        return True
    return None

def verify_search():
    # Give some time for celery workers to process
    time.sleep(10)

    # Query for a known company in the CSV
    query = "ТОВ"

    try:
        resp = requests.get(f"{BASE_URL}/search/search/?q={query}&mode=hybrid") # Note: Router prefix might be /search so path is /search/search? verify main.py logic
        # Checking main_v45.py... usually prefix="/api/v1" + router prefix="/search" -> /api/v1/search/
        # Let's try /api/v1/search/ first (trailing slash if root is empty) or just /api/v1/search
    except:
        return None

    # Retry path correction if 404
    if resp.status_code == 404:
         resp = requests.get(f"{BASE_URL}/search/?q={query}&mode=hybrid")

    if resp.status_code == 200:
        data = resp.json()
        results = data.get("results", [])
        data.get("total", 0)
        data.get("searchType")


        if len(results) > 0:
            results[0]
            return True
        return False
    return False

if __name__ == "__main__":
    if not wait_for_api():
        sys.exit(1)

    task_id = upload_file()
    if not task_id:
        sys.exit(1)

    time.sleep(30)

    if verify_search():
        sys.exit(0)
    else:
        sys.exit(1)
