import asyncio
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from aiokafka import AIOKafkaConsumer
import json

from app.agents.connector_agent import ConnectorAgent
from app.agents.schema_intelligence import SchemaIntelligenceAgent
from app.agents.etl_generator_agent import ETLGeneratorAgent
from app.core.memory_ingestor import memory_ingestor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("autonomous_agents.main")

KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")

connector_agent = ConnectorAgent()
schema_agent = SchemaIntelligenceAgent()
etl_agent = ETLGeneratorAgent()

async def consume_discovery_events():
    """Listens for new data sources discovered by the Discovery Engine."""
    consumer = AIOKafkaConsumer(
        "predator.factory.discovery",
        bootstrap_servers=KAFKA_BROKER,
        group_id="autonomous_agents_group",
        value_deserializer=lambda x: json.loads(x.decode("utf-8")) if x else {}
    )
    
    await consumer.start()
    logger.info("Autonomous Agents listening to predator.factory.discovery")
    
    try:
        async for msg in consumer:
            payload = msg.value
            source_url = payload.get("url")
            sample_data = payload.get("sample_data")
            
            logger.info(f"Received new source discovery: {source_url}")
            
            # 1. Analyze Schema
            schema_info = await schema_agent.analyze_schema(sample_data, source_url)
            logger.info(f"Schema Analysis Complete: {schema_info}")
            
            # 2. Generate Connector Code
            source_info = {
                "url": source_url,
                "type": payload.get("type", "api"),
                "schema_sample": schema_info
            }
            gen_result = await connector_agent.generate_connector(source_info)
            logger.info(f"Connector Generation Complete: {gen_result}")
            
            # 3. Generate ETL Normalizer
            if gen_result.get("status") == "success":
                etl_result = await etl_agent.generate_normalizer(source_info)
                logger.info(f"ETL Normalizer Generation Complete: {etl_result}")
            
            # In a full flow, we would push an event to 'predator.factory.testing' here.
            
    finally:
        await consumer.stop()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Memory
    asyncio.create_task(memory_ingestor.ingest_memory())
    
    task = asyncio.create_task(consume_discovery_events())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="PREDATOR AI Factory", lifespan=lifespan)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
