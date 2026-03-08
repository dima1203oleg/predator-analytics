from __future__ import annotations

"""
Data Deduplication Layer

Generates unique SHA-256 signatures for records and provides 
functionality to identify and handle duplicate entries.
"""

import hashlib
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

class DataDeduplicator:
    """Identifies and marks duplicates using SHA-256 hashing."""

    def __init__(self, primary_keys: list[str] | None = None):
        """
        Args:
            primary_keys: Optional list of keys that uniquely define a record.
                          If provided, the hash is created using only these fields.
                          If None, the hash is created from the entire record.
        """
        self.primary_keys = primary_keys
        self.seen_signatures = set()
        logger.info(f"DataDeduplicator initialized with keys: {primary_keys or 'ALL'}")

    def _generate_signature(self, record: dict[str, Any]) -> str:
        """Generate a SHA-256 hash for a dictionary record."""
        # 1. Select the fields to hash
        if self.primary_keys:
            # Extract only specified keys, falling back to empty string if missing
            data_to_hash = {k: record.get(k, "") for k in self.primary_keys}
        else:
            # Hash the whole record (except metadata like timestamp or source if we want them ignored? - usually we hash all)
            data_to_hash = {k: v for k, v in record.items() if k not in ("source_format", "timestamp", "job_id")}
        
        # 2. Convert to a stable JSON string (sorted keys)
        try:
            stable_str = json.dumps(data_to_hash, sort_keys=True, default=str)
        except TypeError as e:
            # Fallback if there are non-serializable objects
            stable_str = str(data_to_hash)
            logger.warning(f"Failed to JSON serialize record for hashing, using str(): {e}")

        # 3. Compute SHA-256
        sha_signature = hashlib.sha256(stable_str.encode("utf-8")).hexdigest()
        return sha_signature

    def process_batch(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        """
        Process a batch of records, attaching a 'signature' to each and 
        filtering out exact duplicates within the current in-memory set.
        
        Returns a dict with:
            - "unique_records": List of unique records
            - "duplicate_records": List of discarded duplicates (within this run)
            - "stats": Dictionary with counts
        """
        unique_records = []
        duplicate_records = []

        for record in records:
            signature = self._generate_signature(record)
            
            # Attach signature to record
            record["_signature"] = signature

            if signature in self.seen_signatures:
                duplicate_records.append(record)
            else:
                self.seen_signatures.add(signature)
                unique_records.append(record)
                
        # Also log stats about deduplication
        logger.debug(f"Deduplicator processed batch: {len(unique_records)} unique, {len(duplicate_records)} duplicates.")
        
        return {
            "unique_records": unique_records,
            "duplicate_records": duplicate_records,
            "stats": {
                "total_processed": len(records),
                "unique_count": len(unique_records),
                "duplicate_count": len(duplicate_records)
            }
        }
    
    def clear_cache(self):
        """Clears the in-memory set of seen signatures."""
        self.seen_signatures.clear()
        
    def generate_signatures_only(self, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """
        Just calculate and attach the `_signature` to each record without 
        filtering them or retaining them in memory.
        """
        for record in records:
            record["_signature"] = self._generate_signature(record)
        return records

def create_data_deduplicator(primary_keys: list[str] | None = None) -> DataDeduplicator:
    """Factory function for DataDeduplicator."""
    return DataDeduplicator(primary_keys=primary_keys)
