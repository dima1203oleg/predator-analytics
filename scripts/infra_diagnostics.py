import asyncio
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PROD_DIAGNOSTICS")

async def check_tcp(host, port, name):
    try:
        _reader, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=2.0)
        writer.close()
        await writer.wait_closed()
        return {"id": name, "status": "UP", "host": host, "port": port}
    except Exception as e:
        return {"id": name, "status": "DOWN", "error": str(e), "host": host, "port": port}

async def run_diagnostics():
    services = [
        ("postgres", 5432, "PostgreSQL"),
        ("redis", 6379, "Redis"),
        ("minio", 9000, "MinIO (API)"),
        ("minio", 9001, "MinIO (Console)"),
        ("opensearch", 9200, "OpenSearch"),
        ("qdrant", 6333, "Qdrant"),
        ("ollama", 11434, "Ollama"),
        ("predator-ollama", 11434, "Ollama (Alias)"),
        ("predator_h2o_automl", 54321, "H2O AutoML"),
        ("rabbitmq", 5672, "RabbitMQ"),
    ]

    # Try Neo4j / Graph DB aliases
    services.extend([
        ("neo4j", 7474, "Neo4j HTTP"),
        ("neo4j", 7687, "Neo4j Bolt"),
        ("graphdb", 7200, "GraphDB HTTP"),
        ("arangodb", 8529, "ArangoDB"),
    ])

    logger.info("🕵️ STARTING GLOBAL INFRASTRUCTURE DIAGNOSTICS...")

    tasks = [check_tcp(s[0], s[1], s[2]) for s in services]
    results = await asyncio.gather(*tasks)

    {
        "timestamp": datetime.now().isoformat(),
        "results": results,
        "summary": {
            "total": len(results),
            "up": len([r for r in results if r["status"] == "UP"]),
            "down": len([r for r in results if r["status"] == "DOWN"])
        }
    }


if __name__ == "__main__":
    asyncio.run(run_diagnostics())
