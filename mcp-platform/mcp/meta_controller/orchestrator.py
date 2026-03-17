"""Оркестратор: слухає події, зчитує стан, викликає CLI (async)."""
from __future__ import annotations

import asyncio
import subprocess
from typing import List

from mcp.meta_controller.bus import EventBus
from mcp.meta_controller.state import StateStore
from mcp.meta_controller.decisions import decide


class Orchestrator:
    def __init__(self) -> None:
        self.bus = EventBus()
        self.store = StateStore()

    async def start(self) -> None:
        await self.bus.connect()
        await self.store.connect()
        await self.bus.subscribe("mcp.events", self._on_event)

    async def _on_event(self, payload: dict) -> None:
        event_type = payload.get("type", "unknown")
        print(f"[ORCH] Подія: {event_type}")
        context = await self.store.fetch_context(event_type)
        print(f"[ORCH] Контекст: {context}")
        decision = decide(event_type)
        print(f"[ORCH] Рішення: {decision}")
        await self.execute(decision)

    async def execute(self, action: str) -> None:
        cmd: List[str] = ["echo", f"[ORCH] Виконання дії: {action}"]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        out, err = await proc.communicate()
        if out:
            print(out.decode())
        if err:
            print(f"[ORCH] Помилка: {err.decode()}")

    async def run(self) -> None:
        await self.start()
        print("[ORCH] Оркестратор запущено, слухає NATS...")
        # keep alive
        while True:
            await asyncio.sleep(60)
