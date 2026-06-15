"""ADV DVS: Orchestrator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.validators.level1_infra import run_level1_checks
from services.adv_dvs.validators.level2_data import run_level2_checks
from services.adv_dvs.validators.level3_security import run_level3_checks
from services.adv_dvs.report_generator import DVSReportGenerator

logger = get_logger("adv_dvs.orchestrator")

class ADVOrchestrator:
    """Головний оркестратор Advanced Data Validation System."""
    
    def __init__(self):
        self.report_gen = DVSReportGenerator()

    async def run_full_validation(self) -> dict:
        """Запускає повний цикл перевірок усіх рівнів."""
        logger.info("⚡ Запуск ADV DVS Orchestrator...")
        
        # Рівень 1: Інфраструктура
        l1_results = await run_level1_checks()
        
        # Якщо інфраструктура в нормі, запускаємо Рівень 2: Якість даних
        all_checks = l1_results.get("details", [])
        status = l1_results.get("status")
        
        if status == "GO":
            l2_results = await run_level2_checks()
            all_checks.extend(l2_results.get("details", []))
            if l2_results.get("status") != "GO":
                status = "NO-GO"
                
        # Рівень 3: Безпека
        if status == "GO":
            l3_results = await run_level3_checks()
            all_checks.extend(l3_results.get("details", []))
            if l3_results.get("status") != "GO":
                status = "NO-GO"
        
        # Формування агрегованого звіту
        final_report = self.report_gen.generate("FULL-VALIDATION", {
            "status": "PASSED" if status == "GO" else "FAILED",
            "checks": all_checks
        })
        
        return final_report

if __name__ == "__main__":
    orchestrator = ADVOrchestrator()
    asyncio.run(orchestrator.run_full_validation())
