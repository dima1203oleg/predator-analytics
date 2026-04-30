from functools import lru_cache

from .inventory_optimizer import InventoryOptimizer
from .pricing_engine import PricingEngine


@lru_cache
def get_pricing_engine() -> PricingEngine:
    return PricingEngine()

@lru_cache
def get_inventory_optimizer() -> InventoryOptimizer:
    return InventoryOptimizer()

__all__ = [
    "InventoryOptimizer",
    "PricingEngine",
    "get_inventory_optimizer",
    "get_pricing_engine"
]
