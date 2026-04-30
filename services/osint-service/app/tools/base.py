"""Базовий клас для OSINT Tool Adapters."""
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any

logger = logging.getLogger(__name__)


class ToolStatus(StrEnum):
    """Статус виконання інструменту."""

    SUCCESS = "success"
    PARTIAL = "partial"
    FAILED = "failed"
    TIMEOUT = "timeout"
    NOT_INSTALLED = "not_installed"


@dataclass
class ToolResult:
    """Результат виконання OSINT інструменту."""

    tool_name: str
    status: ToolStatus
    data: dict[str, Any] = field(default_factory=dict)
    findings: list[dict[str, Any]] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    duration_seconds: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict[str, Any]:
        """Конвертація в словник."""
        return {
            "tool_name": self.tool_name,
            "status": self.status.value,
            "data": self.data,
            "findings": self.findings,
            "errors": self.errors,
            "duration_seconds": self.duration_seconds,
            "timestamp": self.timestamp.isoformat(),
        }


class BaseTool(ABC):
    """Базовий клас для OSINT інструментів.

    Всі адаптери повинні наслідувати цей клас та реалізувати
    абстрактні методи.
    """

    name: str = "base_tool"
    description: str = "Base OSINT tool"
    version: str = "1.0.0"
    categories: list[str] = []
    supported_targets: list[str] = []  # domain, email, username, ip, phone, company

    def __init__(self, timeout: int = 300):
        """Ініціалізація інструменту.

        Args:
            timeout: Таймаут виконання в секундах
        """
        self.timeout = timeout
        self.logger = logging.getLogger(f"osint.tools.{self.name}")

    @abstractmethod
    async def is_available(self) -> bool:
        """Перевірка доступності інструменту.

        Returns:
            True якщо інструмент встановлено та доступно
        """
        pass

    @abstractmethod
    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск інструменту.

        Args:
            target: Ціль для сканування (домен, email, username тощо)
            options: Додаткові опції

        Returns:
            ToolResult з результатами
        """
        pass

    async def run_with_timeout(
        self,
        target: str,
        options: dict[str, Any] | None = None,
    ) -> ToolResult:
        """Запуск інструменту з таймаутом.

        Args:
            target: Ціль для сканування
            options: Додаткові опції

        Returns:
            ToolResult з результатами або помилкою таймауту
        """
        start_time = datetime.utcnow()

        try:
            result = await asyncio.wait_for(
                self.run(target, options),
                timeout=self.timeout,
            )
            return result

        except TimeoutError:
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.logger.warning(f"Tool {self.name} timed out after {duration}s for target: {target}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=[f"Timeout after {self.timeout} seconds"],
                duration_seconds=duration,
            )

        except Exception as e:
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.logger.error(f"Tool {self.name} failed: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[str(e)],
                duration_seconds=duration,
            )

    async def _run_subprocess(
        self,
        cmd: list[str],
        cwd: str | None = None,
    ) -> tuple[str, str, int]:
        """Запуск subprocess асинхронно.

        Args:
            cmd: Команда та аргументи
            cwd: Робоча директорія

        Returns:
            Tuple (stdout, stderr, return_code)
        """
        self.logger.debug(f"Running command: {' '.join(cmd)}")

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,
        )

        stdout, stderr = await process.communicate()

        return (
            stdout.decode("utf-8", errors="replace"),
            stderr.decode("utf-8", errors="replace"),
            process.returncode or 0,
        )

    async def _check_command_exists(self, command: str) -> bool:
        """Перевірка чи команда існує в системі.

        Args:
            command: Назва команди

        Returns:
            True якщо команда доступна
        """
        try:
            process = await asyncio.create_subprocess_exec(
                "which",
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await process.communicate()
            return process.returncode == 0
        except Exception:
            return False

    def _parse_json_output(self, output: str) -> dict[str, Any] | list[Any] | None:
        """Парсинг JSON виводу.

        Args:
            output: Рядок з JSON

        Returns:
            Розпарсений JSON або None
        """
        import json

        try:
            return json.loads(output)
        except json.JSONDecodeError:
            return None

    def get_info(self) -> dict[str, Any]:
        """Отримання інформації про інструмент.

        Returns:
            Словник з метаданими інструменту
        """
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "categories": self.categories,
            "supported_targets": self.supported_targets,
            "timeout": self.timeout,
        }
