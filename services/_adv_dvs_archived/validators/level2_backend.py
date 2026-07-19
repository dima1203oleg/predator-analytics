import os
"""
Рівень 2: Перевірка Backend.
FastAPI, REST API, JWT, WebSocket, HTTP-відповіді, швидкодія.
"""
import time
from typing import Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class BackendValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level2_backend",
            description="Backend: FastAPI, REST API, JWT, WebSocket, маршрути",
        )

    async def _run_validation(self):
        base = config.CORE_API_URL

        # 1. Health endpoint
        await self.http_check("api_health", f"{base}/api/v1/health", severity="critical")

        # 2. OpenAPI schema
        r, data = await self.http_json_check("openapi_schema", f"{base}/openapi.json", severity="warning")
        if data:
            paths = list(data.get("paths", {}).keys())
            self.add_check(CheckResult(
                name="api_routes_count",
                passed=len(paths) > 0,
                message=f"Знайдено {len(paths)} маршрутів API",
                severity="warning",
                details={"routes_sample": paths[:15]},
            ))

        # 3. Перевірка маршрутів (GET endpoints)
        test_endpoints = [
            ("/api/v1/health", 200, "health"),
            ("/docs", 200, "swagger_docs"),
            ("/redoc", 200, "redoc"),
        ]
        for path, expected, name in test_endpoints:
            await self.http_check(
                f"route_{name}",
                f"{base}{path}",
                expected_status=expected,
                severity="warning",
            )

        # 4. Mock API перевірка (як альтернатива при відсутності core-api)
        mock_base = f"http://{TARGET_HOST}:9080"
        await self.http_check("mock_api_health", f"{mock_base}/api/v1/health", severity="warning")

        # 5. ADV-DVS API
        await self.http_check("adv_dvs_health", f"http://{TARGET_HOST}:8003/health", severity="warning")

        # 6. Перевірка CORS та заголовків
        await self._check_cors(base)

    async def _check_cors(self, base_url: str):
        """Перевірка CORS заголовків."""
        import httpx
        try:
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                resp = await client.options(
                    f"{base_url}/api/v1/health",
                    headers={"Origin": f"http://{TARGET_HOST}:3030", "Access-Control-Request-Method": "GET"},
                )
                has_cors = "access-control-allow-origin" in resp.headers
                self.add_check(CheckResult(
                    name="cors_headers",
                    passed=has_cors,
                    message="CORS заголовки присутні" if has_cors else "CORS не налаштовано",
                    severity="warning",
                    details={"headers": dict(resp.headers)},
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="cors_headers",
                passed=False,
                message=f"Неможливо перевірити CORS: {e}",
                severity="warning",
            ))
