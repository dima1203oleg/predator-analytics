import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class InventoryOptimizer:
    """
    Inventory Optimizer (COMP-256)
    Calculates key supply chain metrics such as Economic Order Quantity (EOQ),
    Safety Stock (SS), and Reorder Point (ROP).
    """
    def __init__(self):
        pass

    def calculate_optimal_inventory(self,
                                    annual_demand: float,
                                    ordering_cost: float,
                                    holding_cost_rate: float,
                                    unit_cost: float,
                                    lead_time_days: float,
                                    daily_demand_variance: float,
                                    service_level_z: float = 1.65) -> Dict[str, Any]:
        """
        Calculates EOQ, Reorder Point, and Safety Stock based on demand and varied factors.
        `service_level_z`: Statistical z-score for desired service level (1.65 = 95%).
        """
        if any(v <= 0 for v in [annual_demand, ordering_cost, holding_cost_rate, unit_cost]):
            return {"error": "Demand, costs, and rate must be strictly positive."}
            
        # Annual holding cost per unit
        H = holding_cost_rate * unit_cost
        
        # Economic Order Quantity
        import math
        eoq = math.sqrt((2 * annual_demand * ordering_cost) / H)
        
        # Average daily demand
        avg_daily_demand = annual_demand / 365.0
        
        # Safety Stock calculation
        # SS = Z * sqrt(LeadTime * DemandVariance + (AvgDemand * LeadTimeVariance))
        # Assuming lead time variance is 0 for simplicity here
        safety_stock = service_level_z * math.sqrt(lead_time_days * daily_demand_variance)
        
        # Reorder Point
        rop = (avg_daily_demand * lead_time_days) + safety_stock
        
        return {
            "economic_order_quantity": int(round(eoq)),
            "safety_stock": int(round(safety_stock)),
            "reorder_point": int(round(rop)),
            "annual_holding_cost": (eoq / 2) * H,
            "annual_ordering_cost": (annual_demand / eoq) * ordering_cost,
            "metrics": {
                "service_level_z": service_level_z,
                "lead_time_days": lead_time_days
            }
        }
