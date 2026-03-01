from __future__ import annotations

import asyncio
import json
import logging
import re
import uuid

import asyncpg
from celery import shared_task

from app.libs.core.config import settings
from app.libs.core.graph_db import graph_db


logger = logging.getLogger("predator.customs.intel")

# REGEX PATTERNS FOR CUSTOMS (Section 6.2)
HS_CODE_REGEX = r"\b\d{10}\b"  # 10-digit HS Code
DECL_NUM_REGEX = r"\bUA\d{5,10}/202\d/\d{5,8}\b"  # Example UA Customs Format: UA100100/2024/012345
EDRPOU_REGEX = r"\b\d{8,10}\b"  # Ukrainian Company Codes

# SENTIMENT KEYWORDS (Section 6.2)
CRITICAL_KEYWORDS = ["корупція", "схема", "скандал", "крадіжка", "кримінал", "обшук", "затримано"]
POSITIVE_KEYWORDS = ["ефективно", "успішно", "допомога", "реформа", "чесно"]


class CustomsIntelProcessor:
    """NLP & Graph Linking Processor for Customs Intelligence (Serious Mode v1.0)
    Implements Section 6 (Telegram Intelligence) and Section 5.3 (Graph DB).
    """

    def __init__(self, db_url: str):
        self.db_url = db_url

    async def process_telegram_document(self, doc_id: str, content: str, meta: dict):
        """Analyze telegram post and link to customs entities."""
        logger.info(f"Analyzing Telegram post: {doc_id}")

        # 1. ENTITY EXTRACTION (Section 6.2)
        list(set(re.findall(HS_CODE_REGEX, content)))
        decl_nums = list(set(re.findall(DECL_NUM_REGEX, content)))
        edrpous = list(set(re.findall(EDRPOU_REGEX, content)))

        # 2. SENTIMENT ANALYSIS
        sentiment = "NEUTRAL"
        content_lower = content.lower()
        if any(kw in content_lower for kw in CRITICAL_KEYWORDS):
            sentiment = "CRITICAL"
        elif any(kw in content_lower for kw in POSITIVE_KEYWORDS):
            sentiment = "POSITIVE"

        # 3. PERSISTENCE (PostgreSQL - Section 5.1)
        conn = await asyncpg.connect(self.db_url)
        try:
            # Link to Declarations
            for d_num in decl_nums:
                # Find declaration ID if exists
                decl_id = await conn.fetchval(
                    "SELECT id FROM customs.declarations WHERE declaration_number = $1", d_num
                )
                if decl_id:
                    await conn.execute(
                        """
                        INSERT INTO customs.telegram_links (telegram_message_id, target_id, target_type, sentiment, extraction_meta)
                        VALUES ($1, $2, 'DECLARATION', $3, $4)
                        ON CONFLICT DO NOTHING
                    """,
                        uuid.UUID(doc_id),
                        decl_id,
                        sentiment,
                        json.dumps({"matched_tokens": [d_num]}),
                    )

            # Link to Companies (via EDRPOU)
            for code in edrpous:
                part_id = await conn.fetchval("SELECT id FROM customs.participants WHERE code = $1", code)
                if part_id:
                    await conn.execute(
                        """
                        INSERT INTO customs.telegram_links (telegram_message_id, target_id, target_type, sentiment, extraction_meta)
                        VALUES ($1, $2, 'COMPANY', $3, $4)
                        ON CONFLICT DO NOTHING
                    """,
                        uuid.UUID(doc_id),
                        part_id,
                        sentiment,
                        json.dumps({"matched_tokens": [code]}),
                    )

            # 4. GRAPH SYNC (Section 5.3)
            mentions = []
            for d in decl_nums:
                mentions.append({"label": "Declaration", "key": d, "type": "DECLARATION"})
            for e in edrpous:
                mentions.append({"label": "Company", "key": e, "type": "COMPANY"})

            if mentions:
                await graph_db.link_telegram_post(doc_id, content, mentions)

        finally:
            await conn.close()

    async def _sync_to_graph(
        self, doc_id: str, hs_codes: list[str], decl_nums: list[str], edrpous: list[str], sentiment: str
    ):
        """Sync findings to Neo4j Graph DB.
        Section 5.3: Mandatory nodes: Company, Declaration, Goods.
        """
        # Note: In real production, use a dedicated Neo4j driver.
        # This is the logic structure.
        logger.info(f"Graph Sync: Linking post {doc_id} to {len(decl_nums)} decls and {len(edrpous)} companies.")

        # Cypher Example:
        # MERGE (post:TelegramPost {id: $doc_id})
        # SET post.sentiment = $sentiment
        # WITH post
        # UNWIND $decl_nums as dnum
        # MATCH (d:Declaration {number: dnum})
        # MERGE (post)-[:MENTIONS]->(d)


@shared_task(name="tasks.workers.analyze_customs_intel", queue="etl", bind=True)
def analyze_customs_intel(self, doc_id: str):
    """Celery task entry point for Customs Intel Analysis."""

    async def _run():
        db_url = settings.CLEAN_DATABASE_URL
        conn = await asyncpg.connect(db_url)
        try:
            # Fetch document
            doc = await conn.fetchrow("SELECT content, meta FROM gold.documents WHERE id = $1", uuid.UUID(doc_id))
            if not doc:
                return

            processor = CustomsIntelProcessor(db_url)
            await processor.process_telegram_document(doc_id, doc["content"], json.loads(doc["meta"]))
        finally:
            await conn.close()

    return asyncio.run(_run())
