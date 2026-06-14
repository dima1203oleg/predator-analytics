"""
Перевірка доступності Neo4j (графова БД).
Виконує RETURN 1 через Bolt-протокол.
"""
import time

import httpx

from .. import config
from ..models import CheckResult, CheckStatus


async def run() -> CheckResult:
    """Перевіряє Neo4j через HTTP API (db/neo4j/cluster/available).

    Використовує HTTP замість нативного драйвера для мінімізації
    залежностей. Neo4j 5+ підтримує HTTP API.

    Умови:
        - HTTP 200 → OK
        - Будь-яка помилка → FAIL
    """
    start = time.monotonic()
    # Перетворюємо bolt:// на http:// з портом 7474 для HTTP API
    http_base = config.NEO4J_URI.replace("bolt://", "http://").replace(":7687", ":7474")
    url = f"{http_base}/db/neo4j/cluster/available"
    try:
        async with httpx.AsyncClient(timeout=config.NEO4J_TIMEOUT) as client:
            resp = await client.get(
                url,
                auth=(config.NEO4J_USER, config.NEO4J_PASSWORD),
            )
        latency_ms = (time.monotonic() - start) * 1000

        if resp.status_code < 400:
            return CheckResult(
                name="neo4j",
                status=CheckStatus.OK,
                details=f"HTTP {resp.status_code} — графова БД доступна",
                latency_ms=round(latency_ms, 2),
            )
        return CheckResult(
            name="neo4j",
            status=CheckStatus.FAIL,
            details=f"HTTP {resp.status_code}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="neo4j",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
