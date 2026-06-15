"""ADV DVS: Level 2 Data Quality Validator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.checks.data_quality import check_pg_seed_data, check_clickhouse_tables
from services.adv_dvs.report_generator import DVSReportGenerator

logger = get_logger("adv_dvs.validators.level2")

async def run_level2_checks() -> dict:
    """Виконує всі перевірки рівня 2 (Якість Даних)."""
    logger.info("Запуск ADV DVS: Валідація якості даних (Рівень 2)")
    
    results = {
        "status": "PASSED",
        "checks": []
    }
    
    pg_seed = await check_pg_seed_data()
    results["checks"].append(pg_seed)
    
    ch_tables = await check_clickhouse_tables()
    results["checks"].append(ch_tables)
    
    # Перевірка загального статусу
    for check in results["checks"]:
        if check["status"] == "fail":
            results["status"] = "FAILED"
            break
            
    if results["status"] == "PASSED":
        logger.info("✅ Всі перевірки якості даних успішно пройдено.")
    else:
        logger.error("🔴 Деякі перевірки якості даних не пройдено. Можлива відсутність базових довідників.")
        
    # Генерація та збереження звіту
    report_gen = DVSReportGenerator()
    final_report = report_gen.generate("LEVEL-2-DATA-QUALITY", results)
    
    return final_report

if __name__ == "__main__":
    asyncio.run(run_level2_checks())
