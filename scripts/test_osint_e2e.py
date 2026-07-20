#!/usr/bin/env python3
import asyncio
import logging
import sys
import uuid
import os

# Add ingestion-worker to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../services/ingestion-worker')))

from app.pipelines.osint_pipeline import OSINTPipeline
from app.sinks.neo4j_sink import Neo4jSink

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_osint_e2e")

async def test_e2e():
    logger.info("Initializing Neo4j Sink...")
    neo4j_sink = Neo4jSink()
    
    # We pass None for postgres_sink since OSINTPipeline doesn't use it yet
    pipeline = OSINTPipeline(neo4j_sink=neo4j_sink, postgres_sink=None)
    
    test_id = str(uuid.uuid4())
    msg = {
        "job_id": test_id,
        "entity_id": "Pavel Durov",
        "name": "Pavel Durov",
        "entity_type": "PERSON",
        "tenant_id": "test_tenant"
    }
    
    logger.info(f"Running OSINTPipeline for: {msg}")
    await pipeline.process(msg)
    
    logger.info("OSINTPipeline completed. Verifying Neo4j state...")
    
    # Verify Neo4j
    if getattr(neo4j_sink, '_connected', False):
        try:
            records = await neo4j_sink.run_query(
                "MATCH (n) WHERE n.id = $id RETURN n",
                {"id": "Pavel Durov"}
            )
            if records:
                logger.info("✅ SUCCESS: Root node found in Neo4j!")
            else:
                logger.warning("❌ WARNING: Root node not found in Neo4j.")
                
            edge_records = await neo4j_sink.run_query(
                "MATCH (a)-[r]->(b) WHERE a.id = $id RETURN r, b LIMIT 5",
                {"id": "Pavel Durov"}
            )
            logger.info(f"Edges found: {len(edge_records)}")
            
        except Exception as e:
            logger.error(f"Neo4j query failed: {e}")
        finally:
            await neo4j_sink.close()
    else:
        logger.warning("Neo4j sink is not connected. Skipping DB verification.")

if __name__ == "__main__":
    asyncio.run(test_e2e())
