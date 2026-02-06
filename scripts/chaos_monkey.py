
"""
Script: chaos_monkey.py
Purpose: Stress test the input validation of the API and RTB Engine.
"""
import asyncio
import httpx
import random
import string
import json

TARGET_URL = "http://localhost:8000"  # Assumes API is running locally via uvicorn

def generate_garbage(length=100):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

async def attack_api(client):
    """Sends malformed requests to API."""
    endpoints = ["/v1/insights/generate", "/v1/analytics/dashboard/summary"]
    
    # Attack 1: Empty JSON
    try:
        await client.post(f"{TARGET_URL}/v1/insights/generate", content="{}")
    except: pass
    
    # Attack 2: Huge Payload
    try:
        huge_payload = {"query": generate_garbage(10000)}
        await client.post(f"{TARGET_URL}/v1/insights/generate", json=huge_payload)
    except: pass
    
    # Attack 3: Invalid Types
    try:
        bad_payload = {"query": 12345, "context": "should_be_dict"}
        await client.post(f"{TARGET_URL}/v1/insights/generate", json=bad_payload)
    except: pass
    
    print("⚔️  Chaos Attacks Sent")

async def main():
    print("🐒 Releasing Chaos Monkey...")
    async with httpx.AsyncClient(timeout=2.0) as client:
        # Check if server is up first
        try:
            await client.get(f"{TARGET_URL}/health")
            await attack_api(client)
        except Exception:
            print("⚠️  Target not reachable. Start API first: 'uvicorn services.api.main:app'")

if __name__ == "__main__":
    asyncio.run(main())
