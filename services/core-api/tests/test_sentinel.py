import pytest
from app.services.vram_watchdog import VramSentinel

@pytest.mark.asyncio
async def test_sentinel_mode_switching():
    sentinel = VramSentinel()
    
    # Симулюємо низьке навантаження
    mode = sentinel._calculate_mode(2.0)
    assert mode == "SOVEREIGN"
    
    # Симулюємо середнє навантаження
    mode = sentinel._calculate_mode(4.0)
    assert mode == "HYBRID"
    
    # Симулюємо критичне навантаження
    mode = sentinel._calculate_mode(7.8)
    assert mode == "CLOUD"

@pytest.mark.asyncio
async def test_sentinel_stats():
    sentinel = VramSentinel()
    stats = await sentinel.get_stats()
    assert "vram_usage_gb" in stats
    assert "mode" in stats
    assert "last_check" in stats
