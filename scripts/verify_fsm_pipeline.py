#!/usr/bin/env python3
import os
import sys
import time

import requests


BASE_URL = "http://localhost:8000/api/v1"
FILE_PATH = "sample_fsm_upload.txt"

def wait_for_api():
    print("⏳ Waiting for API to be ready...")
    for _ in range(10):
        try:
            resp = requests.get(f"{BASE_URL}/health")
            if resp.status_code == 200:
                print("✅ API is UP!")
                return True
        except:
            time.sleep(1)
    print("❌ API failed to start or unreachable.")
    return False

def verify_fsm_pipeline():
    print(f"🚀 Uploading {FILE_PATH} to NEW /ingest/upload endpoint...")
    if not os.path.exists(FILE_PATH):
        print(f"❌ File not found: {FILE_PATH}")
        return False

    with open(FILE_PATH, "rb") as f:
        files = {"file": ("sample_fsm_upload.txt", f, "text/plain")}
        try:
            resp = requests.post(f"{BASE_URL}/ingest/upload", files=files)
        except Exception as e:
            print(f"❌ Upload request failed: {e}")
            return False

    if resp.status_code != 200:
        print(f"❌ Upload failed: {resp.status_code} {resp.text}")
        return False

    data = resp.json()
    source_id = data.get("source_id")
    print(f"✅ Upload successful. Source ID: {source_id}")
    print(f"   Initial State: {data.get('state')}")

    print("⏳ Polling FSM Pipeline Status...")

    # Poll for status
    max_retries = 30
    for i in range(max_retries):
        try:
            status_resp = requests.get(f"{BASE_URL}/ingest/status/{source_id}")
            if status_resp.status_code == 200:
                s_data = status_resp.json()
                state = s_data.get("state")
                progress = s_data.get("progress")
                print(f"   [{i+1}/{max_retries}] State: {state} (Progress: {progress}%)")

                if state == "READY":
                    print("🎉 Pipeline FSM completed successfully! READY.")
                    return True
                if state == "FAILED":
                    print(f"❌ Pipeline FSM FAILED: {s_data.get('error')}")
                    return False
            else:
                print(f"⚠️ Status check failed: {status_resp.status_code}")
        except Exception as e:
            print(f"⚠️ Polling error: {e}")

        time.sleep(1)

    print("❌ Timeout waiting for pipeline to complete.")
    return False

if __name__ == "__main__":
    if not wait_for_api():
        sys.exit(1)

    if verify_fsm_pipeline():
        print("✅ FSM PIPELINE VERIFICATION PASSED")
        sys.exit(0)
    else:
        print("❌ FSM PIPELINE VERIFICATION FAILED")
        sys.exit(1)
