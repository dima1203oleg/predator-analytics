"""
Tests for Stats API endpoints (TS-Compliant)
GET /api/v1/stats/ingestion
GET /api/v1/stats/search
GET /api/v1/stats/system
GET /api/v1/stats/categories
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class MockAsyncpgConnection:
    """Mock asyncpg connection for stats tests"""
    
    async def fetchval(self, query, *args):
        if "COUNT(*) FROM staging.raw_data" in query:
            if "processed = FALSE" in query:
                return 5
            elif "fetched_at >" in query:
                return 10
            return 100
        elif "COUNT(*) FROM gold.documents" in query:
            if "created_at >" in query:
                return 20
            return 150
        elif "MAX(fetched_at)" in query:
            return datetime(2025, 12, 6, 12, 0, 0)
        elif "EXISTS" in query:
            return True
        elif "COUNT(*) FROM gold.search_logs" in query:
            return 500
        elif "AVG(response_time_ms)" in query:
            return 125.5
        elif "COUNT(*) FROM gold.users" in query:
            return 10
        elif "pg_database_size" in query:
            return "256 MB"
        return 0
    
    async def fetch(self, query, *args):
        if "GROUP BY source" in query:
            return [
                {"source": "prozorro", "count": 50, "last_fetch": datetime(2025, 12, 6)},
                {"source": "customs", "count": 30, "last_fetch": datetime(2025, 12, 5)},
            ]
        elif "GROUP BY category" in query:
            return [
                {"category": "tenders", "count": 80, "last_updated": datetime(2025, 12, 6)},
                {"category": "customs", "count": 40, "last_updated": datetime(2025, 12, 5)},
            ]
        elif "pg_stat_user_tables" in query:
            return [
                {"table_name": "gold.documents", "total_size": "128 MB", "row_count": 150},
                {"table_name": "staging.raw_data", "total_size": "64 MB", "row_count": 100},
            ]
        elif "pg_stat_user_indexes" in query:
            return [
                {"index_name": "gold.idx_docs_title", "scans": 1000, "tuples_read": 5000},
            ]
        elif "date_trunc" in query:
            return [
                {"period": datetime(2025, 12, 5), "count": 30},
                {"period": datetime(2025, 12, 6), "count": 50},
            ]
        elif "GROUP BY query" in query:
            return [
                {"query": "митні декларації", "count": 50},
                {"query": "prozorro", "count": 30},
            ]
        elif "GROUP BY search_type" in query:
            return [
                {"search_type": "hybrid", "count": 400},
                {"search_type": "keyword", "count": 100},
            ]
        return []
    
    async def close(self):
        pass


mock_conn = MockAsyncpgConnection()


async def mock_get_db_connection():
    return mock_conn


@pytest.fixture
def client():
    """Create test client with mocked database"""
    with patch('app.api.routers.stats.get_db_connection', mock_get_db_connection):
        from app.main_v21 import app
        with TestClient(app) as test_client:
            yield test_client


class TestStatsIngestion:
    """Tests for GET /api/v1/stats/ingestion"""
    
    def test_ingestion_stats_default(self, client):
        """Test ingestion stats with default 7 days"""
        response = client.get("/api/v1/stats/ingestion")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "staging" in data
        assert "gold" in data
        assert "success_rate_percent" in data
        assert "by_source" in data
        assert data["period_days"] == 7
    
    def test_ingestion_stats_custom_days(self, client):
        """Test ingestion stats with custom days parameter"""
        response = client.get("/api/v1/stats/ingestion?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 30
    
    def test_ingestion_stats_structure(self, client):
        """Test that response has correct structure"""
        response = client.get("/api/v1/stats/ingestion")
        data = response.json()
        
        # Check staging structure
        assert "total" in data["staging"]
        assert "unprocessed" in data["staging"]
        assert "recent" in data["staging"]
        assert "last_ingestion" in data["staging"]
        
        # Check gold structure
        assert "total" in data["gold"]
        assert "recent" in data["gold"]


class TestStatsIngestionTimeline:
    """Tests for GET /api/v1/stats/ingestion/timeline"""
    
    def test_timeline_default(self, client):
        """Test timeline with default parameters"""
        response = client.get("/api/v1/stats/ingestion/timeline")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "granularity" in data
        assert "staging" in data
        assert "gold" in data
        assert data["granularity"] == "day"
    
    def test_timeline_hourly(self, client):
        """Test timeline with hourly granularity"""
        response = client.get("/api/v1/stats/ingestion/timeline?granularity=hour")
        
        assert response.status_code == 200
        data = response.json()
        assert data["granularity"] == "hour"


class TestStatsSearch:
    """Tests for GET /api/v1/stats/search"""
    
    def test_search_stats(self, client):
        """Test search statistics endpoint"""
        response = client.get("/api/v1/stats/search")
        
        assert response.status_code == 200
        data = response.json()
        
        # If search_logs exists
        if "total_searches" in data:
            assert "avg_response_time_ms" in data
            assert "popular_queries" in data
    
    def test_search_stats_custom_days(self, client):
        """Test search stats with custom days"""
        response = client.get("/api/v1/stats/search?days=14")
        
        assert response.status_code == 200


class TestStatsSystem:
    """Tests for GET /api/v1/stats/system"""
    
    def test_system_stats(self, client):
        """Test system statistics endpoint"""
        response = client.get("/api/v1/stats/system")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "database" in data
        assert "indexes" in data
        assert "users" in data
    
    def test_system_stats_database_info(self, client):
        """Test database info in system stats"""
        response = client.get("/api/v1/stats/system")
        data = response.json()
        
        assert "size" in data["database"]
        assert "tables" in data["database"]


class TestStatsCategories:
    """Tests for GET /api/v1/stats/categories"""
    
    def test_categories_stats(self, client):
        """Test categories endpoint"""
        response = client.get("/api/v1/stats/categories")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert "total_categories" in data
    
    def test_categories_structure(self, client):
        """Test category item structure"""
        response = client.get("/api/v1/stats/categories")
        data = response.json()
        
        if data["categories"]:
            category = data["categories"][0]
            assert "name" in category
            assert "count" in category
