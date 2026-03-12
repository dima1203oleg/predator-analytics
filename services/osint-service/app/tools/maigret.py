"""Maigret Tool Adapter — пошук username у 2500+ сайтах."""
import json
import os
import tempfile
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class MaigretTool(BaseTool):
    """Адаптер для Maigret.

    Maigret — розширена версія Sherlock для пошуку акаунтів
    за username у 2500+ сайтах з детальним аналізом.

    GitHub: https://github.com/soxoj/maigret
    """

    name = "maigret"
    description = "Maigret — пошук username у 2500+ сайтах"
    version = "0.4"
    categories = ["person", "social", "username"]
    supported_targets = ["username"]

    async def is_available(self) -> bool:
        """Перевірка чи maigret встановлено."""
        return await self._check_command_exists("maigret")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск Maigret для пошуку username.

        Args:
            target: Username для пошуку
            options: Додаткові опції:
                - timeout: таймаут на сайт (default: 10)
                - top_sites: кількість топ сайтів (default: 500)
                - parse_info: парсити додаткову інфо (default: True)

        Returns:
            ToolResult зі знайденими профілями
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["Maigret не встановлено. Встановіть: pip install maigret"],
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            output_file = os.path.join(tmpdir, "report.json")

            # Формуємо команду
            cmd = [
                "maigret",
                target,
                "--json", "simple",
                "-o", output_file,
                "--timeout", str(options.get("timeout", 10)),
                "--top-sites", str(options.get("top_sites", 500)),
            ]

            if options.get("parse_info", True):
                cmd.append("--parse")

            # Запускаємо
            stdout, stderr, return_code = await self._run_subprocess(cmd)

            duration = (datetime.utcnow() - start_time).total_seconds()

            # Читаємо результати
            profiles = []
            findings = []
            parsed_info = {}

            try:
                if os.path.exists(output_file):
                    with open(output_file) as f:
                        results = json.load(f)

                    # Maigret повертає структуру з accounts
                    accounts = results if isinstance(results, list) else results.get("accounts", [])

                    for account in accounts:
                        if account.get("status", {}).get("status") == "Claimed":
                            profile = {
                                "site": account.get("sitename", ""),
                                "url": account.get("url", ""),
                                "status": "found",
                                "tags": account.get("tags", []),
                            }

                            # Додаткова інформація
                            if account.get("parsed"):
                                profile["parsed_info"] = account["parsed"]
                                parsed_info[profile["site"]] = account["parsed"]

                            profiles.append(profile)

                            findings.append({
                                "type": "social_profile",
                                "value": account.get("url", ""),
                                "confidence": 0.85,
                                "source": "maigret",
                                "metadata": {
                                    "site": account.get("sitename"),
                                    "username": target,
                                    "tags": account.get("tags", []),
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
                "parsed_info": parsed_info,
            },
            findings=findings,
            duration_seconds=duration,
        )
