"""NATS-адаптер: реальний клієнт (заглушка, готовий до real connect)."""
from __future__ import annotations

import asyncio
import json
import os
from typing import Callable

try:
    import nats
    from nats.js.api import ConsumerConfig, StreamConfig
except ImportError:
    nats = None

class EventBus:
    def __init__(self) -> None:
        self.url = os.environ.get("NATS_URL", "nats://localhost:4222")
        self.nc = None
        self.js = None

    async def connect(self) -> None:
        if nats is None:
            print("[BUS] NATS не встановлено; працюємо в заглушці")
            return
        self.nc = await nats.connect(self.url)
        self.js = self.nc.jetstream()
        await self.js.add_stream(name="mcp", subjects=["mcp.events.>"])

    async def publish(self, subject: str, payload: dict) -> None:
        msg = json.dumps(payload, ensure_ascii=False)
        if self.nc:
            await self.nc.publish(subject, msg.encode())
        else:
            print(f"[BUS] Публікація в {subject}: {msg}")

    async def subscribe(self, subject: str, handler: Callable[[dict], None]) -> None:
        async def _msg_cb(msg):
            try:
                data = json.loads(msg.data.decode())
                await asyncio.get_event_loop().run_in_executor(None, handler, data)
            except Exception as e:
                print(f"[BUS] Помилка обробки {subject}: {e}")

        if self.nc:
            await self.nc.subscribe(subject, cb=_msg_cb)
        else:
            print(f"[BUS] Підписка на {subject} (заглушка)")
            await asyncio.get_event_loop().run_in_executor(None, handler, {})
