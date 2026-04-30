import io

import pandas as pd
import pytest

from app.services.ingestion_service import IngestionService


@pytest.mark.asyncio
async def test_validate_file_excel():
    service = IngestionService()

    # Create valid dummy excel data using pandas
    output = io.BytesIO()
    df = pd.DataFrame({"A": [1, 2], "B": [3, 4]})
    df.to_excel(output, index=False)
    valid_excel = output.getvalue()

    invalid_excel = b"invalid_data"

    assert await service.validate_file(valid_excel, ".xlsx") is True

    with pytest.raises(ValueError):
        await service.validate_file(invalid_excel, ".xlsx")


@pytest.mark.asyncio
async def test_parse_excel_basic():
    service = IngestionService()
    sample_data = b"ID,Name\n1,Test"
    records = await service.parse_excel(sample_data, "sample.csv")
    assert isinstance(records, list)
    assert len(records) > 0 and "ID" in records[0]
