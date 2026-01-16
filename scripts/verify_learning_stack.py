
import asyncio
import sys
import os
import json
import logging

# Setup Path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../services")))

from orchestrator.agents.training_manager import TrainingManager
from ml_core.quality_scorer import DatasetQualityScorer
from ml_core.evaluator import ModelEvaluator
from ml_core.immunity import ImmunityMemory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VERIFIER")

async def verify_stack():
    logger.info("🚀 Starting Learning Stack Verification...")

    # 1. Check Files
    seeds_path = "data/seeds/analytic_scenarios_100.md"
    if os.path.exists(seeds_path):
        logger.info(f"✅ Seeds found: {seeds_path}")
    else:
        logger.error(f"❌ Seeds MISSING: {seeds_path}")
        return

    # 2. Test TrainingManager Scenario Parsing
    manager = TrainingManager()
    scenarios = manager._parse_seed_scenarios()
    if scenarios and len(scenarios) > 0:
        logger.info(f"✅ TrainingManager parsed {len(scenarios)} scenarios.")
        # logger.info(f"Sample: {scenarios[0]['title']}")
    else:
        logger.error("❌ TrainingManager failed to parse scenarios.")
        return

    # 3. Test Quality Scorer
    scorer = DatasetQualityScorer()
    sample_data = [
        {"item": "val1", "price": 100, "code": "ABC"},
        {"item": "val2", "price": 200, "code": "DEF"},
        {"item": "val3", "price": 300, "code": "GHI"}
    ]
    report = await scorer.evaluate_dataset(sample_data)
    if report.get("size") == 3:
        logger.info(f"✅ QualityScorer operational. Diversity: {report['diversity']}")
    else:
        logger.error("❌ QualityScorer failed evaluation.")

    # 4. Test Immunity Memory
    immunity = ImmunityMemory(memory_path="data/test/immunity.jsonl")
    immunity.record_failure("TestError", {"ctx": "test"}, "Correction suggested")
    if os.path.exists("data/test/immunity.jsonl"):
        logger.info("✅ ImmunityMemory recorded test antigen.")
        os.remove("data/test/immunity.jsonl")
    else:
        logger.error("❌ ImmunityMemory failed to record.")

    # 5. Test Model Evaluator
    evaluator = ModelEvaluator(golden_set_path="data/test/gold.jsonl")
    # Mock golden set
    os.makedirs("data/test", exist_ok=True)
    with open("data/test/gold.jsonl", "w") as f:
        f.write(json.dumps({"input": "test", "expected_label": "suspicious"}) + "\n")

    benchmark = await evaluator.run_benchmark("test-model-v1")
    if benchmark.get("status") == "passed" or benchmark.get("status") == "failed":
        logger.info(f"✅ ModelEvaluator operational. F1: {benchmark['metrics']['f1_score']}")
        os.remove("data/test/gold.jsonl")
    else:
        logger.error("❌ ModelEvaluator failed.")

    logger.info("🏁 LEARNING STACK VERIFICATION COMPLETED SUCCESSFULLY.")

if __name__ == "__main__":
    asyncio.run(verify_stack())
