"""Subfinder Tool Adapter — швидкий пошук субдоменів."""
import json
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class SubfinderTool(BaseTool):
    """Адаптер для Subfinder.

    Subfinder — швидкий інструмент для пошуку субдоменів
    з використанням пасивних джерел.

    GitHub: https://github.com/projectdiscovery/subfinder
    """

    name = "subfinder"
    description = "Subfinder — швидкий пошук субдоменів"
    version = "2.6"
    categories = ["domain", "dns"]
    supported_targets = ["domain"]

    async def is_available(self) -> bool:
        """Перевірка чи subfinder встановлено."""
        return await self._check_command_exists("subfinder")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск Subfinder для пошуку субдоменів.

        Args:
            target: Домен для сканування
            options: Додаткові опції:
                - silent: тихий режим (default: True)
                - timeout: таймаут (default: 30)
                - all: використовувати всі джерела (default: False)

        Returns:
            ToolResult зі списком субдоменів
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["Subfinder не встановлено. Встановіть: go install github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest"],
            )

        # Формуємо команду
        cmd = ["subfinder", "-d", target, "-json", "-silent"]

        if options.get("all"):
            cmd.append("-all")

        timeout = options.get("timeout", 30)
        cmd.extend(["-timeout", str(timeout)])

        # Запускаємо
        stdout, stderr, return_code = await self._run_subprocess(cmd)

        duration = (datetime.utcnow() - start_time).total_seconds()

        # Парсимо результати (JSON Lines)
        subdomains = []
        sources = set()
        findings = []

        for line in stdout.strip().split("\n"):
            if not line:
                continue

            try:
                record = json.loads(line)
                subdomain = record.get("host", "")
                source = record.get("source", "unknown")

                if subdomain:
                    subdomains.append({
                        "subdomain": subdomain,
                        "source": source,
                    })
                    sources.add(source)

                    findings.append({
                        "type": "subdomain",
                        "value": subdomain,
                        "confidence": 0.9,
                        "source": f"subfinder:{source}",
                    })

            except json.JSONDecodeError:
                # Можливо plain text формат
                if "." in line and target in line:
                    subdomains.append({
                        "subdomain": line.strip(),
                        "source": "unknown",
                    })

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if subdomains else ToolStatus.PARTIAL,
            data={
                "domain": target,
                "subdomains": subdomains,
                "total_found": len(subdomains),
                "sources_used": list(sources),
            },
            findings=findings,
            duration_seconds=duration,
        )
