import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.harvesters.open_sanctions_harvester import OpenSanctionsHarvester

@pytest.fixture
def harvester():
    return OpenSanctionsHarvester()

def test_is_relevant_entity(harvester):
    """Перевірка фільтрації цільових сутностей за схемою."""
    assert harvester._is_relevant_entity({"schema": "Person"}) == True
    assert harvester._is_relevant_entity({"schema": "Company"}) == True
    assert harvester._is_relevant_entity({"schema": "Vessel"}) == True
    assert harvester._is_relevant_entity({"schema": "LegalEntity"}) == True
    
    # Нецільові сутності
    assert harvester._is_relevant_entity({"schema": "UnknownSchema"}) == False
    assert harvester._is_relevant_entity({"schema": "Article"}) == False
    assert harvester._is_relevant_entity({}) == False

@pytest.mark.asyncio
async def test_stream_entities_success(harvester):
    """Перевірка потокового парсингу FtM JSON-рядків."""
    
    # Створюємо фейкові дані (JSON Lines)
    fake_lines = [
        b'{"id": "p1", "schema": "Person", "properties": {"name": ["John Doe"]}}',
        b'{"id": "c1", "schema": "Company", "properties": {"name": ["Acme Corp"]}}',
        b'{"id": "u1", "schema": "Article", "properties": {}}', # Має бути відфільтровано
        b'   ', # Порожній рядок (має ігноруватись)
        b'{"id": "p2", "schema": "Person", "properties": {"name": ["Jane Doe"]}}'
    ]
    
    # Мокаємо aiter_lines()
    async def mock_aiter_lines():
        for line in fake_lines:
            yield line

    # Створюємо мок відповіді
    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.aiter_lines = mock_aiter_lines

    # Мокаємо контекстний менеджер httpx stream()
    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_response

    with patch.object(harvester.http_client, 'stream', return_value=mock_context_manager):
        # Збираємо результати в список
        results = [entity async for entity in harvester.stream_entities()]
        
        # Перевірки
        assert len(results) == 3
        assert results[0]["id"] == "p1"
        assert results[0]["schema"] == "Person"
        assert results[1]["id"] == "c1"
        assert results[2]["id"] == "p2"

@pytest.mark.asyncio
async def test_stream_entities_limit(harvester):
    """Перевірка обмеження кількості результатів через limit."""
    
    # Багато однакових сутностей
    fake_lines = [b'{"id": "test", "schema": "Person"}' for _ in range(10)]
    
    async def mock_aiter_lines():
        for line in fake_lines:
            yield line

    mock_response = AsyncMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.aiter_lines = mock_aiter_lines

    mock_context_manager = AsyncMock()
    mock_context_manager.__aenter__.return_value = mock_response

    with patch.object(harvester.http_client, 'stream', return_value=mock_context_manager):
        results = [entity async for entity in harvester.stream_entities(limit=2)]
        
        # Переконуємось, що ліміт спрацював
        assert len(results) == 2
