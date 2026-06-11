"""
Перевірка доступності Core API Backend (HTTP GET /api/v1/health).
"""
import time
import httpx

from ..models import CheckResult, CheckStatus
from .. import config


async def run() -> CheckResult:
    """Перевіряє, чи відповідає Core API на ендпоїнт /health.

    Умови:
        - HTTP 200 → OK
        - HTTP 200 але > таймаут/2 → WARN
        - Будь-яка помилка або HTTP ≥ 400 → FAIL
    """
    url = f"{config.CORE_API_URL}{config.CORE_API_HEALTH_PATH}"
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT) as client:
            resp = await client.get(url)
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code < 400:
            slow = latency_ms > (config.HTTP_TIMEOUT * 1000 / 2)
            return CheckResult(
                name="backend",
                status=CheckStatus.WARN if slow else CheckStatus.OK,
                details=f"HTTP {resp.status_code} {url} — {'повільно' if slow else 'OK'}",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="backend",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code} {url}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="backend",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
