"""ADV DVS: Database Checks."""
import os
import asyncio
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.db")

async def check_postgres() -> dict:
    """Перевіряє з'єднання з PostgreSQL."""
    try:
        import asyncpg
    except ImportError:
        return {"status": "fail", "component": "postgres", "message": "asyncpg is not installed"}

    pg_dsn = os.getenv("POSTGRES_DSN", "postgresql://predator:password@postgres:5432/predator_db")
    logger.info("Перевірка підключення до PostgreSQL")
    try:
        conn = await asyncpg.connect(pg_dsn, timeout=5.0)
        await conn.execute("SELECT 1")
        await conn.close()
        return {"status": "passed", "component": "postgres", "message": "Підключення успішне."}
    except Exception as e:
        logger.error(f"Помилка PostgreSQL: {e}")
        return {"status": "fail", "component": "postgres", "message": str(e)}

async def check_neo4j() -> dict:
    """Перевіряє з'єднання з Neo4j."""
    try:
        from neo4j import GraphDatabase
    except ImportError:
        return {"status": "fail", "component": "neo4j", "message": "neo4j is not installed"}

    uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    
    logger.info("Перевірка підключення до Neo4j")
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        driver.close()
        return {"status": "passed", "component": "neo4j", "message": "Підключення успішне."}
    except Exception as e:
        logger.error(f"Помилка Neo4j: {e}")
        return {"status": "fail", "component": "neo4j", "message": str(e)}

async def check_clickhouse() -> dict:
    """Перевіряє з'єднання з ClickHouse."""
    # Для швидкості використовуємо базовий HTTP клієнт aiohttp або requests, якщо clickhouse-driver не встановлено
    try:
        import aiohttp
    except ImportError:
        return {"status": "fail", "component": "clickhouse", "message": "aiohttp is not installed"}
        
    url = os.getenv("CLICKHOUSE_HTTP_URL", "http://clickhouse:8123")
    logger.info("Перевірка підключення до ClickHouse")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{url}/ping", timeout=5.0) as resp:
                if resp.status == 200:
                    return {"status": "passed", "component": "clickhouse", "message": "Підключення успішне."}
                else:
                    return {"status": "fail", "component": "clickhouse", "message": f"HTTP {resp.status}"}
    except Exception as e:
        logger.error(f"Помилка ClickHouse: {e}")
        return {"status": "fail", "component": "clickhouse", "message": str(e)}

async def check_qdrant() -> dict:
    """Перевіряє з'єднання з Qdrant."""
    try:
        from qdrant_client import AsyncQdrantClient
    except ImportError:
        return {"status": "fail", "component": "qdrant", "message": "qdrant_client is not installed"}

    host = os.getenv("QDRANT_HOST", "qdrant")
    port = int(os.getenv("QDRANT_PORT", "6333"))
    logger.info("Перевірка підключення до Qdrant")
    try:
        client = AsyncQdrantClient(host=host, port=port, timeout=5.0)
        await client.get_collections()
        return {"status": "passed", "component": "qdrant", "message": "Підключення успішне."}
    except Exception as e:
        logger.error(f"Помилка Qdrant: {e}")
        return {"status": "fail", "component": "qdrant", "message": str(e)}
