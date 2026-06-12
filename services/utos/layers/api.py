"""
Шар тестування Backend API (API Layer) UTOS v61.0-ELITE.
Тестує REST API FastAPI, авторизацію, валідацію схем та швидкість відповідей.
"""
import time
import logging
from typing import Dict, Any

import httpx
from utos.config import CORE_API_URL
from utos.layers import BaseLayer, CheckResult

logger = logging.getLogger(__name__)


class ApiLayer(BaseLayer):
    """Шар валідації Backend API сервісів."""

    def __init__(self):
        super().__init__(
            name="api",
            description="Тестування REST API ендпоінтів, авторизації та валідації схем",
            weight=0.10,
        )

    async def _run_validation(self) -> None:
        # 1. Базовий тест ендпоінту OpenAPI документації
        await self._validate_openapi_spec()

        # 2. Перевірка роботи системи авторизації (анонімний запит до закритих роутів)
        await self._validate_auth_protection()

    async def _validate_openapi_spec(self) -> None:
        """Перевірка чи OpenAPI схема доступна та валідна."""
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{CORE_API_URL.rstrip('/')}/api/openapi.json")
                latency = (time.time() - start) * 1000
                if resp.status_code == 200:
                    spec = resp.json()
                    has_info = "info" in spec and "title" in spec["info"]
                    self.add_check(CheckResult(
                        name="openapi_json_schema",
                        passed=has_info,
                        message=f"OpenAPI схема завантажена успішно ({latency:.0f}мс)",
                        latency_ms=latency,
                    ))
                else:
                    raise ValueError(f"HTTP {resp.status_code}")
        except Exception as e:
            self.add_check(CheckResult(
                name="openapi_json_schema",
                passed=False,
                message=f"Не вдалося зчитати OpenAPI схему: {e}",
                severity="critical"
            ))

    async def _validate_auth_protection(self) -> None:
        """Перевірка що захищені роути повертають 401 Unauthorized."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{CORE_API_URL.rstrip('/')}/api/v1/auth/me")
                passed = resp.status_code in (401, 403)
                self.add_check(CheckResult(
                    name="api_authorization_guard",
                    passed=passed,
                    message=f"Ендпоінт /auth/me успішно захищений (HTTP {resp.status_code})",
                    details={"status_code": resp.status_code}
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="api_authorization_guard",
                passed=False,
                message=f"Помилка захисту API: {e}",
                severity="critical"
            ))
