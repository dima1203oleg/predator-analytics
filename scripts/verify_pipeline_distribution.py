from __future__ import annotations

import asyncio
import logging
import os


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(name)s - %(message)s')
logger = logging.getLogger("VERIFY")

async def verify_distribution():
    logger.info("VERIFY: Starting pipeline distribution verification...")

    # 1. Check PostgreSQL (Gold Layer)
    try:
        import asyncpg
        db_url = os.getenv("DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db")
        conn = await asyncpg.connect(db_url)

        # Check if the specific data (e.g., from Excel) made it to gold
        # We look for 'customs' category from import_march_2024
        row = await conn.fetchrow("""
            SELECT count(*) as count, max(created_at) as last_ingest
            FROM gold.documents
            WHERE source = 'customs'
        """)

        logger.info(f"VERIFY [PostgreSQL]: Found {row['count']} documents in gold.documents (source='customs'). Last ingest: {row['last_ingest']}")
        await conn.close()
    except Exception as e:
        logger.exception(f"VERIFY [PostgreSQL]: Failed to check. Error: {e}")

    # 2. Check OpenSearch (Text Index)
    try:
        import httpx
        opensearch_url = os.getenv("OPENSEARCH_URL", "http://localhost:9200")
        async with httpx.AsyncClient() as client:
            # Check indices
            resp = await client.get(f"{opensearch_url}/_cat/indices?format=json")
            indices = resp.json()
            doc_count = 0
            for idx in indices:
                if idx['index'] == 'documents_safe':
                    doc_count = idx['docs.count']

            # Check for a specific term from the Excel
            search_resp = await client.post(
                f"{opensearch_url}/documents_safe/_search",
                json={"query": {"match": {"content": "330610"}}} # Code for toothpaste
            )
            hits = search_resp.json().get('hits', {}).get('total', {}).get('value', 0)

            logger.info(f"VERIFY [OpenSearch]: Index 'documents_safe' exists with {doc_count} docs. Hits for '330610': {hits}")
    except Exception as e:
         logger.exception(f"VERIFY [OpenSearch]: Failed to check. Error: {e}")

    # 3. Check Qdrant (Vector Index)
    try:
        import httpx
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        async with httpx.AsyncClient() as client:
            # Check collection
            resp = await client.get(f"{qdrant_url}/collections/documents_safe")
            if resp.status_code == 200:
                data = resp.json()
                points = data.get('result', {}).get('points_count', 0)
                logger.info(f"VERIFY [Qdrant]: Collection 'documents_safe' exists with {points} vectors.")
            else:
                logger.warning(f"VERIFY [Qdrant]: Collection 'documents_safe' not found (Status {resp.status_code})")
    except Exception as e:
        logger.exception(f"VERIFY [Qdrant]: Failed to check. Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_distribution())
