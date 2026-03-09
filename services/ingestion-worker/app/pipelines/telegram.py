"""
Telegram Pipeline Wrapper — PREDATOR Analytics v55.1 Ironclad.

Integrates existing Telethon-based telegram_channel_connector and 
TelegramIntelligencePipeline into the new ingestion-worker structure.
"""
import os
from typing import Any, Dict, List
from app.pipelines.base import BasePipeline
from app.sinks.postgres_sink import PostgresSink
from app.sinks.neo4j_sink import Neo4jSink

# Importing existing logic from root project
# Note: In production, these should be part of a shared library (predator_common)
# or correctly referenced via PYTHONPATH.
from app.connectors.telegram_channel import telegram_channel_connector
from app.services.telegram_pipeline import get_telegram_pipeline

class TelegramIngestionPipeline(BasePipeline):
    def __init__(self, tenant_id: str):
        super().__init__(tenant_id)
        self.pipeline = get_telegram_pipeline()
        self.postgres_sink = PostgresSink()
        self.neo4j_sink = Neo4jSink()

    async def run(self, source_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        source_data expected to contain:
        - channel_username: str
        - limit: int
        """
        username = source_data.get("channel_username")
        limit = source_data.get("limit", 10)
        
        if not username:
            return {"status": "error", "message": "channel_username is required"}

        # 1. Fetch from Telethon
        history = await telegram_channel_connector.fetch_channel_history(username, limit=limit)
        if not history.success:
            return {"status": "error", "message": history.error}

        # 2. Process via existing TelegramIntelligencePipeline
        processed = await self.pipeline.process_channel_batch(
            history.data, 
            {"name": username}
        )

        # 3. Sink results
        # TODO: Map processed['valuable_items'] to DB schema
        
        return {
            "status": "success",
            "valuable_count": processed["valuable_count"],
            "processed_count": processed["total_processed"]
        }
