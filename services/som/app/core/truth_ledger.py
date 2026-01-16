"""
═══════════════════════════════════════════════════════════════
TRUTH LEDGER - Predator Analytics v29-S
Іммютабельний реєстр всіх дій системи з криптографічними гарантіями
═══════════════════════════════════════════════════════════════
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib
import json
import uuid
import logging

logger = logging.getLogger("som.ledger")


class ActionType(str, Enum):
    """Типи дій для запису в Truth Ledger"""
    # System actions
    SYSTEM_START = "system_start"
    SYSTEM_STOP = "system_stop"
    CONFIG_CHANGE = "config_change"

    # Data actions
    DATA_INGEST = "data_ingest"
    DATA_DELETE = "data_delete"
    DATA_EXPORT = "data_export"

    # AI/ML actions
    MODEL_TRAIN = "model_train"
    MODEL_DEPLOY = "model_deploy"
    PREDICTION_MADE = "prediction_made"

    # Security actions
    AUTH_SUCCESS = "auth_success"
    AUTH_FAILURE = "auth_failure"
    PERMISSION_CHANGE = "permission_change"

    # SOM actions
    PROPOSAL_CREATED = "proposal_created"
    PROPOSAL_APPROVED = "proposal_approved"
    PROPOSAL_REJECTED = "proposal_rejected"
    ANOMALY_DETECTED = "anomaly_detected"
    REMEDIATION_APPLIED = "remediation_applied"

    # Sovereignty actions
    EMERGENCY_ACTIVATED = "emergency_activated"
    EMERGENCY_DEACTIVATED = "emergency_deactivated"
    HUMAN_OVERRIDE = "human_override"

    # Constitutional
    AXIOM_CHECK = "axiom_check"
    AXIOM_VIOLATION = "axiom_violation"


@dataclass
class LedgerEntry:
    """Запис у Truth Ledger"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType = ActionType.SYSTEM_START
    actor: str = "system"
    timestamp: datetime = field(default_factory=datetime.utcnow)
    axioms_applied: List[str] = field(default_factory=list)
    payload: Dict[str, Any] = field(default_factory=dict)
    previous_hash: Optional[str] = None
    entry_hash: Optional[str] = None
    signature: Optional[str] = None  # For future cryptographic signing

    def compute_hash(self) -> str:
        """Обчислення криптографічного хешу запису"""
        content = json.dumps({
            "id": self.id,
            "action_type": self.action_type.value if isinstance(self.action_type, ActionType) else self.action_type,
            "actor": self.actor,
            "timestamp": self.timestamp.isoformat(),
            "axioms_applied": self.axioms_applied,
            "payload": self.payload,
            "previous_hash": self.previous_hash
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Конвертація в словник"""
        return {
            "id": self.id,
            "action_type": self.action_type.value if isinstance(self.action_type, ActionType) else self.action_type,
            "actor": self.actor,
            "timestamp": self.timestamp.isoformat(),
            "axioms_applied": self.axioms_applied,
            "payload": self.payload,
            "previous_hash": self.previous_hash,
            "entry_hash": self.entry_hash
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "LedgerEntry":
        """Створення з словника"""
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            action_type=ActionType(data.get("action_type", "system_start")),
            actor=data.get("actor", "system"),
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data.get("timestamp"), str) else data.get("timestamp", datetime.utcnow()),
            axioms_applied=data.get("axioms_applied", []),
            payload=data.get("payload", {}),
            previous_hash=data.get("previous_hash"),
            entry_hash=data.get("entry_hash")
        )


class TruthLedger:
    """
    Truth Ledger - Іммютабельний реєстр дій

    Характеристики:
    - Іммютабельність: Жоден запис не може бути змінений
    - Криптографічні гарантії: Merkle-подібна структура з хешами
    - Повний аудит: Трасування кожної дії від початку до кінця
    """

    def __init__(self, persist_to_db: bool = True):
        self._entries: List[LedgerEntry] = []
        self._persist_to_db = persist_to_db
        self._genesis_entry: Optional[LedgerEntry] = None
        self._initialize_genesis()

    def _initialize_genesis(self):
        """Створення генезис-запису"""
        genesis = LedgerEntry(
            id="genesis",
            action_type=ActionType.SYSTEM_START,
            actor="system",
            timestamp=datetime.utcnow(),
            axioms_applied=["AXIOM-003"],
            payload={
                "message": "Truth Ledger initialized",
                "version": "29.0.0",
                "constitution_hash": "pending"  # Will be set from axioms
            },
            previous_hash=None
        )
        genesis.entry_hash = genesis.compute_hash()
        self._genesis_entry = genesis
        self._entries.append(genesis)

        logger.info(f"📜 Truth Ledger genesis: {genesis.entry_hash[:16]}...")

    def record(
        self,
        action_type: ActionType,
        actor: str,
        payload: Dict[str, Any],
        axioms_applied: List[str] = None
    ) -> LedgerEntry:
        """
        Запис дії в Truth Ledger

        Args:
            action_type: Тип дії
            actor: Хто виконав дію (user_id, service_name, agent_id)
            payload: Дані про дію
            axioms_applied: Список аксіом, що були застосовані

        Returns:
            LedgerEntry: Створений запис
        """
        # Отримання хешу попереднього запису
        previous_hash = self._entries[-1].entry_hash if self._entries else None

        # Створення нового запису
        entry = LedgerEntry(
            action_type=action_type,
            actor=actor,
            timestamp=datetime.utcnow(),
            axioms_applied=axioms_applied or ["AXIOM-003"],  # Завжди застосовується AXIOM-003
            payload=payload,
            previous_hash=previous_hash
        )

        # Обчислення хешу
        entry.entry_hash = entry.compute_hash()

        # Додавання до ланцюга
        self._entries.append(entry)

        # Persist to database if enabled
        if self._persist_to_db:
            self._persist_entry(entry)

        logger.debug(f"📝 Ledger entry: {action_type.value} by {actor} [{entry.entry_hash[:8]}]")

        return entry

    def _persist_entry(self, entry: LedgerEntry):
        """Збереження запису в БД (placeholder для PostgreSQL)"""
        # TODO: Implement actual database persistence
        # This would use asyncpg to insert into the actions table
        pass

    def verify_chain(self) -> tuple[bool, Optional[str]]:
        """
        Верифікація цілісності всього ланцюга записів

        Returns:
            (is_valid, error_message_if_invalid)
        """
        if not self._entries:
            return False, "Ledger is empty"

        for i, entry in enumerate(self._entries):
            # Перевірка хешу запису
            computed_hash = entry.compute_hash()
            if computed_hash != entry.entry_hash:
                return False, f"Entry {entry.id} hash mismatch at position {i}"

            # Перевірка ланцюга (крім genesis)
            if i > 0:
                if entry.previous_hash != self._entries[i-1].entry_hash:
                    return False, f"Chain broken at entry {entry.id}"

        return True, None

    def get_entry(self, entry_id: str) -> Optional[LedgerEntry]:
        """Отримання запису за ID"""
        for entry in self._entries:
            if entry.id == entry_id:
                return entry
        return None

    def get_entries(
        self,
        action_type: Optional[ActionType] = None,
        actor: Optional[str] = None,
        since: Optional[datetime] = None,
        limit: int = 100
    ) -> List[LedgerEntry]:
        """Отримання записів з фільтрацією"""
        entries = self._entries

        if action_type:
            entries = [e for e in entries if e.action_type == action_type]

        if actor:
            entries = [e for e in entries if e.actor == actor]

        if since:
            entries = [e for e in entries if e.timestamp >= since]

        return entries[-limit:]

    def get_entries_for_audit(
        self,
        entity_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Отримання записів для аудит-інтерфейсу"""
        entries = self._entries

        if entity_id:
            entries = [
                e for e in entries
                if e.payload.get("entity_id") == entity_id
            ]

        return [e.to_dict() for e in entries[-limit:]]

    def generate_proof(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Генерація криптографічного доказу для запису

        Використовується для юридичного підтвердження
        """
        entry = self.get_entry(entry_id)
        if not entry:
            return None

        # Знаходимо індекс запису
        index = next((i for i, e in enumerate(self._entries) if e.id == entry_id), -1)
        if index < 0:
            return None

        # Генеруємо proof path (спрощена версія Merkle proof)
        proof_path = []
        for i in range(max(0, index - 2), min(len(self._entries), index + 3)):
            proof_path.append({
                "position": i,
                "hash": self._entries[i].entry_hash,
                "is_target": i == index
            })

        return {
            "entry_id": entry_id,
            "entry_hash": entry.entry_hash,
            "timestamp": entry.timestamp.isoformat(),
            "proof_path": proof_path,
            "chain_length": len(self._entries),
            "genesis_hash": self._genesis_entry.entry_hash if self._genesis_entry else None,
            "verification_method": "sha256_chain",
            "generated_at": datetime.utcnow().isoformat()
        }

    def get_statistics(self) -> Dict[str, Any]:
        """Статистика Truth Ledger"""
        action_counts = {}
        for entry in self._entries:
            action = entry.action_type.value if isinstance(entry.action_type, ActionType) else entry.action_type
            action_counts[action] = action_counts.get(action, 0) + 1

        unique_actors = set(e.actor for e in self._entries)

        return {
            "total_entries": len(self._entries),
            "genesis_timestamp": self._genesis_entry.timestamp.isoformat() if self._genesis_entry else None,
            "latest_entry_timestamp": self._entries[-1].timestamp.isoformat() if self._entries else None,
            "action_counts": action_counts,
            "unique_actors": len(unique_actors),
            "chain_valid": self.verify_chain()[0]
        }

    @property
    def latest_hash(self) -> Optional[str]:
        """Хеш останнього запису"""
        return self._entries[-1].entry_hash if self._entries else None

    @property
    def length(self) -> int:
        """Кількість записів"""
        return len(self._entries)


# Глобальний інстанс Truth Ledger
truth_ledger = TruthLedger()
