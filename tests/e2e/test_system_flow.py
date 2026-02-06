
"""
E2E Integration Test: System Flow
Simulates the full lifecycle from API -> MCP -> RTB without K8s.
Uses FastAPI TestClient to mount applications directly.
"""
import pytest
from fastapi.testclient import TestClient
from services.api.main import app as api_app
from services.rtb_engine.engine import app as rtb_app
from services.mcp_router.router import app as mcp_app

# Create Clients
api_client = TestClient(api_app)
rtb_client = TestClient(rtb_app)
mcp_client = TestClient(mcp_app)

# Mock External Calls (Monkeypatching)
# We need to intercept HTTP calls between services and route them to our TestClients

import httpx

async def mock_post(url, json=None, **kwargs):
    """Router for internal service calls."""
    # API -> MCP
    if "mcp-router" in url or "8080" in url:
        response = mcp_client.post("/v1/query", json=json)
        return httpx.Response(response.status_code, json=response.json())
    
    # RTB -> MCP
    if "mcp-router" in url and "query" in url:
        response = mcp_client.post("/v1/query", json=json)
        return httpx.Response(response.status_code, json=response.json())
        
    return httpx.Response(404, json={"error": "Not mocked"})

@pytest.mark.asyncio
async def test_full_insight_flow(monkeypatch):
    """
    User asks question -> API -> MCP -> LLM (Mocked) -> API Response
    """
    # Patch the AsyncClient in the API service
    monkeypatch.setattr("httpx.AsyncClient.post", mock_post)

    # 1. User Request
    payload = {"query": "Explain event X", "context": {}}
    
    # Note: We need to mock the MCP provider response inside MCP router 
    # because we don't have a running Ollama.
    from services.mcp_router.providers.ollama import OllamaProvider
    
    async def mock_generate(*args, **kwargs):
        return {
            "content": "Mocked LLM Analysis",
            "model": "llama3",
            "provider": "test",
            "latency_ms": 10
        }
    
    monkeypatch.setattr(OllamaProvider, "generate_response", mock_generate)

    # 2. Execute via API Client
    # We use the API client directly, but since API uses async httpx internally, 
    # we need to be careful. TestClient is synchronous wrapper. 
    # The patching above handles the inner async calls.
    
    response = api_client.post("/v1/insights/generate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["insight"] == "Mocked LLM Analysis"
    assert "trace_id" in data

def test_rtb_event_flow():
    """
    Event Ingestion -> RTB Engine -> Rule Match
    """
    # 1. Send High Severity Event
    event_payload = {
        "event_type": "SecurityVulnerabilityDetected",
        "source": "ci-scanner",
        "context": {"severity": "CRITICAL", "cve": "CVE-2024-1234"}
    }
    
    response = rtb_client.post("/events", json=event_payload)
    assert response.status_code == 200
    assert response.json()["status"] == "accepted"
    
    # Note: Background tasks in TestClient run synchronously after the response 
    # if using StarletteTestClient, but verification of logs/side-effects 
    # requires capturing the logger or mocking the action handler.
