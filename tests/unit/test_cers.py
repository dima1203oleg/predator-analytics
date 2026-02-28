import pytest
from app.engines.cers import calculate_cers, CERSResult

def test_cers_basic_calculation():
    result = calculate_cers("test-ueid", 50.0, 60.0, 70.0, 80.0, 90.0)
    assert isinstance(result, CERSResult)
    assert result.score == pytest.approx(75.0)  # Expected weighted average with full layers
    assert result.level == "high_alert"

def test_cers_v1_mode():
    result = calculate_cers("test-ueid-v1", 40.0, 50.0, 60.0)
    assert result.score == pytest.approx(50.0)  # Expected for 3 layers
    assert result.level == "elevated"
