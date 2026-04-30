from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING
from unittest.mock import AsyncMock

from fastapi import FastAPI
import pytest

from app.models.factory import ImprovementPhase, SystemImprovement
from app.services.factory_runtime import (
    cancel_factory_improvement_task,
    ensure_factory_improvement_task,
)

if TYPE_CHECKING:
    from collections.abc import Callable, Generator


class DummyTask:
    """Простий тестовий об'єкт для імітації фонового завдання."""

    def __init__(self) -> None:
        self.cancelled = False
        self.callbacks: list[Callable[[object], object]] = []

    def done(self) -> bool:
        return self.cancelled

    def cancel(self) -> bool:
        self.cancelled = True
        return True

    def add_done_callback(self, callback: Callable[[object], object]) -> None:
        self.callbacks.append(callback)

    def __await__(self) -> Generator[object, None, None]:
        if self.cancelled:
            raise asyncio.CancelledError
        if False:
            yield None
        return None


@pytest.mark.asyncio
async def test_ensure_factory_improvement_task_restores_running_cycle(monkeypatch: pytest.MonkeyPatch) -> None:
    app = FastAPI()
    repo = AsyncMock()
    app.state.factory_repo = repo

    status = SystemImprovement(
        is_running=True,
        current_phase=ImprovementPhase.ORIENT,
        cycles_completed=4,
        improvements_made=2,
        logs=['[18:00:00] 🔄 SYSTEM: Попередній стан циклу збережено.'],
        last_update=datetime(2026, 3, 24, 18, 0, tzinfo=UTC),
    )
    repo.get_improvement = AsyncMock(return_value=status)
    repo.update_improvement = AsyncMock(return_value=True)

    async def fake_run_ooda_task(driver: object) -> None:
        _ = driver
        return None

    app.state.factory_improvement_runner = fake_run_ooda_task

    dummy_task = DummyTask()

    def fake_create_task(coro: object) -> DummyTask:
        close_method = getattr(coro, 'close', None)
        if callable(close_method):
            close_method()
        return dummy_task

    monkeypatch.setattr(asyncio, 'create_task', fake_create_task)

    result = await ensure_factory_improvement_task(app)

    assert result is True
    assert app.state.factory_improvement_task is dummy_task
    repo.update_improvement.assert_awaited_once()
    assert 'автоматично відновлено після рестарту сервера' in status.logs[-1]


@pytest.mark.asyncio
async def test_cancel_factory_improvement_task_clears_state() -> None:
    app = FastAPI()
    dummy_task = DummyTask()
    app.state.factory_improvement_task = dummy_task

    result = await cancel_factory_improvement_task(app)

    assert result is True
    assert dummy_task.cancelled is True
    assert getattr(app.state, 'factory_improvement_task', None) is None
