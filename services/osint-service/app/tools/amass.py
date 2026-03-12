"""Amass Tool Adapter — пошук субдоменів та DNS розвідка."""
import json
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class AmassTool(BaseTool):
    """Адаптер для OWASP Amass.

    Amass — потужний інструмент для:
    - Пошуку субдоменів
    - DNS enumeration
    - Аналізу інфраструктури

    GitHub: https://github.com/owasp-amass/amass
    """

    name = "amass"
    description = "OWASP Amass — пошук субдоменів та DNS розвідка"
    version = "4.0"
    categories = ["domain", "dns", "infrastructure"]
    supported_targets = ["domain"]

    async def is_available(self) -> bool:
        """Перевірка чи amass встановлено."""
        return await self._check_command_exists("amass")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск Amass для сканування домену.

        Args:
            target: Домен для сканування
            options: Додаткові опції:
                - mode: "passive" | "active" (default: passive)
                - timeout: таймаут в хвилинах
                - max_dns_queries: максимум DNS запитів

        Returns:
            ToolResult з субдоменами та DNS записами
        """
        start_time = datetime.utcnow()
        options = options or {}

        # Перевіряємо доступність
        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["Amass не встановлено. Встановіть: go install github.com/owasp-amass/amass/v4/...@master"],
            )

        # Формуємо команду
        mode = options.get("mode", "passive")
        cmd = ["amass", "enum", "-d", target, "-json", "-"]

        if mode == "passive":
            cmd.append("-passive")

        timeout_min = options.get("timeout", 5)
        cmd.extend(["-timeout", str(timeout_min)])

        # Запускаємо
        stdout, stderr, return_code = await self._run_subprocess(cmd)

        duration = (datetime.utcnow() - start_time).total_seconds()

        if return_code != 0 and not stdout:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[stderr or f"Amass завершився з кодом {return_code}"],
                duration_seconds=duration,
            )

        # Парсимо результати (JSON Lines формат)
        subdomains = []
        dns_records = []
        ip_addresses = set()
        findings = []

        for line in stdout.strip().split("\n"):
            if not line:
                continue

            try:
                record = json.loads(line)

                subdomain = record.get("name", "")
                if subdomain and subdomain not in [s["subdomain"] for s in subdomains]:
                    subdomains.append({
                        "subdomain": subdomain,
                        "sources": record.get("sources", []),
                    })

                # DNS записи
                addresses = record.get("addresses", [])
                for addr in addresses:
                    ip = addr.get("ip", "")
                    if ip:
                        ip_addresses.add(ip)
                        dns_records.append({
                            "name": subdomain,
                            "type": "A" if "." in ip and ":" not in ip else "AAAA",
                            "value": ip,
                        })

                # Findings
                findings.append({
                    "type": "subdomain",
                    "value": subdomain,
                    "confidence": 0.9,
                    "source": "amass",
                    "metadata": record,
                })

            except json.JSONDecodeError:
                continue

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if subdomains else ToolStatus.PARTIAL,
            data={
                "domain": target,
                "subdomains": subdomains,
                "dns_records": dns_records,
                "ip_addresses": list(ip_addresses),
                "total_subdomains": len(subdomains),
            },
            findings=findings,
            duration_seconds=duration,
        )
