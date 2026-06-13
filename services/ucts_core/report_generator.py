import json
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

class ReportGenerator:
    def __init__(self, output_path: str = "SYSTEM_VERIFICATION_REPORT.json"):
        self.output_path = output_path
        
    def generate(self, report_data: Dict[str, Any]):
        """
        Генерує фінальний сертифікат SYSTEM_VERIFICATION_REPORT.json.
        """
        logger.info(f"Формування фінального звіту у {self.output_path}...")
        
        # Check overall success criteria
        is_production_ready = True
        
        # We need all stages to be SUCCESS or PASSED
        for stage, status in report_data.get("stages", {}).items():
            if status not in ["SUCCESS", "PASSED"]:
                is_production_ready = False
                break
                
        report_data["is_production_ready"] = is_production_ready
        
        try:
            with open(self.output_path, "w", encoding="utf-8") as f:
                json.dump(report_data, f, indent=4, ensure_ascii=False)
            logger.info("Звіт успішно згенеровано.")
            if is_production_ready:
                logger.info("=========================================")
                logger.info(" СИСТЕМА ГОТОВА ДО PRODUCTION (100%) ")
                logger.info("=========================================")
            else:
                logger.error("=========================================")
                logger.error(" СИСТЕМА НЕ ГОТОВА ДО PRODUCTION ")
                logger.error("=========================================")
        except Exception as e:
            logger.error(f"Помилка при генерації звіту: {e}")
