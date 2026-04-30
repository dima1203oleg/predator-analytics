import logging
import random
from typing import Any

logger = logging.getLogger(__name__)

class HarvestPredictor:
    """Harvest Predictor (COMP-221)
    Predicts crop yields based on moisture, temperature, and historical soil data.
    """

    def __init__(self):
        pass

    def predict_yield(self, field_id: str, crop_type: str, sensors: dict[str, float]) -> dict[str, Any]:
        """Simulated yields based on environmental factors.
        """
        moisture = sensors.get("soil_moisture", 0.5)
        temp = sensors.get("avg_temp", 20.0)

        # Simple heuristic for yield
        base_yield = 5.0 # tons per hectare
        if crop_type.lower() == "corn":
            base_yield = 8.0
        elif crop_type.lower() == "wheat":
            base_yield = 4.5

        variation = (moisture - 0.5) * 2 + (temp - 20) * 0.1
        predicted = base_yield + variation + random.uniform(-0.5, 0.5)

        return {
            "field_id": field_id,
            "crop": crop_type,
            "predicted_yield_t_ha": f"{max(0, predicted):.2f}",
            "risk_factors": ["Low moisture" if moisture < 0.3 else "Optimal"],
            "harvest_window": "2026-08-15 to 2026-09-01"
        }
