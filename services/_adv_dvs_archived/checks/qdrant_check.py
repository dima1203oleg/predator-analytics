"""
Перевірка доступності Qdrant (векторна БД).
Виконує HTTP GET на /healthz ендпоїнт.
"""
import time

import httpx

from .. import config
from ..models import CheckResult, CheckStatus


async def run() -> CheckResult:
    """Перевіряє Qdrant через ендпоїнт /healthz.

    Qdrant повертає HTTP 200 на /healthz якщо сервер доступний.

    Умови:
        - HTTP 200 → OK
        - Будь-яка помилка → FAIL
    """
    url = f"{config.QDRANT_URL}/healthz"
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT) as client:
            resp = await client.get(url)
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code == 200:
            return CheckResult(
                name="qdrant",
                status=CheckStatus.OK,
                details="Векторна БД доступна",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="qdrant",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="qdrant",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
