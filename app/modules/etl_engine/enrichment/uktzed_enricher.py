from __future__ import annotations

"""
UKTZED Enricher

Extracts and parses the hierarchical structure from "Код товару" (Commodity codes).
(COMP-038)
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

class UktzedEnricher:
    """Enriches data with UKTZED hierarchies based on product codes."""

    def __init__(self):
        pass

    def process_batch(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Enriches a batch of records by expanding UKTZED codes.
        A full UKTZED code is 10 digits (e.g. '8517120000').
        - 2 digits: Chapter
        - 4 digits: Heading
        - 6 digits: Subheading
        """
        enriched_records = []
        for record in records:
            # Assuming DataTransformer already normalized 'Код товару' to string
            code = record.get("Код товару", "")

            # Ensure string (defensive)
            code_str: str = str(record.get("Код товару", ""))

            # Standardize length if less than 10 digits (some variants trim leading zeroes)
            # Typically 'Код товару' can be 10 digits. We shouldn't pad if it's
            # naturally short, but we should parse what's there.
            
            # The structure is standard logic based
            c_chapter = code_str[:2] if len(code_str) >= 2 else None
            c_heading = code_str[:4] if len(code_str) >= 4 else None
            c_subheading = code_str[:6] if len(code_str) >= 6 else None
            
            # Additional enrichment like actual names could happen here based on a local dictionary
            # For now, it just exposes the hierarchical fields to allow aggregation.

            record["_uktzed_chapter"] = c_chapter
            record["_uktzed_heading"] = c_heading
            record["_uktzed_subheading"] = c_subheading
            
            # Basic validation
            record["_is_valid_uktzed"] = len(code_str) == 10 and code_str.isdigit()

            enriched_records.append(record)

        logger.debug(f"UktzedEnricher processed {len(enriched_records)} records.")
        return enriched_records

def create_uktzed_enricher() -> UktzedEnricher:
    return UktzedEnricher()
