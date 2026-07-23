import asyncio
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        # Check health
        resp = client.get("/health")
        print("Health:", resp.json())
        
        # Check status
        resp = client.get("/api/v1/etl/status")
        print("Status:", resp.json())
        
        # Trigger Prozorro
        resp = client.post("/api/v1/etl/prozorro/sync")
        print("Trigger Prozorro:", resp.json())

        # Check status again
        resp = client.get("/api/v1/etl/status")
        print("Status after trigger:", resp.json())

if __name__ == "__main__":
    run_tests()
