"""Real-time UX v63.0-ELITE — WebSockets + SSE + Optimistic UI.

Замінює polling на:
  - WebSocket для live dashboards
  - Server-Sent Events для notifications
  - Optimistic UI: миттєвий feedback + rollback при помилці
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
import json
import logging
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

settings = get_settings()
logger = logging.getLogger(__name__)


# ── WebSocket Manager ────────────────────────────────────────


class WebSocketManager:
    """Менеджер WebSocket з'єднань для real-time оновлень."""

    def __init__(self) -> None:
        self._connections: dict[str, set[Any]] = {}  # channel → set of websockets
        self._lock = asyncio.Lock()

    async def connect(self, websocket: Any, channel: str = "default") -> None:
        """Підключає WebSocket до каналу."""
        async with self._lock:
            if channel not in self._connections:
                self._connections[channel] = set()
            self._connections[channel].add(websocket)
            logger.info("WebSocket connected to channel=%s (total=%d)", channel, len(self._connections[channel]))

    async def disconnect(self, websocket: Any, channel: str = "default") -> None:
        """Відключає WebSocket від каналу."""
        async with self._lock:
            if channel in self._connections:
                self._connections[channel].discard(websocket)
                if not self._connections[channel]:
                    del self._connections[channel]
                logger.info("WebSocket disconnected from channel=%s", channel)

    async def broadcast(self, channel: str, data: dict[str, Any]) -> int:
        """Розсилає повідомлення всім підключеним до каналу."""
        async with self._lock:
            connections = self._connections.get(channel, set())
            dead: list[Any] = []

            message = json.dumps(data, default=str)
            for ws in connections:
                try:
                    await ws.send_text(message)
                except Exception:
                    dead.append(ws)

            for ws in dead:
                connections.discard(ws)

            return len(connections)

    @property
    def stats(self) -> dict[str, Any]:
        """Статистика WebSocket з'єднань."""
        return {
            "total_channels": len(self._connections),
            "total_connections": sum(len(v) for v in self._connections.values()),
            "channels": {
                ch: len(conns) for ch, conns in self._connections.items()
            },
        }


# ── SSE (Server-Sent Events) Manager ─────────────────────────


class SSEManager:
    """Менеджер Server-Sent Events для push-сповіщень."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue]] = {}

    async def subscribe(self, user_id: str) -> asyncio.Queue:
        """Підписує користувача на SSE потік."""
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        if user_id not in self._subscribers:
            self._subscribers[user_id] = set()
        self._subscribers[user_id].add(queue)
        return queue

    async def unsubscribe(self, user_id: str, queue: asyncio.Queue) -> None:
        """Відписує користувача."""
        if user_id in self._subscribers:
            self._subscribers[user_id].discard(queue)
            if not self._subscribers[user_id]:
                del self._subscribers[user_id]

    async def send_event(
        self, user_id: str, event_type: str, data: dict[str, Any]
    ) -> None:
        """Відправляє SSE подію користувачу."""
        queues = self._subscribers.get(user_id, set())
        event = {
            "event": event_type,
            "data": json.dumps(data, default=str),
            "id": datetime.now(UTC).isoformat(),
        }

        for queue in queues:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                logger.debug("SSE queue full for user=%s", user_id)

    async def broadcast_event(
        self, event_type: str, data: dict[str, Any]
    ) -> None:
        """Розсилає SSE подію всім користувачам."""
        for user_id in list(self._subscribers.keys()):
            await self.send_event(user_id, event_type, data)


# ── SSE Endpoint Generator ───────────────────────────────────


async def sse_endpoint(user_id: str, sse_manager: SSEManager) -> AsyncGenerator[str, None]:
    """FastAPI SSE endpoint generator."""
    queue = await sse_manager.subscribe(user_id)

    try:
        # Початкове підключення
        yield f"event: connected\ndata: {json.dumps({'user_id': user_id})}\n\n"

        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30)
                yield f"event: {event['event']}\nid: {event['id']}\ndata: {event['data']}\n\n"
            except TimeoutError:
                # Keep-alive
                yield ": keepalive\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        await sse_manager.unsubscribe(user_id, queue)


# ── Optimistic UI Helpers ────────────────────────────────────


@dataclass
class OptimisticUpdate:
    """Описує оптимістичне оновлення UI."""

    entity_type: str
    entity_id: str
    changes: dict[str, Any]
    previous_state: dict[str, Any] | None = None
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


class OptimisticUIManager:
    """Менеджер оптимістичних оновлень з rollback."""

    def __init__(self, ws_manager: WebSocketManager) -> None:
        self._ws = ws_manager
        self._pending: dict[str, OptimisticUpdate] = {}

    async def apply(
        self,
        user_id: str,
        entity_type: str,
        entity_id: str,
        changes: dict[str, Any],
        previous_state: dict[str, Any],
    ) -> None:
        """Застосовує оптимістичне оновлення."""
        key = f"{user_id}:{entity_type}:{entity_id}"
        update = OptimisticUpdate(
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes,
            previous_state=previous_state,
        )
        self._pending[key] = update

        # Миттєво відправляємо оновлення клієнту
        await self._ws.broadcast(f"user:{user_id}", {
            "type": "optimistic_update",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "changes": changes,
            "timestamp": update.timestamp,
        })

    async def confirm(self, user_id: str, entity_type: str, entity_id: str) -> None:
        """Підтверджує оптимістичне оновлення (сервер OK)."""
        key = f"{user_id}:{entity_type}:{entity_id}"
        self._pending.pop(key, None)

        await self._ws.broadcast(f"user:{user_id}", {
            "type": "update_confirmed",
            "entity_type": entity_type,
            "entity_id": entity_id,
        })

    async def rollback(self, user_id: str, entity_type: str, entity_id: str, error: str) -> None:
        """Відкочує оптимістичне оновлення (сервер помилка)."""
        key = f"{user_id}:{entity_type}:{entity_id}"
        update = self._pending.pop(key, None)

        await self._ws.broadcast(f"user:{user_id}", {
            "type": "update_rollback",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "previous_state": update.previous_state if update else None,
            "error": error,
        })


# ── Factory ──────────────────────────────────────────────────

_ws_manager: WebSocketManager | None = None
_sse_manager: SSEManager | None = None


def get_ws_manager() -> WebSocketManager:
    """Отримати синглтон WebSocketManager."""
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = WebSocketManager()
    return _ws_manager


def get_sse_manager() -> SSEManager:
    """Отримати синглтон SSEManager."""
    global _sse_manager
    if _sse_manager is None:
        _sse_manager = SSEManager()
    return _sse_manager
