import pytest
from unittest.mock import AsyncMock, patch
from app.services.vram_watchdog import VramSentinel, VramStatus

@pytest.mark.asyncio
async def test_sentinel_mode_recommendation():
    sentinel = VramSentinel()
    
    # Тестуємо розрахунок рекомендацій через мок реальної VRAM
    with patch.object(sentinel, '_get_real_vram', new_callable=AsyncMock) as mock_get:
        # Симулюємо низьке навантаження
        mock_get.return_value = 2.0
        stats = await sentinel.get_stats()
        assert stats.mode_recommendation == "SOVEREIGN"
        assert not stats.critical
        
        # Симулюємо середнє навантаження
        mock_get.return_value = 6.8
        stats = await sentinel.get_stats()
        assert stats.mode_recommendation == "HYBRID"
        assert not stats.critical
        
        # Симулюємо критичне навантаження
        mock_get.return_value = 7.8
        stats = await sentinel.get_stats()
        assert stats.mode_recommendation == "CLOUD"
        assert stats.critical

@pytest.mark.asyncio
async def test_sentinel_stats():
    sentinel = VramSentinel()
    stats = await sentinel.get_stats()
    assert isinstance(stats, VramStatus)
    assert isinstance(stats.used_gb, float)
    assert stats.total_gb == 8.0
    assert isinstance(stats.critical, bool)
    assert stats.mode_recommendation in ["SOVEREIGN", "HYBRID", "CLOUD"]
