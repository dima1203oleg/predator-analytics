"""ADV DVS: Orchestrator."""
import asyncio
from predator_common.logging import get_logger
from services.adv_dvs.validators.level1_infra import run_level1_checks
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
        # Якщо в майбутньому будуть інші рівні, вони додаються тут.
        
        # Формування агрегованого звіту
        final_report = self.report_gen.generate("FULL-VALIDATION", {
            "status": l1_results.get("status"),
            "checks": l1_results.get("details", [])
        })
        
        return final_report

if __name__ == "__main__":
    orchestrator = ADVOrchestrator()
    asyncio.run(orchestrator.run_full_validation())
