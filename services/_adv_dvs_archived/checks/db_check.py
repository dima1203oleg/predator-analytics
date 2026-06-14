"""
Перевірка доступності PostgreSQL (SELECT 1).
"""
import time
import asyncpg

from ..models import CheckResult, CheckStatus
from .. import config


async def run() -> CheckResult:
    """Перевіряє PostgreSQL виконанням SELECT 1.

    Умови:
        - Запит виконано → OK
        - Таймаут або помилка → FAIL
    """
    start = time.monotonic()
    conn: asyncpg.Connection | None = None
    try:
        # asyncpg DSN: перетворюємо SQLAlchemy-формат в рядок asyncpg
        dsn = config.POSTGRES_DSN.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(dsn=dsn, timeout=config.DB_TIMEOUT)
        await conn.fetchval("SELECT 1")
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="db",
            status=CheckStatus.OK,
            details="SELECT 1 виконано успішно",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="db",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
    finally:
        if conn is not None:
            try:
                await conn.close()
            except Exception:  # noqa: BLE001
                pass
