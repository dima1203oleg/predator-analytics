"""
Перевірка доступності OpenSearch (повнотекстовий пошук).
Виконує HTTP GET на кореневий URL.
"""
import time

import httpx

from .. import config
from ..models import CheckResult, CheckStatus


async def run() -> CheckResult:
    """Перевіряє OpenSearch через кореневий ендпоїнт.

    OpenSearch повертає JSON з інформацією про кластер на GET /.

    Умови:
        - HTTP 200 → OK
        - HTTP 2xx/3xx але повільно → WARN
        - Будь-яка помилка або HTTP ≥ 400 → FAIL
    """
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(
            timeout=config.HTTP_TIMEOUT,
            verify=False,  # noqa: S501 — OpenSearch часто з self-signed cert
        ) as client:
            resp = await client.get(
                config.OPENSEARCH_URL,
                auth=(config.OPENSEARCH_USER, config.OPENSEARCH_PASSWORD),
            )
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code < 400:
            slow = latency_ms > (config.HTTP_TIMEOUT * 1000 / 2)
            return CheckResult(
                name="opensearch",
                status=CheckStatus.WARN if slow else CheckStatus.OK,
                details=f"Кластер доступний — {'повільно' if slow else 'OK'}",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="opensearch",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="opensearch",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
