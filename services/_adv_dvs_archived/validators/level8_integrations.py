import os
"""
Рівень 8: Перевірка інтеграцій.
Telegram, реєстри, митні джерела, зовнішні та внутрішні API.
"""
from pathlib import Path
from typing import Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class IntegrationsValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level8_integrations",
            description="Інтеграції: Telegram, реєстри, зовнішні/внутрішні API",
        )

    async def _run_validation(self):
        # 1. Telegram Bot сервіс
        await self._check_telegram_bot()
        # 2. OSINT сервіс
        await self._check_osint_service()
        # 3. Graph Service
        await self._check_graph_service()
        # 4. LiteLLM проксі
        await self._check_litellm()
        # 5. Внутрішні API
        await self._check_internal_apis()
        # 6. Конфігурації інтеграцій
        await self._check_integration_configs()

    async def _check_telegram_bot(self):
        """Перевірка Telegram Bot."""
        project_root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))
        bot_dir = project_root / "services" / "telegram-bot"
        if bot_dir.exists():
            dockerfile = bot_dir / "Dockerfile"
            self.add_check(CheckResult(
                name="telegram_bot_code",
                passed=dockerfile.exists(),
                message=f"Telegram Bot: Dockerfile {'знайдено' if dockerfile.exists() else 'відсутній'}",
                severity="warning",
                details={"path": str(bot_dir)},
            ))
        else:
            self.add_check(CheckResult(
                name="telegram_bot_code",
                passed=False,
                message="Telegram Bot сервіс не знайдено",
                severity="warning",
            ))

    async def _check_osint_service(self):
        """OSINT Service."""
        await self.http_check(
            "osint_service",
            f"http://{TARGET_HOST}:9201/health",
            severity="warning",
        )
        # Перевірка коду
        project_root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))
        osint_dir = project_root / "services" / "osint-service"
        if osint_dir.exists():
            py_files = list(osint_dir.rglob("*.py"))
            self.add_check(CheckResult(
                name="osint_service_code",
                passed=len(py_files) > 0,
                message=f"OSINT Service: {len(py_files)} Python файлів",
                severity="info",
            ))

    async def _check_graph_service(self):
        """Graph Service (Neo4j алгоритми)."""
        await self.http_check(
            "graph_service",
            f"http://{TARGET_HOST}:8001/health",
            severity="warning",
        )

    async def _check_litellm(self):
        """LiteLLM proxy."""
        await self.http_check(
            "litellm_proxy",
            f"{config.LITELLM_URL}/health",
            severity="warning",
        )

    async def _check_internal_apis(self):
        """Внутрішні API-сервіси."""
        services = {
            "core_api": (config.CORE_API_URL, "/api/v1/health"),
            "adv_dvs": (f"http://{TARGET_HOST}:8003", "/health"),
        }
        for name, (base, path) in services.items():
            await self.http_check(f"internal_{name}", f"{base}{path}", severity="warning")

    async def _check_integration_configs(self):
        """Перевірка конфігурацій інтеграцій."""
        project_root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))
        env_file = project_root / ".env"
        if env_file.exists():
            content = env_file.read_text()
            # Перевірка ключових змінних (без розкриття секретів)
            keys = ["TELEGRAM", "OLLAMA", "NEO4J", "POSTGRES", "REDIS", "CLICKHOUSE"]
            found_keys = [k for k in keys if k in content.upper()]
            self.add_check(CheckResult(
                name="env_config",
                passed=len(found_keys) > 0,
                message=f".env: знайдено {len(found_keys)} конфігурацій інтеграцій",
                severity="info",
                details={"found_prefixes": found_keys},
            ))
        else:
            self.add_check(CheckResult(
                name="env_config",
                passed=False,
                message=".env файл відсутній",
                severity="warning",
            ))
