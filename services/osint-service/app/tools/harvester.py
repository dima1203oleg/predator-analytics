"""theHarvester Tool Adapter — збір email, доменів та IP."""
import re
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class TheHarvesterTool(BaseTool):
    """Адаптер для theHarvester.

    theHarvester — інструмент для збору:
    - Email адрес
    - Субдоменів
    - IP адрес
    - Імен хостів

    GitHub: https://github.com/laramies/theHarvester
    """

    name = "theharvester"
    description = "theHarvester — збір email, доменів та IP"
    version = "4.0"
    categories = ["domain", "email", "infrastructure"]
    supported_targets = ["domain"]

    # Доступні джерела
    SOURCES = [
        "anubis", "baidu", "bing", "bingapi", "bufferoverun",
        "certspotter", "crtsh", "dnsdumpster", "duckduckgo",
        "fullhunt", "github-code", "hackertarget", "hunter",
        "intelx", "otx", "rapiddns", "securityTrails", "sublist3r",
        "threatcrowd", "threatminer", "urlscan", "virustotal", "yahoo"
    ]

    async def is_available(self) -> bool:
        """Перевірка чи theHarvester встановлено."""
        return await self._check_command_exists("theHarvester")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск theHarvester для збору інформації про домен.

        Args:
            target: Домен для сканування
            options: Додаткові опції:
                - sources: список джерел (default: all free)
                - limit: ліміт результатів (default: 500)

        Returns:
            ToolResult з email, субдоменами та IP
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["theHarvester не встановлено. Встановіть: pip install theHarvester"],
            )

        # Джерела (безкоштовні)
        sources = options.get("sources", ["bing", "duckduckgo", "crtsh", "dnsdumpster", "hackertarget"])
        source_str = ",".join(sources)

        limit = options.get("limit", 500)

        # Формуємо команду
        cmd = [
            "theHarvester",
            "-d", target,
            "-b", source_str,
            "-l", str(limit),
        ]

        # Запускаємо
        stdout, stderr, return_code = await self._run_subprocess(cmd)

        duration = (datetime.utcnow() - start_time).total_seconds()

        # Парсимо результати
        emails = set()
        hosts = set()
        ips = set()
        findings = []

        # Парсинг email
        email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
        for match in re.finditer(email_pattern, stdout):
            email = match.group().lower()
            if target.lower() in email:
                emails.add(email)

        # Парсинг хостів
        host_pattern = rf'[\w\.-]+\.{re.escape(target)}'
        for match in re.finditer(host_pattern, stdout, re.IGNORECASE):
            hosts.add(match.group().lower())

        # Парсинг IP
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        for match in re.finditer(ip_pattern, stdout):
            ips.add(match.group())

        # Формуємо findings
        for email in emails:
            findings.append({
                "type": "email",
                "value": email,
                "confidence": 0.8,
                "source": "theharvester",
            })

        for host in hosts:
            findings.append({
                "type": "subdomain",
                "value": host,
                "confidence": 0.85,
                "source": "theharvester",
            })

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if (emails or hosts) else ToolStatus.PARTIAL,
            data={
                "domain": target,
                "emails": list(emails),
                "hosts": list(hosts),
                "ips": list(ips),
                "sources_used": sources,
            },
            findings=findings,
            duration_seconds=duration,
        )
