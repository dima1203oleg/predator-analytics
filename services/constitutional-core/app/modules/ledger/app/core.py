from sqlalchemy.orm import Session
from .models import LedgerEntry, AuditLog
import json
import logging

logger = logging.getLogger("truth-ledger")

class LedgerManager:
    def __init__(self, db: Session):
        self.db = db

    def get_last_entry(self) -> LedgerEntry:
        return self.db.query(LedgerEntry).order_by(LedgerEntry.id.desc()).first()

    def create_entry(self, entity_type: str, entity_id: str, action: str, payload: dict, arbiter_signature: str = None) -> LedgerEntry:
        last_entry = self.get_last_entry()
        previous_hash = last_entry.data_hash if last_entry else "0" * 64

        from datetime import datetime, timezone
        new_entry = LedgerEntry(
            previous_hash=previous_hash,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            payload=payload,
            arbiter_signature=arbiter_signature,
            created_at=datetime.now(timezone.utc)
        )
        # Calculate hash *after* populating fields but *before* commit?
        # Actually needs commit to get ID if ID is part of hash, but ID shouldn't be part of stable hash usually if we want reproducibility before DB.
        # But here relying on previous_hash enforces order.

        # We calculate hash immediately
        new_entry.data_hash = new_entry.calculate_hash()

        self.db.add(new_entry)
        self.db.commit()
        self.db.refresh(new_entry)

        logger.info(f"Ledger Entry Created: {new_entry.id} [Hash: {new_entry.data_hash[:8]}...]")
        return new_entry

    def verify_integrity(self) -> bool:
        """
        Re-calculates the entire chain headers to ensure no data corruption.
        This is an expensive operation for O(N).
        """
        entries = self.db.query(LedgerEntry).order_by(LedgerEntry.id.asc()).yield_per(100)
        previous_hash = "0" * 64

        for entry in entries:
            if entry.previous_hash != previous_hash:
                logger.error(f"Broken Chain at ID {entry.id}! Expected prev: {previous_hash[:8]}, Got: {entry.previous_hash[:8]}")
                return False

            calculated_hash = entry.calculate_hash()
            if calculated_hash != entry.data_hash:
                 logger.error(f"Data Corruption at ID {entry.id}! Content invalid.")
                 return False

            previous_hash = calculated_hash

        return True

    def get_entry(self, entry_id: int) -> LedgerEntry:
        return self.db.query(LedgerEntry).filter(LedgerEntry.id == entry_id).first()
