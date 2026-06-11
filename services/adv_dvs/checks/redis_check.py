"""
Перевірка доступності Redis (PING).
"""
import time
import redis.asyncio as aioredis

from ..models import CheckResult, CheckStatus
from .. import config


async def run() -> CheckResult:
    """Перевіряє доступність Redis командою PING.

    Умови:
        - PONG отримано → OK
        - Таймаут або помилка → FAIL
    """
    start = time.monotonic()
    client: aioredis.Redis | None = None
    try:
        client = aioredis.from_url(
            config.REDIS_URL,
            socket_connect_timeout=config.REDIS_TIMEOUT,
            socket_timeout=config.REDIS_TIMEOUT,
            decode_responses=True,
        )
        pong = await client.ping()
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="redis",
            status=CheckStatus.OK if pong else CheckStatus.WARN,
            details="PONG" if pong else "Не отримано PONG",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="redis",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
    finally:
        if client is not None:
            try:
                await client.aclose()
            except Exception:  # noqa: BLE001
                pass
