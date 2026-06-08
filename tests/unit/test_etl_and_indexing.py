from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.etl.processor import (
    EnrichmentTransform,
    ETLProcessor,
    NormalizationTransform,
    ProcessorResult,
)
from app.services.indexing_service import IndexingService


@pytest.mark.asyncio
async def test_normalization_transform():
    """Тестування NormalizationTransform очищення рядків."""
    transform = NormalizationTransform()
    record = {"name": "  Дмитро  ", "code": " 12345 ", "status": "active"}
    result = await transform.transform(record)
    assert result["name"] == "Дмитро"
    assert result["code"] == "12345"
    assert result["status"] == "active"


@pytest.mark.asyncio
async def test_enrichment_transform():
    """Тестування EnrichmentTransform додавання метаданих."""
    transform = EnrichmentTransform()
    record = {"name": "Тест"}
    result = await transform.transform(record)
    assert "metadata" in result
    assert result["metadata"]["processed_by"] == "etl_v67"


@pytest.mark.asyncio
async def test_etl_processor_success():
    """Тестування успішної обробки даних через ETLProcessor."""
    processor = ETLProcessor()
    data = [
        {"name": "  Компанія А  ", "value": 100},
        {"name": "Компанія Б  ", "value": 200},
    ]
    result = await processor.process(data, pipeline="default")
    assert isinstance(result, ProcessorResult)
    assert result.success is True
    assert result.records_processed == 2
    assert result.records_failed == 0
    assert len(result.errors) == 0
    assert data[0]["name"] == "Компанія А"
    assert data[0]["metadata"]["processed_by"] == "etl_v67"


@pytest.mark.asyncio
async def test_etl_processor_failure():
    """Тестування обробки помилок трансформерів у ETLProcessor."""
    processor = ETLProcessor()

    # Створюємо трансформер, який викликає виняток
    class BrokenTransform:
        async def transform(self, record):
            raise ValueError("Симульована помилка трансформації")

    # Додаємо його до кастомного пайплайну
    processor.pipelines["broken"] = [BrokenTransform()]

    data = [{"name": "Тест 1"}, {"name": "Тест 2"}]
    result = await processor.process(data, pipeline="broken")

    assert result.success is False
    assert result.records_processed == 0
    assert result.records_failed == 2
    assert len(result.errors) > 0
    assert "Симульована помилка трансформації" in result.errors[0]


@pytest.mark.asyncio
async def test_indexing_service_success():
    """Тестування паралельної індексації через IndexingService."""
    # Мокаємо залежності сервісу індексації
    mock_embedding = MagicMock()
    mock_opensearch = MagicMock()
    mock_opensearch.index_documents = AsyncMock(return_value=True)
    mock_qdrant = MagicMock()

    with patch("app.services.indexing_service.get_embedding_service", return_value=mock_embedding), \
         patch("app.services.indexing_service.opensearch_indexer", mock_opensearch), \
         patch("app.services.indexing_service.qdrant_service", mock_qdrant):

        service = IndexingService()
        documents = [{"title": "Документ 1", "content": "Вміст 1"}]

        # Патчимо внутрішні методи для БД
        service._index_postgresql = AsyncMock(return_value=True)
        service._index_clickhouse = AsyncMock(return_value=True)
        service._index_neo4j = AsyncMock(return_value=True)

        res = await service.index_documents(documents, dataset_type="custom", index_name="test_index")

        assert res is True
        # Перевіряємо concurrent виклики
        mock_opensearch.index_documents.assert_called_once_with(
            index_name="test_index",
            documents=documents,
            embedding_service=mock_embedding,
            qdrant_service=mock_qdrant,
            tenant_id="default",
        )
        service._index_postgresql.assert_called_once_with(documents)
        service._index_clickhouse.assert_called_once_with(documents)
        service._index_neo4j.assert_called_once_with(documents)


@pytest.mark.asyncio
async def test_indexing_service_partial_failure():
    """Тестування роботи IndexingService при частковій помилці в одному з провайдерів."""
    mock_embedding = MagicMock()
    mock_opensearch = MagicMock()
    mock_opensearch.index_documents = AsyncMock(side_effect=Exception("OpenSearch Down"))
    mock_qdrant = MagicMock()

    with patch("app.services.indexing_service.get_embedding_service", return_value=mock_embedding), \
         patch("app.services.indexing_service.opensearch_indexer", mock_opensearch), \
         patch("app.services.indexing_service.qdrant_service", mock_qdrant):

        service = IndexingService()
        documents = [{"title": "Документ 1"}]

        service._index_postgresql = AsyncMock(return_value=True)
        service._index_clickhouse = AsyncMock(return_value=True)
        service._index_neo4j = AsyncMock(return_value=True)

        # Незважаючи на помилку в OpenSearch, загальний метод має обробити виняток і повернути True (або залогувати)
        res = await service.index_documents(documents, index_name="test_index")
        assert res is True

        # Інші БД все одно мали бути викликані
        service._index_postgresql.assert_called_once_with(documents)
        service._index_clickhouse.assert_called_once_with(documents)
        service._index_neo4j.assert_called_once_with(documents)
