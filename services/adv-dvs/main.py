"""
Головний модуль ADV-DVS
"""

import asyncio
import sys
import json
from datetime import datetime
import logging

from core.orchestrator import ValidationOrchestrator
from core.validator import DeploymentReport
from reports.generator import ReportGenerator


# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def main():
    """Головна функція"""
    deployment_id = f"deployment-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
    
    logger.info(f"Starting ADV-DVS for {deployment_id}")
    
    orchestrator = ValidationOrchestrator()
    report = await orchestrator.start_validation(deployment_id)
    
    # Генерація звітів
    report_generator = ReportGenerator(report)
    reports = report_generator.generate_all()
    
    logger.info(f"Generated reports: {', '.join([f'{k}: {v}' for k, v in reports.items() if v])}")
    
    logger.info(f"Deployment Readiness Index: {report.readiness_index:.2f}%")
    logger.info(f"Overall Status: {report.overall_status.value}")
    
    if report.readiness_index >= 95:
        logger.info("✅ PREDATOR Analytics повністю працездатна")
        sys.exit(0)
    elif report.readiness_index >= 70:
        logger.warning("⚠️ PREDATOR Analytics частково працездатна")
        sys.exit(1)
    else:
        logger.error("❌ PREDATOR Analytics не готова до експлуатації")
        sys.exit(2)


if __name__ == '__main__':
    asyncio.run(main())
