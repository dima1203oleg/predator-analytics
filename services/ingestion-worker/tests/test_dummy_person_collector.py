import pytest
import asyncio
from app.osint.collectors.dummy_person_collector import DummyPersonCollector

@pytest.mark.asyncio
async def test_dummy_person_collector():
    collector = DummyPersonCollector()
    params = {
        "fullName": "Кізима Дмитро Миколайович",
        "dateOfBirth": "1985-03-12",
        "address": "Львівська обл Стрийський р-н с Угерсько вул Жидачівська 12"
    }
    fragments = await collector.collect(params)
    assert fragments is not None
    assert len(fragments) > 0
    assert fragments[0].source_name == "ЄДР"
    categories = [f.category for f in fragments]
    assert "edrData" in categories
    assert "courtCases" in categories
    assert "socialProfiles" in categories
