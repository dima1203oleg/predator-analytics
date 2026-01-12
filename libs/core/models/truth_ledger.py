
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, JSON, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from libs.core.database import Base

class ConsensusMode(str, enum.Enum):
    BASIC = "basic"
    AUDIT = "audit"
    COURT = "court"

class TruthLedger(Base):
    __tablename__ = "truth_ledger"
    __table_args__ = {"schema": "truth", "comment": "Constitutional Truth Ledger"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, index=True, nullable=False)

    # State transition
    previous_state = Column(String, nullable=False)
    new_state = Column(String, nullable=False, index=True)

    # Evidence
    real_metrics = Column(JSON, nullable=False, default={})
    arbiter_decision = Column(String, nullable=False) # APPROVE/DENY
    arbiter_reason = Column(String, nullable=True)

    # Cryptographic Chain
    previous_hash = Column(String(64), nullable=True, index=True)
    current_hash = Column(String(64), nullable=False, unique=True, index=True)

    # Context
    consensus_tier = Column(Enum(ConsensusMode), default=ConsensusMode.BASIC, nullable=False)
    witness_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String, nullable=False)

    # Signatures (simplified linkage)
    signatures = relationship("LedgerSignature", back_populates="ledger_entry")

class LedgerSignature(Base):
    __tablename__ = "ledger_signatures"
    __table_args__ = {"schema": "truth"}

    ledger_id = Column(Integer, ForeignKey("truth.truth_ledger.id"), primary_key=True)
    witness_id = Column(String, primary_key=True)
    signature = Column(String, nullable=False) # Base64 encoded signature
    signed_at = Column(DateTime, default=datetime.utcnow)

    ledger_entry = relationship("TruthLedger", back_populates="signatures")
