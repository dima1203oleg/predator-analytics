"""
Перевірка доступності MinIO (S3-сумісне сховище).
Виконує HTTP GET на /minio/health/live ендпоїнт.
"""
import time

import httpx

from .. import config
from ..models import CheckResult, CheckStatus


async def run() -> CheckResult:
    """Перевіряє MinIO через ендпоїнт /minio/health/live.

    MinIO повертає HTTP 200 на /minio/health/live якщо сервер доступний.

    Умови:
        - HTTP 200 → OK
        - Будь-яка помилка → FAIL
    """
    url = f"{config.MINIO_URL}{config.MINIO_HEALTH_PATH}"
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=config.HTTP_TIMEOUT) as client:
            resp = await client.get(url)
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code == 200:
            return CheckResult(
                name="minio",
                status=CheckStatus.OK,
                details="S3 сховище доступне",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="minio",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="minio",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
