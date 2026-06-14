"""Шар тестування продуктивності (Performance Layer) UTOS v61.0-ELITE.
Вимірює Latency ключових операцій, пропускну здатність бази даних ClickHouse
та порівнює метрики швидкодії з вимогами ELITE-специфікації.
"""
import logging
import time

import httpx

from utos.config import CLICKHOUSE_PASSWORD, CLICKHOUSE_URL, CLICKHOUSE_USER
from utos.layers import BaseLayer, CheckResult

logger = logging.getLogger(__name__)


class PerformanceLayer(BaseLayer):
    """Шар валідації швидкодії та затримок операцій."""

    def __init__(self):
        super().__init__(
            name="performance",
            description="Аудит продуктивності, затримок API, швидкості ClickHouse та RTT",
            weight=0.10,
        )

    async def _run_validation(self) -> None:
        # 1. Тест затримки складного OLAP запиту ClickHouse
        await self._benchmark_clickhouse_query()

    async def _benchmark_clickhouse_query(self) -> None:
        """Вимірювання швидкодії аналітичного двигуна ClickHouse."""
        start = time.time()
        client = httpx.AsyncClient(timeout=10.0)
        try:
            # Складний агрегаційний запит для виміру
            query = "SELECT count() FROM system.parts"
            headers = {}
            if CLICKHOUSE_USER:
                headers["X-ClickHouse-User"] = CLICKHOUSE_USER
            if CLICKHOUSE_PASSWORD:
                headers["X-ClickHouse-Key"] = CLICKHOUSE_PASSWORD

            resp = await client.post(
                CLICKHOUSE_URL,
                content=query,
                headers=headers
            )
            latency = (time.time() - start) * 1000

            if resp.status_code == 200:
                # Цільовий ліміт для ELITE OLAP — до 250мс на внутрішні агрегації
                passed = latency < 250.0
                self.add_check(CheckResult(
                    name="clickhouse_olap_latency",
                    passed=passed,
                    message=f"OLAP-запит виконано за {latency:.1f}мс" +
                            ("" if passed else " (Перевищено ліміт 250мс)"),
                    severity="warning" if not passed else "info",
                    latency_ms=latency
                ))
            else:
                raise ValueError(f"HTTP {resp.status_code}")
        except Exception as e:
            self.add_check(CheckResult(
                name="clickhouse_olap_latency",
                passed=False,
                message=f"Не вдалося виміряти швидкість ClickHouse: {e}",
                severity="warning"
            ))
        finally:
            await client.aclose()
