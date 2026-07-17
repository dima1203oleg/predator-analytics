import pytest
from unittest.mock import AsyncMock, MagicMock
from app.pipelines.ua_registry import UARegistryPipeline

@pytest.fixture
def mock_postgres_sink():
    return AsyncMock()

@pytest.fixture
def mock_clickhouse_sink():
    return AsyncMock()

@pytest.fixture
def mock_neo4j_sink():
    return AsyncMock()

@pytest.mark.asyncio
async def test_prozorro_routing(mock_postgres_sink, mock_clickhouse_sink, mock_neo4j_sink):
    pipeline = UARegistryPipeline(mock_postgres_sink, mock_clickhouse_sink, mock_neo4j_sink)
    
    msg = {
        "event_id": "test-123",
        "event_type": "tenders_batch",
        "payload": [
            {"tender_id": "UA-2024", "value_amount": 1000}
        ]
    }
    
    # Mocking acquire for postgres
    mock_postgres_sink.pool.acquire.return_value.__aenter__.return_value = AsyncMock()

    await pipeline.process_event("ua.prozorro.events", msg)
    
    mock_clickhouse_sink.insert_prozorro_tenders.assert_called_once_with(msg["payload"])
    mock_neo4j_sink.merge_ownership_graph.assert_not_called()

@pytest.mark.asyncio
async def test_edr_routing(mock_postgres_sink, mock_clickhouse_sink, mock_neo4j_sink):
    pipeline = UARegistryPipeline(mock_postgres_sink, mock_clickhouse_sink, mock_neo4j_sink)
    
    msg = {
        "event_id": "test-456",
        "event_type": "company_ownership_graph",
        "payload": [
            {"nodes": [], "edges": []}
        ]
    }
    
    mock_postgres_sink.pool.acquire.return_value.__aenter__.return_value = AsyncMock()

    await pipeline.process_event("ua.edr.events", msg)
    
    mock_neo4j_sink.merge_ownership_graph.assert_called_once_with(msg["payload"][0])
    mock_clickhouse_sink.insert_prozorro_tenders.assert_not_called()
