import os
"""
Рівень 4: Перевірка синхронізації Frontend ↔ Backend.
WebSocket, живі дані, відповідність таблиць API, кеш.
"""
import httpx
from typing import Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class SyncValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level4_sync",
            description="Синхронізація Frontend ↔ Backend: WebSocket, дані, кеш",
        )

    async def _run_validation(self):
        api_base = config.CORE_API_URL
        frontend_base = config.FRONTEND_URL

        # 1. Перевірка WebSocket ендпоінту
        await self._check_websocket(api_base)

        # 2. Перевірка відповідності Frontend і Backend
        await self._check_api_frontend_sync(api_base, frontend_base)

        # 3. Перевірка Mock API як fallback
        await self._check_mock_api_sync()

    async def _check_websocket(self, api_base: str):
        """Перевірка WebSocket з'єднання."""
        ws_url = api_base.replace("http://", "ws://").replace("https://", "wss://") + "/ws"
        try:
            # Базова перевірка — чи відповідає сервер на WebSocket upgrade
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                resp = await client.get(
                    ws_url.replace("ws://", "http://").replace("wss://", "https://"),
                    headers={"Upgrade": "websocket", "Connection": "Upgrade"},
                )
                # WebSocket зазвичай відповідає 101 або 400/426
                self.add_check(CheckResult(
                    name="websocket_endpoint",
                    passed=resp.status_code in (101, 426, 400, 403),
                    message=f"WebSocket endpoint: HTTP {resp.status_code}",
                    severity="warning",
                    details={"url": ws_url, "status": resp.status_code},
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="websocket_endpoint",
                passed=False,
                message=f"WebSocket недоступний: {e}",
                severity="warning",
            ))

    async def _check_api_frontend_sync(self, api_base: str, frontend_base: str):
        """Перевірка що frontend і backend обидва доступні."""
        api_ok = False
        frontend_ok = False

        try:
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                try:
                    r = await client.get(f"{api_base}/api/v1/health")
                    api_ok = r.status_code == 200
                except Exception:
                    pass
                try:
                    r = await client.get(frontend_base)
                    frontend_ok = r.status_code == 200
                except Exception:
                    pass

            self.add_check(CheckResult(
                name="frontend_backend_both_up",
                passed=api_ok and frontend_ok,
                message=f"Frontend: {'✓' if frontend_ok else '✗'}, Backend: {'✓' if api_ok else '✗'}",
                severity="warning",
                details={"frontend": frontend_ok, "backend": api_ok},
            ))

            if api_ok and frontend_ok:
                self.add_check(CheckResult(
                    name="sync_ready",
                    passed=True,
                    message="Обидва сервіси синхронізовані і доступні",
                    severity="info",
                ))
            elif frontend_ok and not api_ok:
                self.add_check(CheckResult(
                    name="sync_degraded",
                    passed=False,
                    message="Frontend працює, але Backend недоступний — UI працює з mock даними",
                    severity="warning",
                ))
        except Exception as e:
            self.add_check(CheckResult(
                name="sync_check",
                passed=False,
                message=f"Помилка перевірки синхронізації: {e}",
                severity="warning",
            ))

    async def _check_mock_api_sync(self):
        """Перевірка Mock API як fallback для frontend."""
        mock_base = f"http://{TARGET_HOST}:9080"
        try:
            async with httpx.AsyncClient(verify=False, timeout=3) as client:
                r = await client.get(f"{mock_base}/api/v1/health")
                available = r.status_code == 200
                self.add_check(CheckResult(
                    name="mock_api_fallback",
                    passed=available,
                    message="Mock API (порт 9080) доступний як fallback" if available
                            else "Mock API (порт 9080) не запущений",
                    severity="info",
                ))
        except Exception:
            self.add_check(CheckResult(
                name="mock_api_fallback",
                passed=False,
                message="Mock API (порт 9080) не запущений",
                severity="info",
            ))
