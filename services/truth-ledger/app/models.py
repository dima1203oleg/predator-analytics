from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import hashlib
import json

Base = declarative_base()

class LedgerEntry(Base):
    __tablename__ = 'truth_ledger'

    id = Column(Integer, primary_key=True, index=True)
    previous_hash = Column(String, nullable=False, index=True)
    data_hash = Column(String, nullable=False)

    # Metadata
    entity_type = Column(String, nullable=False) # e.g., 'etl_job', 'model_update'
    entity_id = Column(String, nullable=False)
    action = Column(String, nullable=False) # e.g., 'approve', 'deny'

    # The actual payload (state change)
    payload = Column(JSON, nullable=False)

    # Constitutional Context
    constitution_version = Column(String, nullable=False, default='v26')
    arbiter_signature = Column(String, nullable=True) # Ed25519 signature

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def calculate_hash(self):
        """Calculates the hash of the entry including previous hash to form the chain."""
        # Ensure UTC and consistent format for hashing
        ts_str = "None"
        if self.created_at:
            if self.created_at.tzinfo is None:
                ts_str = self.created_at.isoformat() + "+00:00"
            else:
                # Map +00:00 to Z or just keep it consistent.
                # PostgreSQL usually returns +00:00 for UTC.
                ts_str = self.created_at.isoformat().replace(" ", "T")
                if not ("+" in ts_str or "Z" in ts_str):
                    ts_str += "+00:00"

        content = {
            "previous_hash": self.previous_hash,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "payload": self.payload,
            "created_at": ts_str
        }
        return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()

class AuditLog(Base):
    __tablename__ = 'audit_chain'

    id = Column(Integer, primary_key=True)
    ledger_entry_id = Column(Integer, ForeignKey('truth_ledger.id'))
    auditor_id = Column(String, nullable=False)
    verification_status = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), server_default=func.now())
