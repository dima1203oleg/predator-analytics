
import pytest

from app.services.chaos_service import ChaosService


@pytest.mark.asyncio
async def test_chaos_service_logic():
    # 1. Початковий стан
    status = ChaosService.get_status()
    assert len(status) == 0

    # 2. Активація експерименту
    ChaosService.set_experiment("cache_failure", True)
    status = ChaosService.get_status()
    assert "cache_failure" in status
    assert status["cache_failure"]["active"] is True

    # 3. Перевірка застосування хаосу
    result = await ChaosService.apply_chaos()
    assert result == {"error": "Cache connection lost", "chaos": True}

    # 4. Деактивація
    ChaosService.set_experiment("cache_failure", False)
    result = await ChaosService.apply_chaos()
    assert result is None

@pytest.mark.asyncio
async def test_overheat_simulation():
    ChaosService.set_experiment("overheat_simulation", True)
    result = await ChaosService.apply_chaos()
    assert result == {"status": "overheat", "vram_throttle": True}
    ChaosService.set_experiment("overheat_simulation", False)
