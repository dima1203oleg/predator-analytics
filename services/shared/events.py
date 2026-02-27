
"""
Module: events
Component: shared
Predator Analytics v45.1
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
import uuid
import hashlib
import json

@dataclass
class PredatorEvent:
    """
    Base Event Schema for Predator System (Part 2.3 of Spec).
    Enforces idempotency keys and correlation IDs.
    """
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str = ""                # e.g., "ModelPerformanceDegraded"
    correlation_id: str = ""            # Chain UUID
    causation_id: Optional[str] = None  # Parent event_id
    timestamp: datetime = field(default_factory=datetime.utcnow)
    source: str = ""                    # Component name
    version: str = "1.0"               # Schema version
    context: Dict = field(default_factory=dict)
    idempotency_key: str = ""           # Computed hash
    tenant_id: str = "default"          # Multi-tenant support

    def __post_init__(self):
        # Allow passing string timestamps (from JSON deserialization)
        if isinstance(self.timestamp, str):
            try:
                self.timestamp = datetime.fromisoformat(self.timestamp.replace('Z', '+00:00'))
            except ValueError:
                pass # Keep as string if parsing fails, though type hint says datetime

        if not self.correlation_id:
            self.correlation_id = self.event_id
        
        if not self.idempotency_key:
            self.idempotency_key = self._compute_idempotency_key()

    def _compute_idempotency_key(self) -> str:
        """
        Computes deterministic hash based on event type, source and context.
        Used to prevent duplicate processing.
        """
        # Sort keys to ensure consistent JSON representation
        context_str = json.dumps(self.context, sort_keys=True, default=str)
        payload = f"{self.event_type}:{self.source}:{context_str}"
        return hashlib.sha256(payload.encode()).hexdigest()[:32]

    def to_dict(self) -> dict:
        """Serialize event to dictionary for transit."""
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "correlation_id": self.correlation_id,
            "causation_id": self.causation_id,
            "timestamp": self.timestamp.isoformat() + "Z",
            "source": self.source,
            "version": self.version,
            "context": self.context,
            "idempotency_key": self.idempotency_key,
            "tenant_id": self.tenant_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'PredatorEvent':
        """Deserialize from dictionary."""
        # Filter out unknown fields to be safe
        known_fields = cls.__dataclass_fields__.keys()
        filtered_data = {k: v for k, v in data.items() if k in known_fields}
        return cls(**filtered_data)
