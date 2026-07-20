"""Watchlist Pipeline — Автоматичне перескановування об'єктів моніторингу.

Пайплайн:
1. Отримує повідомлення з Kafka топіку `predator.watchlist.rescan`
2. Запускає DossierAggregator для повторного сканування
3. Порівнює новий результат з попереднім (diff)
4. Генерує WatchlistAlert через PredictiveAlertEngine
5. Зберігає оновлений dossier_hash та risk_score

Цей пайплайн працює автономно і не потребує участі користувача.
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Any

logger = logging.getLogger("ingestion_worker.watchlist_pipeline")


class WatchlistPipeline:
    """Пайплайн для автоматичного перескановування watchlist items."""

    def __init__(self, neo4j_sink, postgres_sink, clickhouse_sink) -> None:  # type: ignore[no-untyped-def]
        self.neo4j_sink = neo4j_sink
        self.postgres_sink = postgres_sink
        self.clickhouse_sink = clickhouse_sink

    async def process(self, msg_value: dict[str, Any]) -> None:
        """Обробка запиту на перескановування.

        Формат повідомлення:
        {
            "action": "watchlist_rescan",
            "watchlist_item_id": "...",
            "entity_id": "...",
            "entity_type": "company",
            "entity_name": "...",
            "tenant_id": "...",
            "last_risk_score": 45.0,
            "last_dossier_hash": "abc123..."
        }
        """
        watchlist_item_id = msg_value.get("watchlist_item_id", "")
        entity_id = msg_value.get("entity_id", "")
        entity_type = msg_value.get("entity_type", "company")
        entity_name = msg_value.get("entity_name", "")
        tenant_id = msg_value.get("tenant_id", "")
        old_risk_score = msg_value.get("last_risk_score")
        old_dossier_hash = msg_value.get("last_dossier_hash")

        if not entity_id or not watchlist_item_id:
            logger.warning("watchlist_pipeline.skip", reason="Відсутній entity_id або watchlist_item_id")
            return

        logger.info(
            "watchlist_pipeline.rescan_start",
            extra={"entity_id": entity_id, "entity_name": entity_name}
        )

        try:
            # 1. Запуск OSINT збору
            from app.osint.dossier_aggregator import DossierAggregator
            from app.osint.collectors.base import DossierQuery, EntityType, Classification

            aggregator = DossierAggregator()
            query = DossierQuery(
                identifier=entity_id,
                entity_type=EntityType(entity_type),
                name=entity_name,
                classification_levels=[Classification.WHITE, Classification.GREY],
            )
            dossier = await aggregator.compile_dossier(query)

            # 2. Обчислення хешу нового досьє
            dossier_dict = dossier.model_dump(mode="json")
            new_dossier_hash = hashlib.sha256(
                json.dumps(dossier_dict, sort_keys=True).encode()
            ).hexdigest()[:16]

            new_risk_score = dossier.risk_assessment.overall_score

            # 3. Перевірка: чи змінився досьє?
            if new_dossier_hash == old_dossier_hash:
                logger.info(
                    "watchlist_pipeline.no_changes",
                    extra={"entity_id": entity_id}
                )
                # Оновлюємо лише timestamp скану
                if self.postgres_sink:
                    from sqlalchemy import text
                    await self.postgres_sink.execute_raw(
                        """UPDATE watchlist_items
                           SET last_scan_at = NOW()
                           WHERE id = :item_id""",
                        {"item_id": watchlist_item_id}
                    )
                return

            # 4. Зміни виявлені → запуск Predictive Alert Engine
            logger.info(
                "watchlist_pipeline.changes_detected",
                extra={
                    "entity_id": entity_id,
                    "old_hash": old_dossier_hash,
                    "new_hash": new_dossier_hash,
                    "risk_delta": (new_risk_score - old_risk_score) if old_risk_score else "N/A",
                }
            )

            # Отримуємо старе досьє для diff (з ClickHouse)
            old_dossier_data = None
            if self.clickhouse_sink and old_dossier_hash:
                try:
                    rows = self.clickhouse_sink.execute_query(
                        """SELECT dossier_json FROM osint_dossiers
                           WHERE entity_id = %(entity_id)s
                           ORDER BY created_at DESC LIMIT 1""",
                        {"entity_id": entity_id}
                    )
                    if rows and rows[0]:
                        old_dossier_data = json.loads(rows[0][0])
                except Exception as e:
                    logger.warning(f"watchlist_pipeline.old_dossier_fetch_failed: {e}")

            # 5. Зберігаємо нове досьє в ClickHouse
            if self.clickhouse_sink:
                await self.clickhouse_sink.insert_osint_dossier({
                    "job_id": f"watchlist-{watchlist_item_id}",
                    "entity_id": entity_id,
                    "entity_type": entity_type,
                    "name": entity_name,
                    "risk_score": new_risk_score,
                    "dossier": dossier_dict,
                })

            # 6. Оновлюємо watchlist_items
            if self.postgres_sink:
                from sqlalchemy import text
                await self.postgres_sink.execute_raw(
                    """UPDATE watchlist_items
                       SET last_scan_at = NOW(),
                           last_risk_score = :risk_score,
                           last_dossier_hash = :hash,
                           updated_at = NOW()
                       WHERE id = :item_id""",
                    {
                        "item_id": watchlist_item_id,
                        "risk_score": new_risk_score,
                        "hash": new_dossier_hash,
                    }
                )

            # 7. Зберігаємо граф у Neo4j
            if self.neo4j_sink and dossier.graph:
                graph_data = dossier.graph.model_dump(mode="json")
                if graph_data.get("nodes"):
                    await self.neo4j_sink.merge_ownership_graph(graph_data)

            logger.info(
                "watchlist_pipeline.rescan_complete",
                extra={
                    "entity_id": entity_id,
                    "new_risk_score": new_risk_score,
                    "dossier_hash": new_dossier_hash,
                }
            )

        except Exception as e:
            logger.error(
                "watchlist_pipeline.rescan_failed",
                extra={"entity_id": entity_id, "error": str(e)},
                exc_info=True,
            )
