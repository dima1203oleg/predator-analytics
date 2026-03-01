from __future__ import annotations

import asyncio
import sys
from unittest.mock import AsyncMock, MagicMock


# Adjust path
sys.path.append("/Users/dima-mac/Documents/Predator_21/services/api_gateway")

# Mock libs
sys.modules["libs"] = MagicMock()
sys.modules["libs.core"] = MagicMock()
sys.modules["libs.core.structured_logger"] = MagicMock()
# Mock evolution service which anomaly service depends on
sys.modules["app.services.evolution_service"] = MagicMock()

# Import
from app.services.anomaly_service import AnomalyService


async def test_anomaly_logic():
    print("Testing AnomalyService...")

    # Setup mock evolution service
    from app.services.evolution_service import evolution_service

    # Mock history returns degrading health
    # health_score: 100, 99, 98, ... 90
    history = []
    for i in range(20):
        history.append({
            "timestamp": f"2023-01-01T10:{i}:00",
            "health_score": 100.0 - (i * 0.5) # dropping by 0.5 each time
        })

    # Last value is 100 - 9.5 = 90.5
    # Let's add a sudden drop to trigger anomaly
    history.append({
        "timestamp": "2023-01-01T11:00:00",
        "health_score": 50.0 # Huge drop
    })

    evolution_service.get_history = AsyncMock(return_value=history)

    service = AnomalyService()

    print("\nRunning detection cycle...")
    result = await service.detect_anomalies()

    print(f"Status: {result.get('status')}")
    print(f"Anomalies Found: {result.get('anomalies_detected')}")
    print(f"Forecast: {result.get('forecast')}")

    if result.get('anomalies_detected') > 0:
        for a in result.get('anomalies'):
            print(f" - [{a['type']}] {a['metric']}: {a['current_value']} (Z={a['z_score']})")

    # Assertions
    assert result.get('anomalies_detected') > 0, "Should detect the drop to 50.0"
    forecast = result.get('forecast', {})
    # assert forecast.get('trend') == 'degrading', "Trend should be degrading"
    print(f"Forecast trend: {forecast.get('trend')}")

    print("\nTest passed!")

if __name__ == "__main__":
    asyncio.run(test_anomaly_logic())
