from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import TYPE_CHECKING

import redis.asyncio as redis

if TYPE_CHECKING:
    from fastapi import WebSocket


logger = logging.getLogger("predator.websocket")


class ConnectionManager:
    def __init__(self):
        # active_connections: { "tenant_id": [websocket1, websocket2] }
        self.active_connections: dict[str, set[WebSocket]] = {}
        # broadcast_connections: sockets for global updates
        self.broadcast_connections: set[WebSocket] = set()
        self.redis_host = os.getenv("REDIS_HOST", "redis")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))
        self.pubsub_task = None

    async def start_listener(self):
        """Start listening to Redis Pub/Sub for cross-process updates."""
        try:
            r = redis.Redis(host=self.redis_host, port=self.redis_port, decode_responses=True)
            pubsub = r.pubsub()
            await pubsub.subscribe("predator:system:updates")
            logger.info("Subscribed to predator:system:updates Redis channel")

            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        tenant_id = data.get("tenant_id")
                        await self.broadcast(data, tenant_id=tenant_id)
                    except Exception as e:
                        logger.exception(f"Error processing Pub/Sub message: {e}")
        except Exception as e:
            logger.exception(f"Redis Pub/Sub listener failed: {e}")
            await asyncio.sleep(5)
            asyncio.create_task(self.start_listener())  # Retry

    async def connect(self, websocket: WebSocket, tenant_id: str | None = None):
        await websocket.accept()
        if tenant_id:
            if tenant_id not in self.active_connections:
                self.active_connections[tenant_id] = set()
            self.active_connections[tenant_id].add(websocket)
            logger.info(f"WebSocket connected for tenant {tenant_id}")
        else:
            self.broadcast_connections.add(websocket)
            logger.info("WebSocket connected for broadcast")

    def disconnect(self, websocket: WebSocket, tenant_id: str | None = None):
        if tenant_id and tenant_id in self.active_connections:
            self.active_connections[tenant_id].discard(websocket)
            if not self.active_connections[tenant_id]:
                del self.active_connections[tenant_id]
        else:
            self.broadcast_connections.discard(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict, tenant_id: str | None = None):
        """Broadcast message to all connected clients or specific tenant."""
        payload = json.dumps(message)

        if tenant_id and tenant_id in self.active_connections:
            targets = self.active_connections[tenant_id]
            if targets:
                await asyncio.gather(
                    *[ws.send_text(payload) for ws in targets], return_exceptions=True
                )
        elif self.broadcast_connections:
            await asyncio.gather(
                *[ws.send_text(payload) for ws in self.broadcast_connections],
                return_exceptions=True,
            )


manager = ConnectionManager()


def get_websocket_manager():
    return manager
