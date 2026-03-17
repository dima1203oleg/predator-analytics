import pytest

from ..app.fusion_engine import ДвигунЗлиттяДаних
from app.registries.ua_registries import УкраїнськийРеєстр


@pytest.mark.asyncio
async def test_data_fusion_engine_enrichment():
    """Тест перевіряє базовий сценарій збагачення компанії через Data Fusion Engine"""
    registry = УкраїнськийРеєстр(base_url="https://test.api")
    engine = ДвигунЗлиттяДаних(registry)

    test_edrpou = "12345678"
    test_ueid = f"ueid_{test_edrpou}"

    result = await engine.збагатити_компанію(edrpou=test_edrpou, ueid=test_ueid)

    assert result.edrpou == test_edrpou
    assert result.ueid == test_ueid
    assert result.назва == "ТОВ 'АГРО-ІМПОРТ ПРЕДАТОР'"
    assert result.ризик_скор > 0.0

    # Закриваємо сесію
    await registry.закрити()
