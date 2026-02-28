"""Predator v55.0 — Phantom Flow Index (PFI).

Formula (spec 6.9):
    PFI = ImportVolume - (DomesticSale + Export + InventoryChange)

Detects "phantom" goods — imports that disappear from the economy
without traceable downstream activity.
Output: absolute value, normalized to 0-100 for CERS.
"""

from __future__ import annotations


def calculate_pfi(
    import_volume: float,
    domestic_sale: float,
    export_volume: float,
    inventory_change: float,
) -> float:
    """Calculate Phantom Flow Index.

    Args:
        import_volume: Total imports.
        domestic_sale: Domestic sales.
        export_volume: Exports.
        inventory_change: Change in inventory.

    Returns:
        PFI raw value. Positive = phantom flow detected.
    """
    return round(
        import_volume - (domestic_sale + export_volume + inventory_change),
        2,
    )


def calculate_pfi_normalized(
    import_volume: float,
    domestic_sale: float,
    export_volume: float,
    inventory_change: float,
) -> float:
    """Calculate PFI normalized to 0-100 scale for CERS integration.

    Returns:
        PFI score (0-100). Higher = larger phantom flow.
    """
    raw = calculate_pfi(import_volume, domestic_sale, export_volume, inventory_change)

    if import_volume <= 0:
        return 0.0

    ratio = abs(raw) / import_volume
    return round(max(0.0, min(100.0, ratio * 100.0)), 2)
