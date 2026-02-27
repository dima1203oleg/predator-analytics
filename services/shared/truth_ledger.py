
"""
Module: truth_ledger
Component: shared
Predator Analytics v45.1
Section 3.1.2 of Spec.
"""
import clickhouse_connect
import os
import json
import logging
from typing import List, Dict, Any
from .events import PredatorEvent

logger = logging.getLogger(__name__)

CH_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CH_PORT = os.getenv("CLICKHOUSE_PORT", 8123)
CH_USER = os.getenv("CLICKHOUSE_USER", "default")
CH_PASS = os.getenv("CLICKHOUSE_PASSWORD", "")

class TruthLedger:
    """
    Interface to the ClickHouse-based Truth Ledger.
    Used for analytical persistence.
    """
    def __init__(self):
        self.client = None

    def connect(self):
        if not self.client:
            self.client = clickhouse_connect.get_client(
                host=CH_HOST,
                port=int(CH_PORT),
                username=CH_USER,
                password=CH_PASS
            )
            logger.info("Connected to ClickHouse Truth Ledger")

    def save_event(self, event: PredatorEvent, metric_value: float = 0.0):
        """Persists event to ClickHouse."""
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
                event.idempotency_key # Used as integrity check
            ]
        ]
        
        try:
            self.client.insert(
                'predator_truth_ledger',
                data,
                column_names=[
                    'event_id', 'event_type', 'timestamp', 'source', 
                    'tenant_id', 'correlation_id', 'payload', 
                    'metric_value', 'integrity_hash'
                ]
            )
            logger.debug(f"Event {event.event_id} persisted to Truth Ledger")
        except Exception as e:
            logger.error(f"Failed to persist to Truth Ledger: {e}")

    def query_metrics(self, tenant_id: str, event_type: str, hours: int = 24) -> List[Dict[str, Any]]:
        """Queries the Truth Ledger for specific metrics."""
        if not self.client:
            self.connect()
            
        query = f"""
            SELECT hour, avg_metric 
            FROM model_performance_stats 
            WHERE tenant_id = '{tenant_id}' 
              AND event_type = '{event_type}'
              AND hour > now() - INTERVAL {hours} HOUR
            ORDER BY hour ASC
        """
        result = self.client.query(query)
        return [{"timestamp": row[0], "value": row[1]} for row in result.result_rows]
