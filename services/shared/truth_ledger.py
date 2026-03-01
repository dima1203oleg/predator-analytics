"""Truth Ledger Interface for Predator Analytics v45.1.

Component: shared.
Section 3.1.2 of Spec.
"""

from __future__ import annotations

import json
import os
from typing import TYPE_CHECKING, Any

import clickhouse_connect

from services.shared.logging_config import get_logger


if TYPE_CHECKING:
    from services.shared.events import PredatorEvent

logger = get_logger(__name__)

CH_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CH_PORT = os.getenv("CLICKHOUSE_PORT", "8123")
CH_USER = os.getenv("CLICKHOUSE_USER", "default")
CH_PASS = os.getenv("CLICKHOUSE_PASSWORD", "")


class TruthLedger:
    """Interface to the ClickHouse-based Truth Ledger.

    Used for analytical persistence.
    """

    def __init__(self):
        self.client = None

    def connect(self):
        """Connect to ClickHouse."""
        if not self.client:
            self.client = clickhouse_connect.get_client(
                host=CH_HOST,
                port=int(CH_PORT),
                username=CH_USER,
                password=CH_PASS,
            )
            logger.info("Connected to ClickHouse Truth Ledger")

    def save_event(self, event: PredatorEvent, metric_value: float = 0.0):
        """Persist event to ClickHouse."""
        if not self.client:
            self.connect()

        data = [
            [
                event.event_id,
                event.event_type,
                event.timestamp,
                event.source,
                event.tenant_id,
                event.correlation_id,
                json.dumps(event.context),
                metric_value,
                event.idempotency_key,  # Used as integrity check
            ]
        ]

        try:
            if self.client:
                self.client.insert(
                    "predator_truth_ledger",
                    data,
                    column_names=[
                        "event_id",
                        "event_type",
                        "timestamp",
                        "source",
                        "tenant_id",
                        "correlation_id",
                        "payload",
                        "metric_value",
                        "integrity_hash",
                    ],
                )
                logger.debug("Event %s persisted to Truth Ledger", event.event_id)
        except Exception:
            logger.exception("Failed to persist to Truth Ledger")

    def query_metrics(
        self,
        tenant_id: str,
        event_type: str,
        hours: int = 24,
    ) -> list[dict[str, Any]]:
        """Query the Truth Ledger for specific metrics."""
        if not self.client:
            self.connect()

        query = """
            SELECT hour, avg_metric
            FROM model_performance_stats
            WHERE tenant_id = %(tenant_id)s
              AND event_type = %(event_type)s
              AND hour > now() - INTERVAL %(hours)s HOUR
            ORDER BY hour ASC
        """
        params = {
            "tenant_id": tenant_id,
            "event_type": event_type,
            "hours": hours,
        }
        result = self.client.query(query, parameters=params)
        return [{"timestamp": row[0], "value": row[1]} for row in result.result_rows]
