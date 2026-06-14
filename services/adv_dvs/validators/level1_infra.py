"""ADV DVS: Level 1 Infrastructure Validator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.checks.kafka_check import check_kafka_connection

logger = get_logger("adv_dvs.validators.level1")

async def run_level1_checks() -> dict:
    """Виконує всі перевірки рівня 1 (Інфраструктура)."""
    logger.info("Запуск ADV DVS: Валідація інфраструктури (Рівень 1)")
    
    results = {
        "status": "PASSED",
        "checks": []
    }
    
    # 1. Kafka Check
    kafka_result = await check_kafka_connection()
    results["checks"].append(kafka_result)
    
    if kafka_result["status"] == "fail":
        results["status"] = "FAILED"
        
    # TODO: Add PostgreSQL, ClickHouse, Qdrant, OpenSearch, MinIO, Neo4j checks
    
    if results["status"] == "PASSED":
        logger.info("✅ Всі інфраструктурні перевірки успішно пройдено.")
    else:
        logger.error("🔴 Деякі інфраструктурні перевірки не пройдено.")
        
    return results

if __name__ == "__main__":
    asyncio.run(run_level1_checks())
