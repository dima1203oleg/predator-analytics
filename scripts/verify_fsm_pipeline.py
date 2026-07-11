#!/usr/bin/env python3
import os
import sys
import time

import requests

BASE_URL = "http://localhost:8000/api/v1"
FILE_PATH = "sample_fsm_upload.txt"

def wait_for_api():
    for _ in range(10):
        try:
            resp = requests.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                return True
        except:
            time.sleep(1)
    return False

def verify_fsm_pipeline():
    if not os.path.exists(FILE_PATH):
        return False

    with open(FILE_PATH, "rb") as f:
        files = {"file": ("sample_fsm_upload.txt", f, "text/plain")}
        try:
            resp = requests.post(f"{BASE_URL}/ingest/upload", files=files)
        except Exception:
            return False

    if resp.status_code != 200:
        return False

    data = resp.json()
    source_id = data.get("source_id")


    # Poll for status
    max_retries = 30
    for _i in range(max_retries):
        try:
            status_resp = requests.get(f"{BASE_URL}/ingest/status/{source_id}")
            if status_resp.status_code == 200:
                s_data = status_resp.json()
                state = s_data.get("state")
                s_data.get("progress")

                if state == "READY":
                    return True
                if state == "FAILED":
                    return False
            else:
                pass
        except Exception:
            pass

        time.sleep(1)

    return False

if __name__ == "__main__":
    if not wait_for_api():
        sys.exit(1)

    if verify_fsm_pipeline():
        sys.exit(0)
    else:
        sys.exit(1)
