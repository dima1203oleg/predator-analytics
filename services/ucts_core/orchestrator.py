import argparse
import asyncio
import logging
import time
from pathlib import Path
from typing import Dict, Any

from .graph_builder import DigitalSystemGraph
from .data_consistency import DataConsistencyEngine
from .dom_validator import DomValidator
from .ai_tester import AITester
from .chaos_engine import ChaosEngine
from .report_generator import ReportGenerator

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("UCTS_ORCHESTRATOR")

class UCTSOrchestrator:
    def __init__(self, target_file: str):
        self.target_file = target_file
        self.graph = DigitalSystemGraph()
        self.report_data: Dict[str, Any] = {
            "start_time": time.time(),
            "target_file": target_file,
            "status": "INITIALIZED",
            "stages": {}
        }
        
        self.data_consistency = DataConsistencyEngine()
        self.dom_validator = DomValidator()
        self.ai_tester = AITester()
        self.chaos_engine = ChaosEngine()
        self.report_generator = ReportGenerator()

    async def run_all(self):
        logger.info(f"Запуск UCTS v1.0 E2E Тестування для файлу: {self.target_file}")
        
        # 1. Побудова початкового графа
        logger.info("--- 1. BUILDING DIGITAL SYSTEM GRAPH ---")
        self.graph.build_initial_graph()
        self.report_data["stages"]["graph_build"] = "SUCCESS"
        self.report_data["graph_snapshot"] = self.graph.get_snapshot()
        
        # 2. Інгестія та перевірка даних
        logger.info("--- 2. DATA INGESTION & CONSISTENCY CHECK ---")
        await self._run_data_consistency()
        
        # 3. DOM Validator
        logger.info("--- 3. DOM & UI INTELLIGENCE ---")
        await self._run_dom_validation()
        
        # 4. AI/ML Testing
        logger.info("--- 4. AI/ML TESTING LAYER ---")
        await self._run_ai_testing()
        
        # 5. Chaos Engineering
        logger.info("--- 5. CHAOS ENGINEERING ---")
        await self._run_chaos_testing()
        
        # 6. Фінальний звіт
        logger.info("--- 6. GENERATING VERIFICATION REPORT ---")
        await self._generate_report()
        
        self.report_data["end_time"] = time.time()
        self.report_data["status"] = "COMPLETED"
        logger.info("UCTS v1.0 тестування завершено.")

    async def _run_data_consistency(self):
        ingest_success = await self.data_consistency.run_ingestion(self.target_file)
        if not ingest_success:
            self.report_data["stages"]["data_consistency"] = "FAILED_INGESTION"
            return
            
        db_results = await self.data_consistency.verify_databases()
        self.report_data["db_integrity_map"] = db_results
        if all(db_results.values()):
            self.report_data["stages"]["data_consistency"] = "SUCCESS"
        else:
            self.report_data["stages"]["data_consistency"] = "FAILED_DB_CHECK"

    async def _run_dom_validation(self):
        dom_results = await self.dom_validator.validate_truth()
        self.report_data["dom_validation"] = dom_results
        if all(dom_results.values()):
            self.report_data["stages"]["dom_validation"] = "SUCCESS"
        else:
            self.report_data["stages"]["dom_validation"] = "FAILED"

    async def _run_ai_testing(self):
        ai_results = await self.ai_tester.evaluate_model()
        self.report_data["ai_validation_score"] = ai_results
        self.report_data["stages"]["ai_testing"] = ai_results["status"]

    async def _run_chaos_testing(self):
        chaos_results = await self.chaos_engine.run_simulation()
        self.report_data["chaos_resilience_score"] = chaos_results
        self.report_data["stages"]["chaos_testing"] = chaos_results["status"]

    async def _generate_report(self):
        self.report_generator.generate(self.report_data)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PREDATOR UCTS v1.0 Orchestrator")
    parser.add_argument("--target", type=str, required=True, help="Шлях до Excel файлу для тестування")
    args = parser.parse_args()
    
    target_path = Path(args.target)
    if not target_path.exists():
        logger.error(f"Файл не знайдено: {args.target}")
        exit(1)
        
    orchestrator = UCTSOrchestrator(args.target)
    asyncio.run(orchestrator.run_all())
