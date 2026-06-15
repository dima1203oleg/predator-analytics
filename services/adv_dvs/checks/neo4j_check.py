"""ADV DVS: Neo4j Check."""
import os
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.checks.neo4j")

async def check_neo4j() -> dict:
    """
    Перевіряє з'єднання з Neo4j.
    Neo4j використовується для графових зв'язків та виявлення прихованих залежностей.
    """
    try:
        from neo4j import GraphDatabase
    except ImportError:
        return {"status": "fail", "component": "neo4j", "message": "neo4j is not installed"}

    uri = os.getenv("NEO4J_URI", "bolt://neo4j:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    
    logger.info("Перевірка підключення до Neo4j (Graph Nexus)")
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        driver.close()
        return {"status": "passed", "component": "neo4j", "message": "Підключення успішне. Графовий рушій доступний."}
    except Exception as e:
        logger.error(f"Помилка Neo4j: {e}")
        return {"status": "fail", "component": "neo4j", "message": str(e)}
