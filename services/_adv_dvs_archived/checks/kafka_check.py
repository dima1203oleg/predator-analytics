"""
Перевірка доступності Kafka-брокера.
Використовує aiokafka: намагається отримати метадані кластеру.
"""
import time
from aiokafka.admin import AIOKafkaAdminClient

from ..models import CheckResult, CheckStatus
from .. import config


async def run() -> CheckResult:
    """Перевіряє підключення до Kafka, витягуючи метадані кластеру.

    Умови:
        - Отримано metadata → OK
        - Таймаут або помилка → FAIL
    """
    start = time.monotonic()
    client: AIOKafkaAdminClient | None = None
    try:
        client = AIOKafkaAdminClient(
            bootstrap_servers=config.KAFKA_BOOTSTRAP_SERVERS,
            request_timeout_ms=int(config.KAFKA_TIMEOUT * 1000),
        )
        await client.start()
        topics = await client.list_topics()
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="kafka",
            status=CheckStatus.OK,
            details=f"Брокер доступний, топіків: {len(topics)}",
            latency_ms=round(latency_ms, 2),
        )
    except Exception as exc:  # noqa: BLE001
        latency_ms = (time.monotonic() - start) * 1000
        return CheckResult(
            name="kafka",
            status=CheckStatus.FAIL,
            details=str(exc),
            latency_ms=round(latency_ms, 2),
        )
    finally:
        if client is not None:
            try:
                await client.close()
            except Exception:  # noqa: BLE001
                pass
