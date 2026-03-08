from functools import lru_cache
from .pricing_engine import PricingEngine
from .inventory_optimizer import InventoryOptimizer

@lru_cache()
def get_pricing_engine() -> PricingEngine:
    return PricingEngine()

@lru_cache()
def get_inventory_optimizer() -> InventoryOptimizer:
    return InventoryOptimizer()

__all__ = [
    "PricingEngine", "get_pricing_engine",
    "InventoryOptimizer", "get_inventory_optimizer"
]
