"""Оркестратор: слухає події, зчитує стан, викликає CLI (async)."""
from __future__ import annotations

import asyncio
import subprocess
import uuid
from typing import Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
from typing import List

from mcp.meta_controller.bus import EventBus
from mcp.meta_controller.state import StateStore
from mcp.meta_controller.decisions import decide


class WorkflowStatus(Enum):
    """Статус workflow'у."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class WorkflowTask:
    """Завдання в workflow'е."""

    id: str
    name: str
    module: str
    params: dict[str, Any]
    status: WorkflowStatus = WorkflowStatus.PENDING
    result: Any = None
    error: str | None = None


class Orchestrator:
    """Оркестратор: управління workflow'ами та обробка подій."""

    def __init__(self) -> None:
        """Ініціалізувати Orchestrator."""
        self.bus = EventBus()
        self.store = StateStore()
        self.workflows: dict[str, list[WorkflowTask]] = {}
        self.completed_tasks: list[WorkflowTask] = []
        self.failed_tasks: list[WorkflowTask] = []

    async def start(self) -> None:
        """Запустити Orchestrator."""
        await self.bus.connect()
        await self.store.connect()
        await self.bus.subscribe("mcp.events", self._on_event)

    async def _on_event(self, payload: dict) -> None:
        """Обробити подію від шини.

        Args:
            payload: Дані вже від шини
        """
        event_type = payload.get("type", "unknown")
        print(f"[ORCH] Подія: {event_type}")
        context = await self.store.fetch_context(event_type)
        print(f"[ORCH] Контекст: {context}")
        decision = decide(event_type)
        print(f"[ORCH] Рішення: {decision}")
        await self.execute(decision)

    async def execute(self, decision: dict) -> None:
        """Виконати рішення.

        Args:
            decision: Рішення від Decision Engine
        """
        action = decision.get("action", "echo")
        cmd: List[str] = ["echo", f"[ORCH] Виконання дії: {action}"]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, err = await proc.communicate()
        if out:
            print(out.decode())
        if err:
            print(f"[ORCH] Помилка: {err.decode()}")
        
        # Зберегти результат
        await self.store.save_result({"status": "ok", "output": out.decode() if out else ""})

    async def execute_workflow(
        self, workflow_name: str, tasks: list[WorkflowTask]
    ) -> dict[str, Any]:
        """Виконати workflow.

        Args:
            workflow_name: Назва workflow'у
            tasks: Список завдань

        Returns:
            Результати workflow'у
        """
        workflow_id = f"wf_{workflow_name}_{uuid.uuid4().hex[:8]}"
        self.workflows[workflow_id] = tasks

        for task in tasks:
            task.status = WorkflowStatus.RUNNING
            try:
                task.result = await self._execute_task(task)
                task.status = WorkflowStatus.SUCCESS
                self.completed_tasks.append(task)
            except Exception as e:
                task.status = WorkflowStatus.FAILED
                task.error = str(e)
                self.failed_tasks.append(task)

        return {
            "workflow_id": workflow_id,
            "status": "completed",
            "completed": len(self.completed_tasks),
            "failed": len(self.failed_tasks),
        }

    async def _execute_task(self, task: WorkflowTask) -> Any:
        """Виконати завдання.

        Args:
            task: Завдання для виконання

        Returns:
            Результат завдання
        """
        await asyncio.sleep(0.05)  # Імітація роботи
        return {"module": task.module, "result": "completed"}

    def get_statistics(self) -> dict[str, Any]:
        """Отримати статистику.

        Returns:
            Статистика Orchestrator'а
        """
        return {
            "total_workflows": len(self.workflows),
            "completed_tasks": len(self.completed_tasks),
            "failed_tasks": len(self.failed_tasks),
            "success_rate": (
                len(self.completed_tasks) /
                (len(self.completed_tasks) + len(self.failed_tasks) or 1)
            ) * 100,
        }

    async def run(self) -> None:
        """Запустити та утримувати Orchestrator у живому стані."""
        await self.start()
        print("[ORCH] Оркестратор запущено, слухає NATS...")
        # keep alive
        while True:
            await asyncio.sleep(60)
