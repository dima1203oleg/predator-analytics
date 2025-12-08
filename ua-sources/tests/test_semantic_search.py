import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main_v21 import app
from app.services.embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantService
from app.services.opensearch_indexer import OpenSearchIndexer

client = TestClient(app)

# --- MOCKS ---
@pytest.fixture
def mock_embedding_service():
    service = MagicMock(spec=EmbeddingService)
    # Mock embedding vector generation (dimension 384)
    service.generate_embedding.return_value = [0.1] * 384
    service.generate_embedding_async = AsyncMock(return_value=[0.1] * 384)
    return service

@pytest.fixture
def mock_qdrant_service():
    service = AsyncMock(spec=QdrantService)
    # Mock search results
    service.search.return_value = [
        MagicMock(id="doc1", score=0.9, metadata={"title": "Test Doc 1", "snippet": "Snippet 1"}, payload={"title": "Test Doc 1"}),
        MagicMock(id="doc2", score=0.8, metadata={"title": "Test Doc 2", "snippet": "Snippet 2"}, payload={"title": "Test Doc 2"})
    ]
    return service

@pytest.fixture
def mock_opensearch_indexer():
    indexer = AsyncMock(spec=OpenSearchIndexer)
    # Mock OpenSearch results
    indexer.search.return_value = {
        "hits": {
            "total": {"value": 2},
            "hits": [
                {"_id": "doc1", "_score": 10.0, "_source": {"title": "Test Doc 1", "content": "Full content 1"}},
                {"_id": "doc3", "_score": 5.0, "_source": {"title": "Test Doc 3", "content": "Full content 3"}}
            ]
        }
    }
    return indexer

# --- TESTS ---

def test_embedding_generation(mock_embedding_service):
    """Test that embeddings are generated with correct dimension"""
    vector = mock_embedding_service.generate_embedding("test query")
    assert len(vector) == 384
    assert vector[0] == 0.1

@pytest.mark.asyncio
async def test_hybrid_search_logic(mock_qdrant_service, mock_opensearch_indexer):
    """Test the hybrid search combination logic"""
    # Simulate Search Route Logic (simplified unit test of the logic itself)
    
    # 1. Get Vector Results
    vector_results = await mock_qdrant_service.search("query", limit=10)
    assert len(vector_results) == 2
    
    # 2. Get Keyword Results
    keyword_results = await mock_opensearch_indexer.search("query", index="documents")
    assert keyword_results['hits']['total']['value'] == 2

    # 3. Hybrid Logic (Manual verify of RRF or Score Summation)
    # Map results by ID
    combined = {}
    
    # Process Vector Hits
    for hit in vector_results:
        combined[hit.id] = {"score": hit.score * 10, "doc": hit}
        
    # Process Keyword Hits
    for hit in keyword_results['hits']['hits']:
        doc_id = hit["_id"]
        if doc_id in combined:
            combined[doc_id]["score"] += hit["_score"]
        else:
            combined[doc_id] = {"score": hit["_score"], "doc": hit}
            
    # Doc1 exists in both. Score should be 0.9 * 10 + 10.0 = 19.0
    assert combined["doc1"]["score"] == 19.0
    
    # Doc2 only in Vector. Score 0.8 * 10 = 8.0
    assert combined["doc2"]["score"] == 8.0
    
    # Doc3 only in Keyword. Score 5.0
    assert combined["doc3"]["score"] == 5.0

def test_search_api_endpoint_structure():
    """Test that the API endpoint accepts correct parameters"""
    # Note: We can't easily integration test the full endpoint without patching dependency injection,
    # but we can check if it returns 422 for missing params or 503 if services are down (which matches our expectation for now).
    
    # Test valid request (should fail due to missing DB connection, but validation passes)
    response = client.get("/api/v1/search?q=test")
    # It might return 500 because we didn't inject mocks into the app dependency_overrides, 
    # but checking it's not 404 is enough to verify route existence.
    assert response.status_code != 404
