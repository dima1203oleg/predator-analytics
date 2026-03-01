import pytest
from app.services.ingestion_service import IngestionService


def test_validate_file_excel():
    service = IngestionService()
    valid_excel = b"dummy_excel_data"  # Mock byte data for testing
    invalid_excel = b"invalid_data"
    assert service.validate_file(valid_excel, ".xlsx") is True  # Assuming valid for mock
    assert service.validate_file(invalid_excel, ".xlsx") is False  # Should fail for invalid


def test_parse_excel_basic():
    service = IngestionService()
    sample_data = b"ID,Name\n1,Test"
    records = service.parse_excel(sample_data, "sample.csv")
    assert isinstance(records, list)
    assert len(records) > 0 and "ID" in records[0]
