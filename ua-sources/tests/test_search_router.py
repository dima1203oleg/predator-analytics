import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.api.routers import search
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.opensearch_indexer import OpenSearchIndexer

# Setup minimal app for testing router
test_app = FastAPI()
test_app.include_router(search.router)

client = TestClient(test_app)

# --- MOCKS ---
@pytest.fixture
def mock_indexer():
    indexer = AsyncMock(spec=OpenSearchIndexer)
    indexer.search.return_value = {
        "hits": {
            "total": {"value": 1},
            "hits": [
                {"_id": "doc1", "_score": 10.0, "_source": {"title": "Text Doc", "content": "Content"}}
            ]
        }
    }
    indexer.close = AsyncMock()
    return indexer

@pytest.fixture
def mock_qdrant():
    service = AsyncMock(spec=QdrantService)
    service.search.return_value = [
        {"id": "doc2", "score": 0.9, "metadata": {"title": "Vector Doc", "snippet": "Snippet"}}
    ]
    return service

@pytest.fixture
def mock_embedder():
    service = AsyncMock(spec=EmbeddingService)
    service.generate_embedding_async.return_value = [0.1] * 384
    # Mock rerank (synchronous in service, but check usage)
    # The service code calls 'rerank' synchronously
    service.rerank = MagicMock(return_value=[0.99]) 
    return service

from app.services.auth_service import get_current_user

# --- DEPENDENCY OVERRIDES ---
@pytest.fixture(autouse=True)
def override_deps(mock_indexer, mock_qdrant, mock_embedder):
    test_app.dependency_overrides[search.get_indexer] = lambda: mock_indexer
    test_app.dependency_overrides[search.get_qdrant] = lambda: mock_qdrant
    test_app.dependency_overrides[search.get_embedding] = lambda: mock_embedder
    # Mock auth
    test_app.dependency_overrides[get_current_user] = lambda: {"sub": "test_user", "tenant_id": "default"}
    yield
    test_app.dependency_overrides = {}

# --- TESTS ---

def test_search_hybrid_mode():
    """Test default hybrid search"""
    response = client.get("/search/?q=test&mode=hybrid")
    assert response.status_code == 200
    data = response.json()
    
    # We expect results from both sources to be merged/processed
    # In my mock:
    # Text doc: doc1 (score 10.0) -> norm 1.0 -> final 0.3 (alpha 0.3)
    # Vector doc: doc2 (score 0.9) -> norm 1.0 -> final 0.7 (alpha 0.7)
    # Reranking is applied to top 50.
    
    results = data["results"]
    assert len(results) > 0
    assert data["searchType"] == "hybrid"
    
    # Check structure
    first = results[0]
    assert "id" in first
    assert "score" in first
    assert "combinedScore" in first

def test_search_text_mode():
    """Test text-only mode"""
    response = client.get("/search/?q=test&mode=text")
    assert response.status_code == 200
    data = response.json()
    assert data["searchType"] == "text"
    assert len(data["results"]) == 1 # Only doc1 from Opensearch

def test_search_semantic_mode():
    """Test vector-only mode"""
    response = client.get("/search/?q=test&mode=semantic")
    assert response.status_code == 200
    data = response.json()
    assert data["searchType"] == "semantic"
    assert len(data["results"]) == 1 # Only doc2 from Qdrant

def test_search_validation_error():
    """Test missing query"""
    response = client.get("/search/")
    assert response.status_code == 422
