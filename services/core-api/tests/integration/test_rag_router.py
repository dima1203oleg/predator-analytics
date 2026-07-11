import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.rag_service import RAGService
import asyncio

# Mocking RAGService to avoid real database/LLM calls during simple testing
class MockRAGService:
    async def index_documents(self, documents, tenant_id):
        pass
    
    async def query(self, query, tenant_id, limit):
        return {
            "answer": "Mocked answer for: " + query,
            "sources": [{"text": "Mocked context", "score": 0.99}]
        }

@pytest.fixture
def mock_rag_service(monkeypatch):
    mock = MockRAGService()
    monkeypatch.setattr("app.routers.rag.rag_service", mock)
    return mock

@pytest.mark.asyncio
async def test_rag_index_documents(mock_rag_service):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/rag/index", json={
            "documents": [
                {"text": "Test document 1", "metadata": {"source": "test"}},
                {"text": "Test document 2", "metadata": {"source": "test"}}
            ],
            "tenant_id": "test_tenant"
        })
    assert response.status_code == 200
    assert response.json() == {"status": "accepted", "message": "Документи додані у чергу на індексацію."}

@pytest.mark.asyncio
async def test_rag_query(mock_rag_service):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/rag/query", json={
            "query": "What is OSINT?",
            "tenant_id": "test_tenant",
            "limit": 3
        })
    assert response.status_code == 200
    data = response.json()
    assert "Mocked answer for: What is OSINT?" in data["answer"]
    assert len(data["sources"]) == 1
