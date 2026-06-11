"""
Перевірка доступності ClickHouse (OLAP движок).
Виконує HTTP GET на /ping ендпоїнт.
"""
import time

import httpx

from .. import config
from ..models import CheckResult, CheckStatus


async def run() -> CheckResult:
    """Перевіряє ClickHouse через ендпоїнт /ping.

    ClickHouse повертає 'Ok.\n' на GET /ping якщо сервер доступний.

    Умови:
        - HTTP 200 → OK
        - Будь-яка помилка → FAIL
    """
    url = f"{config.CLICKHOUSE_URL}/ping"
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT) as client:
            resp = await client.get(url)
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code == 200:
            return CheckResult(
                name="clickhouse",
                status=CheckStatus.OK,
                details="OLAP движок доступний",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="clickhouse",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="clickhouse",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
