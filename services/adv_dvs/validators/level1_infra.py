"""ADV DVS: Level 1 Infrastructure Validator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.checks.kafka_check import check_kafka_connection
from services.adv_dvs.checks.db_check import check_postgres, check_neo4j, check_clickhouse, check_qdrant
from services.adv_dvs.checks.opensearch_check import check_opensearch
from services.adv_dvs.report_generator import DVSReportGenerator

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
    
    # 2. DB Checks
    pg_result = await check_postgres()
    results["checks"].append(pg_result)
    
    neo4j_result = await check_neo4j()
    results["checks"].append(neo4j_result)
    
    clickhouse_result = await check_clickhouse()
    results["checks"].append(clickhouse_result)
    
    qdrant_result = await check_qdrant()
    results["checks"].append(qdrant_result)
    
    os_result = await check_opensearch()
    results["checks"].append(os_result)
    
    # Перевірка загального статусу
    for check in results["checks"]:
        if check["status"] == "fail":
            results["status"] = "FAILED"
            break
            
    if results["status"] == "PASSED":
        logger.info("✅ Всі інфраструктурні перевірки успішно пройдено.")
    else:
        logger.error("🔴 Деякі інфраструктурні перевірки не пройдено.")
        
    # Генерація та збереження звіту
    report_gen = DVSReportGenerator()
    final_report = report_gen.generate("LEVEL-1-INFRA", results)
    
    return final_report

if __name__ == "__main__":
    asyncio.run(run_level1_checks())
