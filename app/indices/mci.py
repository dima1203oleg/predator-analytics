"""Predator v55.0 — Missing Chain Index (MCI).

Formula (spec 6.8):
    MCI = (Import + Production) - (DomesticSales + Export + InventoryChange)

Detects "missing links" in supply chains — goods that enter but don't
appear in expected downstream channels.
Output: absolute value, normalized to 0-100 for CERS.
"""

from __future__ import annotations


def calculate_mci(
    import_volume: float,
    production: float,
    domestic_sales: float,
    export_volume: float,
    inventory_change: float,
) -> float:
    """Calculate Missing Chain Index.

    Args:
        import_volume: Total imports (monetary or volume).
        production: Domestic production.
        domestic_sales: Domestic sales.
        export_volume: Exports.
        inventory_change: Change in inventory (positive = increase).

    Returns:
        MCI raw value. Positive = more goods enter than exit (suspicious).
    """
    supply = import_volume + production
    demand = domestic_sales + export_volume + inventory_change

    return round(supply - demand, 2)


def calculate_mci_normalized(
    import_volume: float,
    production: float,
    domestic_sales: float,
    export_volume: float,
    inventory_change: float,
    total_market_volume: float = 1.0,
) -> float:
    """Calculate MCI normalized to 0-100 scale for CERS integration.

    Args:
        total_market_volume: Total market volume for normalization.

    Returns:
        MCI score (0-100). Higher = larger gap.
    """
    raw = calculate_mci(
        import_volume,
        production,
        domestic_sales,
        export_volume,
        inventory_change,
    )

    if total_market_volume <= 0:
        return 0.0

    ratio = abs(raw) / total_market_volume
    return round(max(0.0, min(100.0, ratio * 100.0)), 2)
