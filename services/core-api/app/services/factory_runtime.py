"""Утиліти життєвого циклу безконечного вдосконалення."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Protocol, cast

from predator_common.logging import get_logger

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, Generator

    from fastapi import FastAPI

    from app.models.factory import SystemImprovement

logger = get_logger("core_api.factory_runtime")
_TASK_ATTR = "factory_improvement_task"
_RUNNER_ATTR = "factory_improvement_runner"


class FactoryRepoProtocol(Protocol):
    """Мінімальний контракт репозиторію для OODA-циклу."""

    driver: object

    async def get_improvement(self) -> SystemImprovement:
        """Отримати стан вдосконалення."""
        ...

    async def update_improvement(self, imp: SystemImprovement) -> bool:
        """Оновити стан вдосконалення."""
        ...


class FactoryImprovementTaskProtocol(Protocol):
    """Мінімальний контракт фонового завдання OODA-циклу."""

    def done(self) -> bool:
        """Перевірити, чи завдання завершене."""

    def cancel(self) -> bool:
        """Скасувати завдання."""

    def add_done_callback(self, callback: Callable[[asyncio.Future[object]], object]) -> None:
        """Додати callback завершення."""
        ...

    def __await__(self) -> Generator[object, None, None]:
        """Зробити завдання awaitable."""
        ...


class FactoryImprovementRunnerProtocol(Protocol):
    """Контракт для запуску фонової задачі вдосконалення."""

    def __call__(self, driver: object) -> Awaitable[None]:
        """Стартувати цикл вдосконалення для драйвера."""
        ...


def _get_repo(app: FastAPI) -> FactoryRepoProtocol | None:
    repo = getattr(app.state, "factory_repo", None)
    if repo is None:
        return None
    return cast("FactoryRepoProtocol", repo)


def _get_task(app: FastAPI) -> FactoryImprovementTaskProtocol | None:
    task = getattr(app.state, _TASK_ATTR, None)
    if task is None:
        return None
    return cast("FactoryImprovementTaskProtocol", task)


def _get_runner(app: FastAPI) -> FactoryImprovementRunnerProtocol | None:
    runner = getattr(app.state, _RUNNER_ATTR, None)
    if runner is None:
        return None
    return cast("FactoryImprovementRunnerProtocol", runner)


def _store_task(app: FastAPI, task: FactoryImprovementTaskProtocol) -> None:
    setattr(app.state, _TASK_ATTR, task)

    def _clear(_finished_task: asyncio.Future[object]) -> None:
        current_task = getattr(app.state, _TASK_ATTR, None)
        if current_task is task:
            setattr(app.state, _TASK_ATTR, None)

    task.add_done_callback(_clear)


async def autostart_factory_improvement_if_enabled(app: FastAPI, *, enabled: bool) -> bool:
    """Якщо увімкнено FACTORY_AUTO_START і цикл ще не активний — увімкнути is_running і зберегти стан."""
    if not enabled:
        return False

    repo = _get_repo(app)
    if repo is None:
        return False

    status = await repo.get_improvement()
    if status.is_running:
        return False

    resume_timestamp = datetime.now(UTC)
    status.is_running = True
    status.last_update = resume_timestamp
    status.logs.append(
        f"[{resume_timestamp.strftime('%H:%M:%S')}] 🟢 SYSTEM: "
        "Автозапуск фабрики вдосконалення (FACTORY_AUTO_START=true). "
        "Зупинка: POST /api/v1/factory/infinite/stop"
    )
    await repo.update_improvement(status)
    logger.info("FACTORY_AUTO_START: цикл OODA увімкнено автоматично при старті API.")
    return True


async def ensure_factory_improvement_task(app: FastAPI, *, silent: bool = False) -> bool:
    """Запустити OODA-цикл, якщо стан збережений як активний.

    silent=True — тихе відновлення (сторож), без довгого запису в журнал кожного тіку.
    """
    repo = _get_repo(app)
    if repo is None:
        logger.warning("Репозиторій безконечного вдосконалення ще не ініціалізовано.")
        return False

    task = _get_task(app)
    if task is not None and not task.done():
        return True

    runner = _get_runner(app)
    if runner is None:
        logger.warning("Репозиторій готовий, але runner для OODA-циклу ще не налаштовано.")
        return False

    status = await repo.get_improvement()
    if not status.is_running:
        return False

    resume_timestamp = datetime.now(UTC)
    if not silent:
        status.logs.append(
            f"[{resume_timestamp.strftime('%H:%M:%S')}] 🔄 SYSTEM: "
            "Безконечне вдосконалення автоматично відновлено після рестарту сервера."
        )
    else:
        status.logs.append(
            f"[{resume_timestamp.strftime('%H:%M:%S')}] 🔁 WATCHDOG: "
            "Фонова задача OODA перевірена / відновлена автоматично."
        )
    status.last_update = resume_timestamp
    await repo.update_improvement(status)

    new_task = asyncio.create_task(runner(repo.driver))
    _store_task(app, new_task)
    logger.info("Безконечне вдосконалення відновлено і запущено на бекенді.")
    return True


async def run_factory_watchdog_loop(
    app: FastAPI,
    interval_sec: int,
    stop_event: asyncio.Event,
) -> None:
    """Періодично гарантує наявність активної задачі OODA та синхронізує оркестратор."""
    # Відкладений імпорт — уникнення циклів під час завантаження модуля
    from app.services.antigravity_orchestrator import orchestrator

    interval_sec = max(15, interval_sec)
    logger.info(
        "Запущено сторож фабрики (інтервал %ss): автономне відновлення OODA без участі людини.",
        interval_sec,
    )
    try:
        await ensure_factory_improvement_task(app, silent=True)
        await orchestrator.sync_with_factory(app)
    except Exception:
        logger.exception("Початковий тик сторожа фабрики.")

    while True:
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_sec)
            logger.info("Сторож фабрики зупинено за сигналом завершення.")
            return
        except TimeoutError:
            pass
        try:
            await ensure_factory_improvement_task(app, silent=True)
            await orchestrator.sync_with_factory(app)
        except Exception:
            logger.exception("Тик сторожа фабрики: помилка відновлення або синхронізації.")


async def cancel_factory_improvement_task(app: FastAPI) -> bool:
    """Зупинити активне завдання OODA-циклу."""
    task = _get_task(app)
    if task is None or task.done():
        if getattr(app.state, _TASK_ATTR, None) is task:
            setattr(app.state, _TASK_ATTR, None)
        return False

    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        logger.info("Активне завдання безконечного вдосконалення було скасовано.")
    finally:
        if getattr(app.state, _TASK_ATTR, None) is task:
            setattr(app.state, _TASK_ATTR, None)
    return True
