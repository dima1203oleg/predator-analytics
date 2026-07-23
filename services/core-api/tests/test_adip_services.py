"""Unit tests for ADIP Knowledge Base and Self-Healing Engine."""
import pytest
from app.services.adip.knowledge_base import ConnectorKnowledgeBase
from app.services.adip.self_healing import SelfHealingEngine


@pytest.fixture
def kb() -> ConnectorKnowledgeBase:
    return ConnectorKnowledgeBase()


def test_kb_register_source(kb: ConnectorKnowledgeBase) -> None:
    url = "https://example.com/api/v1"
    metadata = {
        "title": "Example API",
        "pagination_pattern": "cursor",
        "auth_type": "bearer",
        "priority_score": 0.85,
    }
    kb.register_source(url, metadata)

    src = kb.get_source(url)
    assert src is not None
    assert src["title"] == "Example API"
    assert src["pagination_pattern"] == "cursor"
    assert src["auth_type"] == "bearer"
    assert src["priority_score"] == 0.85


def test_kb_record_sync_and_metrics(kb: ConnectorKnowledgeBase) -> None:
    url = "https://example.com/api/v2"
    kb.register_source(url, {"title": "Test Sync"})

    kb.record_sync(url, status="SUCCESS", rows=100, response_ms=250.0, payload_kb=50.0)
    src = kb.get_source(url)
    assert src["last_sync_status"] == "SUCCESS"
    assert src["avg_response_ms"] == 250.0
    assert src["error_rate"] == 0.0
    assert src["reliability_score"] == 1.0

    kb.record_sync(url, status="FAILED", error="500 Internal Error", response_ms=1000.0)
    src = kb.get_source(url)
    assert src["last_sync_status"] == "FAILED"
    assert src["error_rate"] > 0.0
    assert src["reliability_score"] < 1.0


def test_kb_meta_patterns(kb: ConnectorKnowledgeBase) -> None:
    kb.register_source("https://api1.com", {"pagination_pattern": "offset", "auth_type": "none"})
    kb.register_source("https://api2.com", {"pagination_pattern": "offset", "auth_type": "api_key"})
    kb.register_source("https://api3.com", {"pagination_pattern": "cursor", "auth_type": "api_key"})

    patterns = kb.get_meta_patterns()
    assert patterns["most_common_pagination"] == "offset"
    assert patterns["most_common_auth"] == "api_key"
    assert patterns["total_sources"] == 3


@pytest.mark.asyncio
async def test_self_healing_regression_test() -> None:
    engine = SelfHealingEngine()
    valid_code = "async def fetch_data(): pass"
    invalid_code = "def invalid_syntax(:"

    assert await engine._run_regression_test("http://test.com", valid_code) is True
    assert await engine._run_regression_test("http://test.com", invalid_code) is False
