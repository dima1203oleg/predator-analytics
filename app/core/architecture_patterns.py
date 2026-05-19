"""Architecture Patterns v63.0-ELITE — CQRS + Event Sourcing + Saga + Outbox.

Enterprise patterns для distributed systems:
  - CQRS: read/write separation (PostgreSQL write, ClickHouse read)
  - Event Sourcing: audit trail через Kafka events
  - Saga pattern: distributed transactions через choreography
  - Outbox pattern: guaranteed event delivery
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable

settings = get_settings()
logger = logging.getLogger(__name__)


# ── CQRS ─────────────────────────────────────────────────────


@dataclass
class Command:
    """CQRS Command — змінює стан (write)."""

    command_id: str
    command_type: str
    aggregate_id: str
    payload: dict[str, Any]
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@dataclass
class Query:
    """CQRS Query — читає стан (read)."""

    query_id: str
    query_type: str
    filters: dict[str, Any] = field(default_factory=dict)
    projection: str = "default"


class CQRSBus:
    """CQRS шина: розділяє commands (write) та queries (read)."""

    def __init__(self) -> None:
        self._command_handlers: dict[str, Callable[..., Awaitable[Any]]] = {}
        self._query_handlers: dict[str, Callable[..., Awaitable[Any]]] = {}

    def register_command(self, command_type: str, handler: Callable[..., Awaitable[Any]]) -> None:
        self._command_handlers[command_type] = handler

    def register_query(self, query_type: str, handler: Callable[..., Awaitable[Any]]) -> None:
        self._query_handlers[query_type] = handler

    async def execute_command(self, command: Command) -> Any:
        handler = self._command_handlers.get(command.command_type)
        if handler is None:
            raise ValueError(f"No handler for command: {command.command_type}")
        return await handler(command)

    async def execute_query(self, query: Query) -> Any:
        handler = self._query_handlers.get(query.query_type)
        if handler is None:
            raise ValueError(f"No handler for query: {query.query_type}")
        return await handler(query)


# ── Event Sourcing ───────────────────────────────────────────


@dataclass
class DomainEvent:
    """Подія домену — незмінний факт, що стався."""

    event_id: str
    event_type: str
    aggregate_id: str
    aggregate_type: str
    data: dict[str, Any]
    version: int = 1
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class EventStore:
    """Event Store: зберігає всі події як незмінний журнал."""

    def __init__(self, kafka_producer: Any) -> None:
        self._producer = kafka_producer
        self._events: list[DomainEvent] = []

    async def append(self, event: DomainEvent) -> None:
        """Додає подію в event store + публікує в Kafka."""
        self._events.append(event)

        # Публікація в Kafka (event sourcing topic)
        await self._producer.send(
            f"predator.events.{event.aggregate_type.lower()}",
            key=event.aggregate_id.encode(),
            value=json.dumps({
                "event_id": event.event_id,
                "event_type": event.event_type,
                "aggregate_id": event.aggregate_id,
                "data": event.data,
                "version": event.version,
                "timestamp": event.timestamp,
            }).encode(),
        )

    def get_events_for_aggregate(self, aggregate_id: str) -> list[DomainEvent]:
        """Отримує всі події для агрегату."""
        return [e for e in self._events if e.aggregate_id == aggregate_id]

    async def rebuild_state(self, aggregate_id: str, apply_fn: Callable[[Any, DomainEvent], Any]) -> Any:
        """Відновлює стан агрегату з подій."""
        events = self.get_events_for_aggregate(aggregate_id)
        state = None
        for event in sorted(events, key=lambda e: e.version):
            state = apply_fn(state, event)
        return state


# ── Saga Pattern ─────────────────────────────────────────────


@dataclass
class SagaStep:
    """Крок саги — компенсується при помилці."""

    name: str
    action: Callable[..., Awaitable[Any]]
    compensation: Callable[..., Awaitable[Any]]


class SagaOrchestrator:
    """Оркестратор саг для distributed transactions."""

    def __init__(self) -> None:
        self._sagas: dict[str, list[SagaStep]] = {}

    def register_saga(self, saga_name: str, steps: list[SagaStep]) -> None:
        self._sagas[saga_name] = steps

    async def execute(self, saga_name: str, context: dict[str, Any]) -> dict[str, Any]:
        """Виконує сагу з компенсацією при помилці."""
        steps = self._sagas.get(saga_name)
        if steps is None:
            raise ValueError(f"Saga not found: {saga_name}")

        executed: list[tuple[SagaStep, Any]] = []

        try:
            for step in steps:
                result = await step.action(**context)
                executed.append((step, result))
                context[step.name] = result
        except Exception as e:
            logger.error("Saga %s failed at step %s: %s", saga_name, step.name, e)
            # Компенсація в зворотньому порядку
            for step, result in reversed(executed):
                try:
                    await step.compensation(result, **context)
                    logger.info("Compensated step: %s", step.name)
                except Exception as comp_err:
                    logger.critical("Compensation failed for %s: %s", step.name, comp_err)
            raise

        return context


# ── Outbox Pattern ───────────────────────────────────────────


@dataclass
class OutboxMessage:
    """Повідомлення в outbox таблиці."""

    id: str
    aggregate_id: str
    event_type: str
    payload: dict[str, Any]
    status: str = "pending"
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    processed_at: str | None = None
    retry_count: int = 0


class OutboxProcessor:
    """Outbox Processor: гарантована доставка подій."""

    def __init__(self, kafka_producer: Any) -> None:
        self._producer = kafka_producer
        self._outbox: list[OutboxMessage] = []

    async def enqueue(
        self, aggregate_id: str, event_type: str, payload: dict[str, Any]
    ) -> OutboxMessage:
        """Додає повідомлення в outbox (в тій же транзакції що й бізнес-логіка)."""
        import uuid

        msg = OutboxMessage(
            id=str(uuid.uuid4()),
            aggregate_id=aggregate_id,
            event_type=event_type,
            payload=payload,
        )
        self._outbox.append(msg)
        return msg

    async def process_outbox(self, batch_size: int = 100) -> dict[str, int]:
        """Обробляє pending повідомлення з outbox."""
        pending = [m for m in self._outbox if m.status == "pending"][:batch_size]
        processed = 0
        failed = 0

        for msg in pending:
            try:
                await self._producer.send(
                    f"predator.events.{msg.event_type}",
                    key=msg.aggregate_id.encode(),
                    value=json.dumps(msg.payload).encode(),
                )
                msg.status = "processed"
                msg.processed_at = datetime.now(timezone.utc).isoformat()
                processed += 1
            except Exception as e:
                msg.retry_count += 1
                if msg.retry_count >= 5:
                    msg.status = "dead"
                failed += 1
                logger.warning("Outbox delivery failed: %s (retry=%d)", e, msg.retry_count)

        return {"processed": processed, "failed": failed, "pending": len(pending) - processed - failed}


# ── Factory ──────────────────────────────────────────────────

_cqrs_bus: CQRSBus | None = None
_event_store: EventStore | None = None
_saga_orchestrator: SagaOrchestrator | None = None
_outbox_processor: OutboxProcessor | None = None


def get_cqrs_bus() -> CQRSBus:
    global _cqrs_bus
    if _cqrs_bus is None:
        _cqrs_bus = CQRSBus()
    return _cqrs_bus


def get_event_store(producer: Any | None = None) -> EventStore:
    global _event_store
    if _event_store is None:
        if producer is None:
            raise ValueError("Kafka producer required for EventStore init")
        _event_store = EventStore(producer)
    return _event_store


def get_saga_orchestrator() -> SagaOrchestrator:
    global _saga_orchestrator
    if _saga_orchestrator is None:
        _saga_orchestrator = SagaOrchestrator()
    return _saga_orchestrator


def get_outbox_processor(producer: Any | None = None) -> OutboxProcessor:
    global _outbox_processor
    if _outbox_processor is None:
        if producer is None:
            raise ValueError("Kafka producer required for OutboxProcessor init")
        _outbox_processor = OutboxProcessor(producer)
    return _outbox_processor
