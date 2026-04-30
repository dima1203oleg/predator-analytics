import pytest

from app.engines.cers import CERSResult, calculate_cers


def test_cers_basic_calculation():
    result = calculate_cers("test-ueid", 50.0, 60.0, 70.0, 80.0, 90.0)
    assert isinstance(result, CERSResult)
    # The current engine uses z-score then minmax(0, 100).
    # For a linearly spaced sequence, the weighted sum of normalized values will be 46.25.
    assert result.score == pytest.approx(46.25)
    assert result.level == "elevated"


def test_cers_v1_mode():
    result = calculate_cers("test-ueid-v1", 40.0, 50.0, 60.0)
    assert result.score == pytest.approx(50.0)
    assert result.level == "elevated"
