"""ADV DVS: Level 3 Security Validator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.checks.security_check import check_env_secrets, check_network_encryption
from services.adv_dvs.report_generator import DVSReportGenerator

logger = get_logger("adv_dvs.validators.level3")

async def run_level3_checks() -> dict:
    """Виконує всі перевірки рівня 3 (Безпека)."""
    logger.info("Запуск ADV DVS: Валідація безпеки (Рівень 3)")
    
    results = {
        "status": "PASSED",
        "checks": []
    }
    
    secrets_res = await check_env_secrets()
    results["checks"].append(secrets_res)
    
    network_res = await check_network_encryption()
    results["checks"].append(network_res)
    
    # Перевірка загального статусу
    for check in results["checks"]:
        if check["status"] == "fail":
            results["status"] = "FAILED"
            break
            
    if results["status"] == "PASSED":
        logger.info("✅ Всі перевірки безпеки успішно пройдено.")
    else:
        logger.error("🔴 Виявлено критичні проблеми безпеки (NO-GO).")
        
    report_gen = DVSReportGenerator()
    final_report = report_gen.generate("LEVEL-3-SECURITY", results)
    
    return final_report

if __name__ == "__main__":
    asyncio.run(run_level3_checks())
