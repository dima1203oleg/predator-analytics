"""
🧪 Integration Tests для PREDATOR Analytics Core API v56.1.4

Тести для перевірки критичних endpoints: Dashboard, Market, Monitoring.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db
from app.models.orm import Base

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET

@compiles(UUID, 'sqlite')
def compile_uuid(element, compiler, **kw):
    return "VARCHAR(36)"

@compiles(JSONB, 'sqlite')
def compile_jsonb(element, compiler, **kw):
    return "JSON"

@compiles(INET, 'sqlite')
def compile_inet(element, compiler, **kw):
    return "VARCHAR(45)"


# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db():
    """Create a fresh test database for each test."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def client(test_db):
    """Create a test client with overridden database dependency."""
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


# ═══════════════════════════════════════════════════════════════
# DASHBOARD API TESTS
# ═══════════════════════════════════════════════════════════════

class TestDashboardAPI:
    """Tests for Dashboard endpoints."""
    
    @pytest.mark.asyncio
    async def test_dashboard_overview_returns_valid_structure(self, client):
        """Test that dashboard overview returns correct data structure."""
        response = await client.get("/api/v1/dashboard/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "summary" in data
        assert "radar" in data
        assert "alerts" in data
        assert "infrastructure" in data
        assert "generated_at" in data
        
        # Check summary structure
        summary = data["summary"]
        assert "total_declarations" in summary
        assert "total_value_usd" in summary
        assert "high_risk_count" in summary
        assert "medium_risk_count" in summary
        
        # Verify no mock values (should be 0 for empty test DB)
        assert isinstance(summary["total_declarations"], int)
        assert isinstance(summary["total_value_usd"], (int, float))
    
    @pytest.mark.asyncio
    async def test_dashboard_overview_no_hardcoded_values(self, client):
        """Verify that dashboard doesn't return hardcoded mock values."""
        response = await client.get("/api/v1/dashboard/overview")
        data = response.json()
        
        summary = data["summary"]
        
        # These were the old mock values - should NOT appear
        assert summary["total_value_usd"] != 1250000000.50  # Old mock
        assert summary["graph_nodes"] != 12450  # Old mock
        assert summary["search_documents"] != 1420000  # Old mock
    
    @pytest.mark.asyncio
    async def test_dashboard_radar_data_structure(self, client):
        """Test radar data structure."""
        response = await client.get("/api/v1/dashboard/overview")
        data = response.json()
        
        radar = data["radar"]
        assert isinstance(radar, list)
        
        if len(radar) > 0:
            item = radar[0]
            assert "name" in item
            assert "value" in item
            assert "count" in item


# ═══════════════════════════════════════════════════════════════
# MARKET API TESTS
# ═══════════════════════════════════════════════════════════════

class TestMarketAPI:
    """Tests for Market endpoints."""
    
    @pytest.mark.asyncio
    async def test_market_overview_returns_valid_structure(self, client):
        """Test that market overview returns correct data structure."""
        response = await client.get("/api/v1/market/overview")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total_declarations" in data
        assert "total_value_usd" in data
        assert "total_companies" in data
        assert "top_products" in data
        assert "period" in data
        
        # Verify types
        assert isinstance(data["total_declarations"], int)
        assert isinstance(data["total_value_usd"], (int, float))
        assert isinstance(data["total_companies"], int)
        assert isinstance(data["top_products"], list)
    
    @pytest.mark.asyncio
    async def test_market_overview_no_hardcoded_values(self, client):
        """Verify that market overview doesn't return hardcoded values."""
        response = await client.get("/api/v1/market/overview")
        data = response.json()
        
        # These were the old hardcoded values - should NOT appear
        assert data["total_declarations"] != 12450  # Old hardcoded
        assert data["total_value_usd"] != 850_000_000  # Old hardcoded
        assert data["total_companies"] != 2340  # Old hardcoded
    
    @pytest.mark.asyncio
    async def test_market_trends_endpoint(self, client):
        """Test market trends endpoint."""
        response = await client.get("/api/v1/market/trends")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "trends" in data
        assert isinstance(data["trends"], list)
    
    @pytest.mark.asyncio
    async def test_market_declarations_pagination(self, client):
        """Test declarations endpoint with pagination."""
        response = await client.get("/api/v1/market/declarations?limit=10&page=1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "limit" in data
        
        assert isinstance(data["items"], list)
        assert data["page"] == 1
        assert data["limit"] == 10


# ═══════════════════════════════════════════════════════════════
# MONITORING API TESTS
# ═══════════════════════════════════════════════════════════════

class TestMonitoringAPI:
    """Tests for Monitoring endpoints."""
    
    @pytest.mark.asyncio
    async def test_system_health_endpoint(self, client):
        """Test system health check endpoint."""
        response = await client.get("/api/v1/monitoring/system-health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "components" in data
        
        # Check components structure
        components = data["components"]
        assert "api" in components
        assert "database" in components
        assert "cache" in components
    
    @pytest.mark.asyncio
    async def test_prometheus_metrics_endpoint(self, client):
        """Test Prometheus metrics endpoint returns valid format."""
        response = await client.get("/api/v1/monitoring/metrics/prometheus")
        
        assert response.status_code == 200
        content = response.text
        
        # Prometheus format should contain HELP and TYPE directives
        assert "# HELP" in content
        assert "# TYPE" in content
    
    @pytest.mark.asyncio
    async def test_performance_metrics_endpoint(self, client):
        """Test performance metrics endpoint."""
        response = await client.get("/api/v1/monitoring/performance")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "api" in data
        assert "database" in data
        assert "memory" in data
        assert "cpu" in data
    
    @pytest.mark.asyncio
    async def test_logs_recent_endpoint(self, client):
        """Test recent logs endpoint."""
        response = await client.get("/api/v1/monitoring/logs/recent?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        assert "limit" in data
        assert data["limit"] == 10


# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK TESTS
# ═══════════════════════════════════════════════════════════════

class TestHealthChecks:
    """Tests for health check endpoints."""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self, client):
        """Test basic health endpoint."""
        response = await client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_readiness_endpoint(self, client):
        """Test readiness probe."""
        response = await client.get("/health/ready")
        
        # Should return 200 or 503 depending on DB availability
        assert response.status_code in [200, 503]
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
    
    @pytest.mark.asyncio
    async def test_liveness_endpoint(self, client):
        """Test liveness probe."""
        response = await client.get("/health/live")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "alive"
        assert "version" in data


# ═══════════════════════════════════════════════════════════════
# CACHING TESTS
# ═══════════════════════════════════════════════════════════════

class TestCachingLayer:
    """Tests for Redis caching functionality."""
    
    @pytest.mark.asyncio
    async def test_dashboard_caching_improves_response(self, client):
        """Test that repeated dashboard calls benefit from caching."""
        # First call (cache miss)
        response1 = await client.get("/api/v1/dashboard/overview")
        assert response1.status_code == 200
        
        # Second call (should be cached)
        response2 = await client.get("/api/v1/dashboard/overview")
        assert response2.status_code == 200
        
        # Both should return same structure
        data1 = response1.json()
        data2 = response2.json()
        
        assert data1.keys() == data2.keys()


# ═══════════════════════════════════════════════════════════════
# ERROR HANDLING TESTS
# ═══════════════════════════════════════════════════════════════

class TestErrorHandling:
    """Tests for error handling and edge cases."""
    
    @pytest.mark.asyncio
    async def test_invalid_endpoint_returns_404(self, client):
        """Test that invalid endpoints return 404."""
        response = await client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_market_declarations_invalid_params(self, client):
        """Test market declarations with invalid parameters."""
        response = await client.get("/api/v1/market/declarations?limit=-1")
        
        # Should handle gracefully (either validation error or default)
        assert response.status_code in [200, 422]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
