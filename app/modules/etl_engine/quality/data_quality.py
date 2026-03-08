from __future__ import annotations

"""
Data Quality Reporter

Generates metadata and statistics on the processed data.
(COMP-046)
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)

class DataQualityReporter:
    """Accumulates statistics to generate a data quality report."""
    
    def __init__(self):
        self.stats = {
            "total_processed": 0,
            "missing_values_count": 0,
            "valid_uktzed": 0,
            "invalid_uktzed": 0,
            "zero_price_records": 0,
            "duplicate_records": 0,
        }

    def process_batch(self, records: list[dict[str, Any]]) -> None:
        """
        Inspect records to update quality metrics.
        Records should pass through this after all enrichments.
        """
        for record in records:
            self.stats["total_processed"] += 1
            
            # Simple missing fields heuristic
            missing_critical = False
            for critical_field in ["Опис товару", "Код товару"]:
                if not record.get(critical_field):
                    missing_critical = True
                    break
            
            if missing_critical:
                self.stats["missing_values_count"] += 1

            if record.get("_is_valid_uktzed"):
                self.stats["valid_uktzed"] += 1
            else:
                self.stats["invalid_uktzed"] += 1
                
            if record.get("_normalized_price_uah", 0.0) <= 0.0:
                self.stats["zero_price_records"] += 1
                
    def add_duplicates(self, count: int) -> None:
        """Manually add duplicate count from deduplicator."""
        self.stats["duplicate_records"] += count
                
    def generate_report(self) -> dict[str, Any]:
        """Finalize and return the quality report."""
        total = self.stats["total_processed"]
        if total > 0:
            quality_score = max(0, 100 - (self.stats["missing_values_count"] / total * 100) - (self.stats["invalid_uktzed"] / total * 100))
        else:
            quality_score = 100.0

        report = {
            "metrics": self.stats,
            "quality_score_percent": round(quality_score, 2),
            "status": "Healthy" if quality_score >= 90 else "Warning"
        }
        
        logger.info(f"Data Quality Report Generated: Score = {report['quality_score_percent']}%")
        return report

def create_quality_reporter() -> DataQualityReporter:
    return DataQualityReporter()
