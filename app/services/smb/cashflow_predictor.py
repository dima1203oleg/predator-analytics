import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class CashflowPredictor:
    """
    Cashflow Predictor (COMP-216)
    Predicts monthly inflows and outflows for SMBs using simplified 
    historical accounting vectors.
    """
    def __init__(self):
        pass

    def predict_next_3_months(self, historical_cashflows: List[float]) -> Dict[str, Any]:
        """
        AI-driven forecast for upcoming cash availability.
        """
        if len(historical_cashflows) < 3:
            return {"error": "Insufficient historical data for accurate prediction."}

        avg_delta = sum(historical_cashflows[i] - historical_cashflows[i-1] for i in range(1, len(historical_cashflows))) / (len(historical_cashflows) - 1)
        last_val = historical_cashflows[-1]
        
        predictions = [last_val + (avg_delta * (i + 1)) for i in range(3)]
        
        return {
            "forecast": [
                {"month": "+1", "predicted_cash": f"{predictions[0]:.2f}"},
                {"month": "+2", "predicted_cash": f"{predictions[1]:.2f}"},
                {"month": "+3", "predicted_cash": f"{predictions[2]:.2f}"}
            ],
            "confidence": 0.82 if len(historical_cashflows) > 6 else 0.55,
            "trend": "upward" if avg_delta > 0 else "downward"
        }
