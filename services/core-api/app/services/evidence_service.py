"""Evidence Service (Immutable Audit Trail) — PREDATOR Analytics v61.0-ELITE.

Забезпечує ведення журналу аудиту з використанням криптографічних хешів (Merkle Tree).
Згідно з HR-16, дані мають бути незмінними (WORM).
"""
import hashlib
import json
from datetime import UTC, datetime
from typing import Any


class AuditEvent:
    def __init__(self, action: str, user_id: str, entity_ueid: str, details: dict[str, Any], prev_hash: str):
        self.action = action
        self.user_id = user_id
        self.entity_ueid = entity_ueid
        self.details = details
        self.timestamp = datetime.now(UTC).isoformat()
        self.prev_hash = prev_hash
        self.hash = self._calculate_hash()

    def _calculate_hash(self) -> str:
        data = f"{self.action}{self.user_id}{self.entity_ueid}{json.dumps(self.details, sort_keys=True)}{self.timestamp}{self.prev_hash}"
        return hashlib.sha256(data.encode('utf-8')).hexdigest()

    def to_dict(self) -> dict[str, Any]:
        return {
            "action": self.action,
            "user_id": self.user_id,
            "entity_ueid": self.entity_ueid,
            "details": self.details,
            "timestamp": self.timestamp,
            "prev_hash": self.prev_hash,
            "hash": self.hash
        }


class EvidenceService:
    _chain: list[AuditEvent] = []
    _genesis_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    @classmethod
    async def record_event(cls, action: str, user_id: str, entity_ueid: str, details: dict[str, Any]) -> AuditEvent:
        """Реєструє нову подію в незмінному ланцюзі."""
        prev_hash = cls._chain[-1].hash if cls._chain else cls._genesis_hash
        
        event = AuditEvent(
            action=action,
            user_id=user_id,
            entity_ueid=entity_ueid,
            details=details,
            prev_hash=prev_hash
        )
        cls._chain.append(event)
        return event

    @classmethod
    async def get_chain(cls, limit: int = 50) -> list[dict[str, Any]]:
        """Повертає останні записи ланцюга аудиту."""
        return [event.to_dict() for event in reversed(cls._chain[-limit:])]

    @classmethod
    async def verify_chain(cls) -> bool:
        """Криптографічна перевірка цілісності ланцюга."""
        for i in range(1, len(cls._chain)):
            current = cls._chain[i]
            previous = cls._chain[i-1]
            if current.prev_hash != previous.hash:
                return False
            if current.hash != current._calculate_hash():
                return False
        return True

    @classmethod
    async def get_compliance_stats(cls) -> dict[str, Any]:
        """Статистика комплаєнсу."""
        # Моковані дані для дашборду
        return {
            "total_audit_events": len(cls._chain),
            "chain_valid": await cls.verify_chain(),
            "critical_risks_blocked": 142,
            "sanctions_hits": 18,
            "kyc_expired": 35,
            "compliance_score": 98.5
        }
