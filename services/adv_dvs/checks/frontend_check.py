"""
Перевірка доступності Frontend UI (HTTP GET /).
"""
import time
import httpx

from ..models import CheckResult, CheckStatus
from .. import config


async def run() -> CheckResult:
    """Перевіряє, чи відповідає Frontend UI на кореневий URL.

    Умови:
        - HTTP 200 → OK
        - HTTP 2xx/3xx але > HTTP_TIMEOUT/2 → WARN
        - Будь-яка помилка або HTTP ≥ 400 → FAIL
    """
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT) as client:
            resp = await client.get(config.FRONTEND_URL)
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code < 400:
            slow = latency_ms > (config.HTTP_TIMEOUT * 1000 / 2)
            return CheckResult(
                name="frontend",
                status=CheckStatus.WARN if slow else CheckStatus.OK,
                details=f"HTTP {resp.status_code} — {'повільно' if slow else 'OK'}",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="frontend",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="frontend",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
