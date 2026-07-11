from main import calculate_risk

def test_calculate_risk_base():
    payload = {"id": "1", "country": "usa", "tx_volume": 1000}
    score = calculate_risk(payload)
    assert 0.0 <= score <= 1.0
    # Base risk is around 0.1, max fuzz is 0.05
    assert 0.05 <= score <= 0.15

def test_calculate_risk_high_risk():
    payload = {"id": "2", "country": "cyprus", "tx_volume": 2000000}
    score = calculate_risk(payload)
    # Base 0.1 + 0.5 (cyprus) + 0.3 (volume) = 0.9 +/- 0.05
    assert 0.85 <= score <= 0.95
