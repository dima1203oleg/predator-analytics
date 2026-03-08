import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CreditRiskModel:
    """
    Credit Risk Model (COMP-251)
    Calculates essential risk metrics: PD (Probability of Default), 
    LGD (Loss Given Default), and EAD (Exposure at Default).
    Returns basic Expected Loss (EL).
    """
    def __init__(self):
        pass

    def _estimate_lgd(self, collateral_value: float, exposure_amount: float, recovery_rate_base: float = 0.4) -> float:
        """
        Estimates Loss Given Default. 
        Higher collateral lowers LGD.
        """
        if exposure_amount <= 0:
            return 0.0

        collateral_coverage = min(collateral_value / exposure_amount, 1.0)
        
        # Simple heuristic: LGD decreases as collateral coverage increases
        lgd = (1.0 - recovery_rate_base) * (1.0 - (collateral_coverage * 0.8)) # 20% haircut on collateral
        
        return max(min(lgd, 1.0), 0.0)

    def calculate_credit_risk(self,
                              default_probability_percent: float,
                              exposure_amount: float,
                              collateral_value: float = 0.0,
                              credit_conversion_factor: float = 1.0) -> Dict[str, Any]:
        """
        Calculates EL = PD * LGD * EAD
        """
        if not (0 <= default_probability_percent <= 100):
            return {"error": "PD must be between 0 and 100"}
            
        pd = default_probability_percent / 100.0
        
        # Exposure At Default
        ead = exposure_amount * credit_conversion_factor
        
        # Loss Given Default
        lgd = self._estimate_lgd(collateral_value, ead)
        
        # Expected Loss
        el = pd * lgd * ead
        
        return {
            "metrics": {
                "probability_of_default": pd,
                "loss_given_default": lgd,
                "exposure_at_default": ead,
                "expected_loss": el
            },
            "parameters": {
                "collateral_value": collateral_value,
                "ccf": credit_conversion_factor
            }
        }
