"""ADV DVS: Report Generator."""
from datetime import datetime
import json
from predator_common.logging import get_logger

logger = get_logger("adv_dvs.report")

class DVSReportGenerator:
    """Генератор звітів для Advanced Data Validation System."""

    def __init__(self):
        self.timestamp = datetime.utcnow().isoformat() + "Z"
        self.version = "61.0-ELITE"

    def generate(self, level: str, results: dict) -> dict:
        """Створює структурований звіт на основі результатів перевірки."""
        is_ready = results.get("status") == "PASSED"
        
        report = {
            "timestamp": self.timestamp,
            "version": self.version,
            "validation_level": level,
            "status": "GO" if is_ready else "NO-GO",
            "details": results.get("checks", []),
            "recommendations": self._generate_recommendations(results)
        }

        self._log_report(report)
        return report

    def _generate_recommendations(self, results: dict) -> list:
        recs = []
        checks = results.get("checks", [])
        
        for check in checks:
            if check.get("status") == "fail":
                comp = check.get("component", "unknown")
                msg = check.get("message", "No details")
                recs.append(f"КРИТИЧНО [{comp.upper()}]: {msg}. Вимагає негайного втручання.")
                
        if not recs:
            recs.append("Система готова до інгестії.")
            
        return recs

    def _log_report(self, report: dict):
        """Виводить відформатований лог звіту."""
        logger.info("=" * 50)
        logger.info(f"🛡️ ADV DVS REPORT [{report['validation_level']}]")
        logger.info(f"Статус: {report['status']}")
        logger.info(f"Час: {report['timestamp']}")
        logger.info("-" * 50)
        for detail in report["details"]:
            icon = "✅" if detail.get("status") == "passed" else "❌"
            comp = detail.get("component", "unknown").upper()
            msg = detail.get("message", "")
            logger.info(f"{icon} {comp}: {msg}")
        logger.info("-" * 50)
        for rec in report["recommendations"]:
            logger.info(f"💡 {rec}")
        logger.info("=" * 50)
