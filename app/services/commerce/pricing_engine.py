import logging
from typing import Any

logger = logging.getLogger(__name__)

class PricingEngine:
    """Pricing Engine (COMP-258)
    Recommends optimal prices based on competitor pricing, demand elasticity,
    and target margins.
    """

    def __init__(self):
        pass

    def recommend_price(self,
                        base_cost: float,
                        competitor_prices: list[float],
                        demand_elasticity: float,
                        target_margin: float) -> dict[str, Any]:
        """Calculates optimal price.
        """
        if base_cost <= 0:
            return {"error": "Base cost must be positive."}

        # Target Price based purely on margin
        margin_price = base_cost / (1 - target_margin) if target_margin < 1 else base_cost * 2

        # Competitor Price Analysis
        avg_competitor_price = sum(competitor_prices) / len(competitor_prices) if competitor_prices else margin_price
        min_competitor_price = min(competitor_prices) if competitor_prices else margin_price

        # Adjust based on elasticity.
        # High elasticity (> 1) means we should be closer to lower competitor prices
        # Low elasticity (< 1) means we can lean closer to our target margin price

        if demand_elasticity > 1.5:
            # Highly elastic, match or slightly underbid min competitor
            optimal_price = min(margin_price, min_competitor_price * 0.98)
            strategy = "Aggressive Penetration"
        elif demand_elasticity > 1.0:
            optimal_price = (margin_price + avg_competitor_price) / 2
            strategy = "Competitive Matching"
        else:
            # Inelastic, can command margin pricing
            optimal_price = margin_price
            strategy = "Margin Maximization"

        # Ensure we never sell below cost (plus a tiny safety buffer)
        final_price = max(optimal_price, base_cost * 1.05)

        return {
            "recommended_price": final_price,
            "pricing_strategy": strategy,
            "projected_margin": (final_price - base_cost) / final_price,
            "competitor_context": {
                "average": avg_competitor_price,
                "minimum": min_competitor_price
            }
        }
