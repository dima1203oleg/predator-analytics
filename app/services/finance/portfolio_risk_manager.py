import logging
from typing import Dict, Any, List
import numpy as np

logger = logging.getLogger(__name__)

class PortfolioRiskManager:
    """
    Portfolio Risk Manager (COMP-252)
    Computes Value at Risk (VaR) and performs stress tests on a portfolio 
    of assets or exposures.
    """
    def __init__(self, confidence_level: float = 0.95):
        self.confidence_level = confidence_level

    def calculate_historical_var(self, returns: List[float], portfolio_value: float) -> Dict[str, Any]:
        """
        Calculate Historical Value at Risk given a history of portfolio returns
        and the current value of the portfolio.
        Returns the potential loss at the given confidence level.
        """
        if not returns:
            return {"error": "Return history is empty."}
            
        returns_array = np.array(returns)
        
        # Sort returns ascending (worst losses first)
        sorted_returns = np.sort(returns_array)
        
        # Determine the percentile index
        index = int((1.0 - self.confidence_level) * len(sorted_returns))
        
        # The VaR return rate is the return at the threshold
        var_return = sorted_returns[index]
        
        # VaR value in monetary terms (as a positive number representing loss)
        var_value = abs(var_return * portfolio_value) if var_return < 0 else 0.0
        
        return {
            "var_amount": var_value,
            "var_percentage": abs(var_return) if var_return < 0 else 0.0,
            "confidence_level": self.confidence_level,
            "method": "Historical Simulation"
        }

    def stress_test(self, current_value: float, shock_scenarios: Dict[str, float]) -> Dict[str, Any]:
        """
        Perform stress testing by subjecting the portfolio to predefined shocks.
        shock_scenarios is a dict mapping scenario name to a percentage drop
        (e.g., {"Market Crash": -0.30}).
        """
        results = {}
        for scenario_name, shock_pct in shock_scenarios.items():
            shocked_value = current_value * (1 + shock_pct)
            loss = current_value - shocked_value
            
            results[scenario_name] = {
                "shock_percentage": shock_pct,
                "projected_value": shocked_value,
                "projected_loss": loss
            }
            
        return {
            "current_value": current_value,
            "scenarios": results
        }
