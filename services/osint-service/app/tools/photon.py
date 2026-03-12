"""Photon Tool Adapter — веб-краулер для OSINT."""
import json
import os
import tempfile
from datetime import datetime
from typing import Any

from .base import BaseTool, ToolResult, ToolStatus


class PhotonTool(BaseTool):
    """Адаптер для Photon.

    Photon — швидкий веб-краулер для витягування:
    - URL та ендпоінтів
    - Email адрес
    - Соціальних профілів
    - Файлів (JS, CSS, PDF)
    - Секретів (API keys, tokens)

    GitHub: https://github.com/s0md3v/Photon
    """

    name = "photon"
    description = "Photon — веб-краулер для OSINT"
    version = "1.3"
    categories = ["domain", "web", "crawler"]
    supported_targets = ["domain", "url"]

    async def is_available(self) -> bool:
        """Перевірка чи photon встановлено."""
        return await self._check_command_exists("photon")

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Запуск Photon для краулінгу сайту.

        Args:
            target: URL або домен для краулінгу
            options: Додаткові опції:
                - depth: глибина краулінгу (default: 2)
                - threads: кількість потоків (default: 5)
                - timeout: таймаут запитів (default: 10)

        Returns:
            ToolResult з витягнутими даними
        """
        start_time = datetime.utcnow()
        options = options or {}

        if not await self.is_available():
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.NOT_INSTALLED,
                errors=["Photon не встановлено. Встановіть: pip install photon"],
            )

        # Додаємо протокол якщо немає
        url = target if target.startswith(("http://", "https://")) else f"https://{target}"

        with tempfile.TemporaryDirectory() as tmpdir:
            # Формуємо команду
            cmd = [
                "photon",
                "-u", url,
                "-o", tmpdir,
                "-l", str(options.get("depth", 2)),
                "-t", str(options.get("threads", 5)),
                "--timeout", str(options.get("timeout", 10)),
                "--json",
            ]

            # Запускаємо
            stdout, stderr, return_code = await self._run_subprocess(cmd)

            duration = (datetime.utcnow() - start_time).total_seconds()

            # Читаємо результати
            urls = []
            emails = set()
            files = []
            secrets = []
            social_profiles = []
            findings = []

            # Photon зберігає результати в різних файлах
            result_files = {
                "internal.txt": "internal_urls",
                "external.txt": "external_urls",
                "emails.txt": "emails",
                "files.txt": "files",
                "secrets.txt": "secrets",
            }

            for filename, category in result_files.items():
                filepath = os.path.join(tmpdir, target.replace(".", "_"), filename)
                if os.path.exists(filepath):
                    with open(filepath) as f:
                        lines = [line.strip() for line in f if line.strip()]

                    if category == "emails":
                        emails.update(lines)
                    elif category == "files":
                        files.extend(lines)
                    elif category == "secrets":
                        secrets.extend(lines)
                    elif category in ("internal_urls", "external_urls"):
                        urls.extend(lines)

            # Формуємо findings
            for email in emails:
                findings.append({
                    "type": "email",
                    "value": email,
                    "confidence": 0.85,
                    "source": "photon",
                })

            for secret in secrets:
                findings.append({
                    "type": "secret",
                    "value": secret[:50] + "..." if len(secret) > 50 else secret,
                    "confidence": 0.7,
                    "source": "photon",
                })

            # Визначаємо соціальні профілі з URL
            social_domains = [
                "facebook.com", "twitter.com", "linkedin.com", "instagram.com",
                "github.com", "youtube.com", "t.me", "telegram.me"
            ]
            for url_item in urls:
                for social in social_domains:
                    if social in url_item:
                        social_profiles.append(url_item)
                        findings.append({
                            "type": "social_profile",
                            "value": url_item,
                            "confidence": 0.8,
                            "source": "photon",
                        })
                        break

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if (urls or emails) else ToolStatus.PARTIAL,
            data={
                "target": target,
                "urls_found": len(urls),
                "emails": list(emails),
                "files": files[:100],  # Обмежуємо
                "secrets": secrets,
                "social_profiles": social_profiles,
            },
            findings=findings,
            duration_seconds=duration,
        )
