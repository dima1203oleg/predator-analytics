import asyncio
from fastapi.testclient import TestClient
from app.main import app

# Create TestClient inside a context manager to run lifespan events (DB connection)
with TestClient(app) as client:
    print("Fetching /api/v1/osint/tools...")
    response = client.get("/api/v1/osint/tools")
    print(f"Status: {response.status_code}")
    print(response.json())
