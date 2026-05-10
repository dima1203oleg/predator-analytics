"""Тести планувальника OSS APScheduler."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import app.services.antigravity_orchestrator as antigravity_module


@pytest.mark.asyncio
async def test_create_scheduler_registers_pulse_job() -> None:
    """Створення планувальника додає інтервальне завдання pulse."""
    app = MagicMock()
    app.state.factory_repo = None

    from app.services.oss_automation_scheduler import create_oss_automation_scheduler

    scheduler = create_oss_automation_scheduler(app, interval_minutes=10)
    jobs = scheduler.get_jobs()
    assert len(jobs) == 1
    assert jobs[0].id == "oss_automation_pulse"


@pytest.mark.asyncio
async def test_pulse_calls_sync_when_factory_repo_present() -> None:
    """При наявності factory_repo викликається sync_with_factory."""
    app = MagicMock()
    app.state.factory_repo = object()

    mock_orch = MagicMock()
    mock_orch.sync_with_factory = AsyncMock()

    with patch.object(antigravity_module, "orchestrator", mock_orch):
        from app.services.oss_automation_scheduler import create_oss_automation_scheduler

        scheduler = create_oss_automation_scheduler(app, interval_minutes=10)
        job = scheduler.get_job("oss_automation_pulse")
        assert job is not None
        await job.func()
        mock_orch.sync_with_factory.assert_awaited_once_with(app)
