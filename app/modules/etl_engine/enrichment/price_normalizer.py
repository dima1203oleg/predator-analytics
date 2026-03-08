from __future__ import annotations

"""
Price Normalizer

Calculates unit prices and normalizes currencies for records.
(COMP-040)
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

class PriceNormalizer:
    """Normalizes price and weight fields to calculate unit economics."""

    def __init__(self, fallback_currency: str = "UAH"):
        self.fallback_currency = fallback_currency

    def process_batch(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Enriches a batch of records with normalized prices per unit (e.g. per kg).
        """
        processed_records = []
        for record in records:
            # 1. Try to extract necessary fields
            # Customs value in UAH is often available
            customs_value_uah = record.get("Митна варість, грн")
            
            # Gross/Net weight
            net_weight = record.get("Вага нетто, кг")
            gross_weight = record.get("Маса, брутто, кг")
            
            # Convert to float safely (DataTransformer should have done this, but we defend)
            try:
                val_uah = float(customs_value_uah) if customs_value_uah is not None else 0.0
            except ValueError:
                val_uah = 0.0
                
            try:
                weight_kg = float(net_weight) if net_weight else (float(gross_weight) if gross_weight else 0.0)
            except ValueError:
                weight_kg = 0.0

            # 2. Calculate unit price
            if weight_kg > 0 and val_uah > 0:
                price_per_kg_uah = val_uah / weight_kg
            else:
                price_per_kg_uah = 0.0

            # 3. Add enriched fields
            record["_normalized_price_uah"] = val_uah
            record["_normalized_weight_kg"] = weight_kg
            record["_price_per_kg_uah"] = price_per_kg_uah
            
            # If we had exchange rates, we could also compute price_per_kg_usd here
            # For MVP, we provide a mock USD calculation assuming an avg rate of ~40 UAH/USD
            # (In production, replace with real exchange rate fetcher per date)
            EXCHANGE_RATE_UAH_TO_USD = 40.0
            record["_price_per_kg_usd"] = price_per_kg_uah / EXCHANGE_RATE_UAH_TO_USD if price_per_kg_uah > 0 else 0.0

            processed_records.append(record)

        logger.debug(f"PriceNormalizer processed {len(processed_records)} records.")
        return processed_records

def create_price_normalizer() -> PriceNormalizer:
    return PriceNormalizer()
