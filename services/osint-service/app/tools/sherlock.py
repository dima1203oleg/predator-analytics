"""Sherlock Tool Adapter — пошук username у соцмережах."""
import json
import os
import tempfile
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class SherlockTool(BaseTool):
    """Адаптер для Sherlock.

    Sherlock — інструмент для пошуку акаунтів за username
    у 300+ соціальних мережах та сервісах.

    GitHub: https://github.com/sherlock-project/sherlock
    """

    name = "sherlock"
    description = "Sherlock — пошук username у 300+ соцмережах"
    version = "0.14"
    categories = ["person", "social", "username"]
    supported_targets = ["username"]

    async def is_available(self) -> bool:
        """Перевірка чи sherlock встановлено."""
        return await self._check_command_exists("sherlock")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск Sherlock для пошуку username.

        Args:
            target: Username для пошуку
            options: Додаткові опції:
                - timeout: таймаут на сайт (default: 10)
                - print_all: показувати всі сайти (default: False)

        Returns:
            ToolResult зі знайденими профілями
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["Sherlock не встановлено. Встановіть: pip install sherlock-project"],
            )

        # Створюємо тимчасову директорію для результатів
        with tempfile.TemporaryDirectory() as tmpdir:
            output_file = os.path.join(tmpdir, f"{target}.json")

            # Формуємо команду
            cmd = [
                "sherlock",
                target,
                "--json", output_file,
                "--timeout", str(options.get("timeout", 10)),
            ]

            if options.get("print_all"):
                cmd.append("--print-all")

            # Запускаємо
            stdout, stderr, return_code = await self._run_subprocess(cmd)

            duration = (datetime.utcnow() - start_time).total_seconds()

            # Читаємо результати
            profiles = []
            findings = []

            try:
                if os.path.exists(output_file):
                    with open(output_file) as f:
                        results = json.load(f)

                    for site, data in results.items():
                        if data.get("status") == "Claimed":
                            profile = {
                                "site": site,
                                "url": data.get("url_user", ""),
                                "status": "found",
                            }
                            profiles.append(profile)

                            findings.append({
                                "type": "social_profile",
                                "value": data.get("url_user", ""),
                                "confidence": 0.85,
                                "source": "sherlock",
                                "metadata": {
                                    "site": site,
                                    "username": target,
                                },
                            })

            except (json.JSONDecodeError, FileNotFoundError) as e:
                self.logger.warning(f"Не вдалося прочитати результати: {e}")

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if profiles else ToolStatus.PARTIAL,
            data={
                "username": target,
                "profiles": profiles,
                "total_found": len(profiles),
            },
            findings=findings,
            duration_seconds=duration,
        )
