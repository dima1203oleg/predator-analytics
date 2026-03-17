"""Мета-контролер: точка входу для автономного оркестрування."""
from __future__ import annotations

import asyncio
import json
import os
from typing import Callable

from mcp.meta_controller.orchestrator import Orchestrator


class MetaController:
    def __init__(self) -> None:
        self.orchestrator = Orchestrator()

    async def start(self) -> None:
        await self.orchestrator.run()


async def main() -> None:
    ctrl = MetaController()
    await ctrl.start()


if __name__ == "__main__":
    asyncio.run(main())
