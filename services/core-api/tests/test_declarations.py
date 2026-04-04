from datetime import date
from unittest.mock import AsyncMock, MagicMock

from httpx import ASGITransport, AsyncClient
import pytest

from app.core.security import get_current_user_payload
from app.database import get_db
from app.dependencies import get_tenant_id
from app.main import app
from app.models.orm import CustomsDeclaration


@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_db():
    db = AsyncMock()
    return db

@pytest.fixture
def mock_user():
    return {
        "sub": "user-123",
        "role": "admin",
        "tenant_id": "test-tenant",
        "is_active": True
    }

@pytest.mark.asyncio
async def test_search_declarations_success(async_client, mock_db, mock_user):
    # Setup dependency overrides
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    # Mock Declaration data
    mock_decl = MagicMock(spec=CustomsDeclaration)
    mock_decl.id = "decl-uuid-1"
    mock_decl.declaration_number = "100000001/2024/000001"
    mock_decl.declaration_date = date(2024, 1, 15)
    mock_decl.importer_ueid = "UEID-123"
    mock_decl.uktzed_code = "8471300000"
    mock_decl.goods_description = "Ноутбуки"
    mock_decl.customs_value_usd = 50000.0
    mock_decl.country_origin = "CN"

    # Mock DB row (row[0] is declaration, and it has attributes importer_name, company_risk)
    mock_row = MagicMock()
    mock_row.__getitem__.side_effect = lambda x: mock_decl if x == 0 else None
    mock_row.importer_name = "Test Importer"
    mock_row.company_risk = 15

    # Mock DB result for all()
    mock_result_set = MagicMock()
    mock_result_set.all.return_value = [mock_row]

    # Mock result for count query
    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 1

    mock_db.execute.side_effect = [mock_count_res, mock_result_set]

    response = await async_client.get("/api/v1/declarations", params={"search": "100000001"})

    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert len(data["data"]) == 1
    assert data["data"][0]["declaration_number"] == "100000001/2024/000001"
    assert data["data"][0]["importer_name"] == "Test Importer"
    assert data["meta"]["total"] == 1

    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_search_declarations_empty(async_client, mock_db, mock_user):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user_payload] = lambda: mock_user
    app.dependency_overrides[get_tenant_id] = lambda: "test-tenant"

    mock_result_set = MagicMock()
    mock_result_set.all.return_value = []

    mock_count_res = MagicMock()
    mock_count_res.scalar.return_value = 0

    mock_db.execute.side_effect = [mock_count_res, mock_result_set]

    response = await async_client.get("/api/v1/declarations", params={"search": "NONEXISTENT"})

    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 0
    assert data["meta"]["total"] == 0

    app.dependency_overrides.clear()
