"""🔄 EVENT SOURCING ENGINE - Time Travel & State Reconstruction.
==============================================================
Core component for AZR v40 Sovereign Architecture.

This module provides:
- Full event sourcing with CQRS pattern
- State reconstruction from any point in time
- Event replay capability
- Snapshot optimization for performance
- Event versioning and schema evolution

Constitutional Enforcement:
- Axiom 14: Law of Temporal Irreversibility (Events are immutable)
- Axiom 4: Transparency (All state changes are events)

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections import defaultdict
import contextlib
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from enum import Enum
import json
from pathlib import Path
import threading
import time
from typing import TYPE_CHECKING, Any, TypeVar

from app.libs.core.merkle_ledger import get_truth_ledger, sha3_256


if TYPE_CHECKING:
    from collections.abc import Callable


# ============================================================================
# 📦 EVENT TYPES
# ============================================================================


class EventCategory(Enum):
    """Categories of system events."""

    AZR = "azr"  # AZR Engine events
    ETL = "etl"  # ETL Pipeline events
    SECURITY = "security"  # Security events
    CONSTITUTIONAL = "constitutional"  # Constitutional violations
    SYSTEM = "system"  # System-level events
    USER = "user"  # User actions


@dataclass
class Event:
    """Base event class for event sourcing."""

    event_id: str
    event_type: str
    category: EventCategory
    aggregate_id: str
    aggregate_type: str
    payload: dict[str, Any]
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    version: int = 1
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d["category"] = self.category.value
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Event:
        data["category"] = EventCategory(data["category"])
        return cls(**data)

    @property
    def hash(self) -> str:
        """Deterministic hash of event."""
        canonical = json.dumps(
            {
                "event_id": self.event_id,
                "event_type": self.event_type,
                "aggregate_id": self.aggregate_id,
                "payload": self.payload,
                "timestamp": self.timestamp,
            },
            sort_keys=True,
        )
        return sha3_256(canonical)


# ============================================================================
# 📸 SNAPSHOTS
# ============================================================================


@dataclass
class Snapshot:
    """State snapshot for efficient reconstruction."""

    aggregate_id: str
    aggregate_type: str
    state: dict[str, Any]
    version: int
    event_sequence: int
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Snapshot:
        return cls(**data)


# ============================================================================
# 🏗️ AGGREGATE BASE
# ============================================================================

T = TypeVar("T", bound="Aggregate")


class Aggregate(ABC):
    """Base class for event-sourced aggregates."""

    def __init__(self, aggregate_id: str):
        self.aggregate_id = aggregate_id
        self.version = 0
        self._pending_events: list[Event] = []

    @property
    @abstractmethod
    def aggregate_type(self) -> str:
        """Return the type name of this aggregate."""

    @abstractmethod
    def apply(self, event: Event) -> None:
        """Apply event to update aggregate state."""

    @abstractmethod
    def get_state(self) -> dict[str, Any]:
        """Get current state as dictionary."""

    @abstractmethod
    def restore_state(self, state: dict[str, Any]) -> None:
        """Restore state from dictionary."""

    def record_event(
        self, event_type: str, payload: dict[str, Any], category: EventCategory = EventCategory.SYSTEM
    ) -> Event:
        """Record a new event (does not persist until saved)."""
        event = Event(
            event_id=f"EVT-{sha3_256(f'{self.aggregate_id}:{time.time_ns()}')[:16]}",
            event_type=event_type,
            category=category,
            aggregate_id=self.aggregate_id,
            aggregate_type=self.aggregate_type,
            payload=payload,
            version=self.version + len(self._pending_events) + 1,
        )
        self._pending_events.append(event)
        self.apply(event)
        return event

    def get_pending_events(self) -> list[Event]:
        """Get events that have not been persisted."""
        return list(self._pending_events)

    def clear_pending_events(self) -> None:
        """Clear pending events after persistence."""
        self._pending_events.clear()

    def load_from_events(self, events: list[Event]) -> None:
        """Reconstruct state from event history."""
        for event in sorted(events, key=lambda e: e.version):
            self.apply(event)
            self.version = event.version

    def load_from_snapshot(self, snapshot: Snapshot, events: list[Event]) -> None:
        """Load from snapshot + subsequent events."""
        self.restore_state(snapshot.state)
        self.version = snapshot.version

        # Apply events after snapshot
        for event in sorted(events, key=lambda e: e.version):
            if event.version > snapshot.version:
                self.apply(event)
                self.version = event.version


# ============================================================================
# 💾 EVENT STORE
# ============================================================================


class EventStore:
    """🏛️ Подієвий Сховок (Event Store).

    Зберігає всі події системи у append-only форматі.
    Підтримує:
    - Запис подій
    - Отримання подій за агрегатом
    - Снепшоти для оптимізації
    - Time-travel запити
    """

    def __init__(self, storage_path: str | Path = "/tmp/azr_logs"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        self.events_file = self.storage_path / "event_store.jsonl"
        self.snapshots_file = self.storage_path / "snapshots.jsonl"
        self.index_file = self.storage_path / "event_index.json"

        self._lock = threading.Lock()

        # In-memory indexes
        self._events_by_aggregate: dict[str, list[Event]] = defaultdict(list)
        self._events_by_type: dict[str, list[Event]] = defaultdict(list)
        self._all_events: list[Event] = []
        self._snapshots: dict[str, Snapshot] = {}
        self._sequence = 0

        # Event handlers for projection updates
        self._event_handlers: dict[str, list[Callable[[Event], None]]] = defaultdict(list)

        self._load()

    def _load(self) -> None:
        """Load events and snapshots from disk."""
        # Load events
        if self.events_file.exists():
            with open(self.events_file, encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        try:
                            event = Event.from_dict(json.loads(line))
                            self._all_events.append(event)
                            self._events_by_aggregate[event.aggregate_id].append(event)
                            self._events_by_type[event.event_type].append(event)
                            self._sequence = max(self._sequence, event.version)
                        except Exception:
                            pass

        # Load snapshots
        if self.snapshots_file.exists():
            with open(self.snapshots_file, encoding="utf-8") as f:
                for line in f:
                    if line.strip():
                        try:
                            snapshot = Snapshot.from_dict(json.loads(line))
                            # Keep only latest snapshot per aggregate
                            existing = self._snapshots.get(snapshot.aggregate_id)
                            if not existing or snapshot.version > existing.version:
                                self._snapshots[snapshot.aggregate_id] = snapshot
                        except Exception:
                            pass

    def append(self, events: list[Event]) -> None:
        """Append events to the store."""
        with self._lock, open(self.events_file, "a", encoding="utf-8") as f:
            for event in events:
                # Update sequence
                self._sequence += 1

                # Store
                f.write(json.dumps(event.to_dict()) + "\n")

                # Update indexes
                self._all_events.append(event)
                self._events_by_aggregate[event.aggregate_id].append(event)
                self._events_by_type[event.event_type].append(event)

                # Call handlers
                for handler in self._event_handlers.get(event.event_type, []):
                    with contextlib.suppress(Exception):
                        handler(event)

                # Also record to Truth Ledger for cryptographic proof
                try:
                    ledger = get_truth_ledger(self.storage_path)
                    ledger.append(
                        event_type=f"EVENT_{event.category.value.upper()}",
                        payload={
                            "event_id": event.event_id,
                            "event_type": event.event_type,
                            "aggregate_id": event.aggregate_id,
                            "event_hash": event.hash,
                        },
                    )
                except Exception:
                    pass

    def get_events(self, aggregate_id: str, after_version: int = 0) -> list[Event]:
        """Get events for an aggregate after a given version."""
        events = self._events_by_aggregate.get(aggregate_id, [])
        return [e for e in events if e.version > after_version]

    def get_events_by_type(self, event_type: str, limit: int = 100) -> list[Event]:
        """Get events by type."""
        return self._events_by_type.get(event_type, [])[-limit:]

    def get_events_in_range(self, start_time: str, end_time: str) -> list[Event]:
        """Get events within a time range (ISO format timestamps)."""
        return [e for e in self._all_events if start_time <= e.timestamp <= end_time]

    def save_snapshot(self, aggregate: Aggregate) -> Snapshot:
        """Save a snapshot of aggregate state."""
        snapshot = Snapshot(
            aggregate_id=aggregate.aggregate_id,
            aggregate_type=aggregate.aggregate_type,
            state=aggregate.get_state(),
            version=aggregate.version,
            event_sequence=self._sequence,
        )

        with self._lock:
            self._snapshots[aggregate.aggregate_id] = snapshot
            with open(self.snapshots_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(snapshot.to_dict()) + "\n")

        return snapshot

    def get_snapshot(self, aggregate_id: str) -> Snapshot | None:
        """Get latest snapshot for aggregate."""
        return self._snapshots.get(aggregate_id)

    def register_handler(self, event_type: str, handler: Callable[[Event], None]) -> None:
        """Register event handler for projections."""
        self._event_handlers[event_type].append(handler)

    def replay(self, aggregate: Aggregate) -> None:
        """Replay events to reconstruct aggregate state."""
        snapshot = self.get_snapshot(aggregate.aggregate_id)
        events = self.get_events(aggregate.aggregate_id)

        if snapshot:
            aggregate.load_from_snapshot(snapshot, events)
        else:
            aggregate.load_from_events(events)

    def get_stats(self) -> dict[str, Any]:
        """Get event store statistics."""
        event_counts = {}
        for event in self._all_events:
            event_counts[event.event_type] = event_counts.get(event.event_type, 0) + 1

        return {
            "total_events": len(self._all_events),
            "total_aggregates": len(self._events_by_aggregate),
            "total_snapshots": len(self._snapshots),
            "current_sequence": self._sequence,
            "event_type_counts": event_counts,
            "storage_path": str(self.storage_path),
        }


# ============================================================================
# 🎯 AZR STATE AGGREGATE
# ============================================================================


class AZRStateAggregate(Aggregate):
    """Event-sourced aggregate for AZR Engine state.

    All state changes are recorded as events:
    - AZR_STARTED
    - AZR_STOPPED
    - AZR_CYCLE_COMPLETED
    - AZR_ACTION_EXECUTED
    - AZR_ACTION_BLOCKED
    - AZR_HEALTH_CHANGED
    """

    def __init__(self, aggregate_id: str = "azr-main"):
        super().__init__(aggregate_id)

        # State
        self.is_running = False
        self.cycle_count = 0
        self.health_score = 100.0
        self.total_actions_executed = 0
        self.total_actions_blocked = 0
        self.total_rollbacks = 0
        self.last_cycle_timestamp: str | None = None

    @property
    def aggregate_type(self) -> str:
        return "AZRState"

    def apply(self, event: Event) -> None:
        """Apply event to update state."""
        if event.event_type == "AZR_STARTED":
            self.is_running = True

        elif event.event_type == "AZR_STOPPED":
            self.is_running = False

        elif event.event_type == "AZR_CYCLE_COMPLETED":
            self.cycle_count = event.payload.get("cycle", self.cycle_count + 1)
            self.health_score = event.payload.get("health_score", self.health_score)
            self.last_cycle_timestamp = event.timestamp

        elif event.event_type == "AZR_ACTION_EXECUTED":
            self.total_actions_executed += 1

        elif event.event_type == "AZR_ACTION_BLOCKED":
            self.total_actions_blocked += 1

        elif event.event_type == "AZR_ROLLBACK":
            self.total_rollbacks += 1

        elif event.event_type == "AZR_HEALTH_CHANGED":
            self.health_score = event.payload.get("health_score", self.health_score)

    def get_state(self) -> dict[str, Any]:
        return {
            "is_running": self.is_running,
            "cycle_count": self.cycle_count,
            "health_score": self.health_score,
            "total_actions_executed": self.total_actions_executed,
            "total_actions_blocked": self.total_actions_blocked,
            "total_rollbacks": self.total_rollbacks,
            "last_cycle_timestamp": self.last_cycle_timestamp,
        }

    def restore_state(self, state: dict[str, Any]) -> None:
        self.is_running = state.get("is_running", False)
        self.cycle_count = state.get("cycle_count", 0)
        self.health_score = state.get("health_score", 100.0)
        self.total_actions_executed = state.get("total_actions_executed", 0)
        self.total_actions_blocked = state.get("total_actions_blocked", 0)
        self.total_rollbacks = state.get("total_rollbacks", 0)
        self.last_cycle_timestamp = state.get("last_cycle_timestamp")

    # ========================================================================
    # 📝 DOMAIN METHODS (Record events)
    # ========================================================================

    def start(self) -> Event:
        return self.record_event("AZR_STARTED", {}, EventCategory.AZR)

    def stop(self) -> Event:
        return self.record_event("AZR_STOPPED", {}, EventCategory.AZR)

    def complete_cycle(self, cycle: int, health_score: float, duration_ms: int) -> Event:
        return self.record_event(
            "AZR_CYCLE_COMPLETED",
            {"cycle": cycle, "health_score": health_score, "duration_ms": duration_ms},
            EventCategory.AZR,
        )

    def record_action_executed(self, action_id: str, action_type: str) -> Event:
        return self.record_event(
            "AZR_ACTION_EXECUTED", {"action_id": action_id, "action_type": action_type}, EventCategory.AZR
        )

    def record_action_blocked(self, action_id: str, reason: str) -> Event:
        return self.record_event(
            "AZR_ACTION_BLOCKED", {"action_id": action_id, "reason": reason}, EventCategory.CONSTITUTIONAL
        )

    def record_rollback(self, action_id: str, reason: str) -> Event:
        return self.record_event("AZR_ROLLBACK", {"action_id": action_id, "reason": reason}, EventCategory.AZR)


# ============================================================================
# 🔗 GLOBAL SINGLETON
# ============================================================================

_event_store_instance: EventStore | None = None
_event_store_lock = threading.Lock()


def get_event_store(storage_path: str | Path = "/tmp/azr_logs") -> EventStore:
    """Get or create the global Event Store instance."""
    global _event_store_instance

    with _event_store_lock:
        if _event_store_instance is None:
            _event_store_instance = EventStore(storage_path)
        return _event_store_instance


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

if __name__ == "__main__":
    print("🔄 EVENT SOURCING ENGINE - Self-Test")
    print("=" * 60)

    # Create event store
    store = EventStore("/tmp/azr_test_events")

    # Create AZR aggregate
    azr_state = AZRStateAggregate("azr-test")

    # Record events
    azr_state.start()
    for i in range(3):
        azr_state.complete_cycle(i + 1, 95.0 - i, 1500 + i * 100)
    azr_state.record_action_executed("ACT-001", "HEALTH_CHECK")
    azr_state.record_action_blocked("ACT-002", "Constitutional violation")
    azr_state.stop()

    # Persist events
    store.append(azr_state.get_pending_events())
    azr_state.clear_pending_events()

    # Save snapshot
    snapshot = store.save_snapshot(azr_state)
    print(f"✅ Snapshot saved at version {snapshot.version}")

    # Reconstruct state in new aggregate
    new_azr = AZRStateAggregate("azr-test")
    store.replay(new_azr)

    print(f"📊 Reconstructed state: {json.dumps(new_azr.get_state(), indent=2)}")

    # Print stats
    stats = store.get_stats()
    print(f"\n📊 Event Store Stats: {json.dumps(stats, indent=2)}")
