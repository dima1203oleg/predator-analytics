from __future__ import annotations

"""
Geo Enricher

Enriches records with geographic information, normalizing country names
to standard ISO 3166-1 alpha-2 codes or similar regions.
(COMP-037)
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

class GeoEnricher:
    """Enriches data with geographical mapping and standardization."""

    def __init__(self):
        # A basic mapping dictionary for common Ukrainian customs countries.
        # In a full implementation, this should be driven by a DB lookup or more extensive library.
        self.country_mapping = {
            "КИТАЙ": "CN",
            "ТУРЕЧЧИНА": "TR",
            "ПОЛЬЩА": "PL",
            "НІМЕЧЧИНА": "DE",
            "УКРАЇНА": "UA",
            "СПОЛ.ШТАТИ": "US",
            "США": "US",
            "ІТАЛІЯ": "IT",
            "ФРАНЦІЯ": "FR",
            "ВЕЛИКА БРИТАНІЯ": "GB",
            "ЯПОНІЯ": "JP",
            "ПІВДЕННА КОЕРЯ": "KR",
            "ІНДІЯ": "IN",
            "ІСПАНІЯ": "ES",
            "ЧЕСЬКА РЕСПУБЛІКА": "CZ",
            "РУМУНІЯ": "RO",
            "НІДЕРЛАНДИ": "NL",
            "ЛИТВА": "LT",
            "ЛАТВІЯ": "LV",
            "ЕСТОНІЯ": "EE",
            "СЛОВАЧЧИНА": "SK",
            "УГОРЩИНА": "HU",
            "ВʼЄТНАМ": "VN",
            "ТАЙВАНЬ": "TW",
        }

    def process_batch(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Enriches a batch of records by normalizing country names.
        """
        processed_records = []
        for record in records:
            # Depending on the dataset, fields might be different.
            # Default ones for standard Ukrainian customs
            origin_country = record.get("Країна походження", "")
            dispatch_country = record.get("Країна відправлення", "")
            trading_country = record.get("Торгуюча країна", "")

            # Default to string for safe upper operations
            origin_country = str(origin_country).strip().upper() if origin_country else ""
            dispatch_country = str(dispatch_country).strip().upper() if dispatch_country else ""
            trading_country = str(trading_country).strip().upper() if trading_country else ""

            # Standardize logic map
            record["_geo_origin_code"] = self._map_country(origin_country)
            record["_geo_dispatch_code"] = self._map_country(dispatch_country)
            record["_geo_trading_code"] = self._map_country(trading_country)
            
            # Simple regional tagging for Origin
            # Often, we also want to know region like "EU", "Asia", "North America"
            record["_geo_origin_region"] = self._get_region(record["_geo_origin_code"])

            processed_records.append(record)

        logger.debug(f"GeoEnricher processed {len(processed_records)} records.")
        return processed_records

    def _map_country(self, country_name: str) -> str:
        """Map raw country name to standard ISO code."""
        if not country_name:
            return ""
        
        # If it's already an ISO code (length 2), just return it
        if len(country_name) == 2 and country_name.isalpha():
            return country_name

        # Mapping for full Cyrillic names
        return self.country_mapping.get(country_name, country_name) # Fallback to original if not found

    def _get_region(self, iso_code: str) -> str:
        """A simple logic to return region group for an iso_code."""
        eu_codes = {"PL", "DE", "FR", "IT", "ES", "CZ", "RO", "NL", "LT", "LV", "EE", "SK", "HU"}
        asian_codes = {"CN", "JP", "KR", "IN", "VN", "TW", "TR"}
        na_codes = {"US", "CA", "MX"}
        
        if iso_code in eu_codes:
            return "EU"
        elif iso_code in asian_codes:
            return "Asia"
        elif iso_code in na_codes:
            return "North America"
        elif iso_code == "UA":
            return "Ukraine"
        return "Other"

def create_geo_enricher() -> GeoEnricher:
    return GeoEnricher()
