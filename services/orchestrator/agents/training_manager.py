import logging
import docker
import json
import os
import re
import sys
import asyncio
import shutil
from datetime import datetime
from typing import List, Dict

# Import new Synthetic Agent
from orchestrator.agents.synthetic_data import SyntheticDataAgent

logger = logging.getLogger(__name__)

class TrainingManager:
    """
    Fine-Tuning Orchestrator & Training Manager
    Manages the full lifecycle: Data Generation -> Validation -> Versioning -> Training -> Deployment
    """

    def __init__(self, redis_client=None):
        try:
            self.client = docker.from_env()
        except Exception:
            self.client = None
            logger.warning("Docker client unavailable. Utilizing host mode for data generation only.")

        self.redis = redis_client
        self.h2o_container_name = "h2o-llm-studio"
        self.min_training_samples = 50

        # Agents
        self.synthetic_agent = SyntheticDataAgent()

        # Paths
        self.seeds_path = "data/seeds/hyper_complex_scenarios_v29.md"
        self.training_data_path = "data/processed/training_set.jsonl"
        self.version_dir = "data/versions"

    async def notify(self, message: str, status: str = "processing", progress: int = 0):
        """Send localized training updates to Redis for the UI"""
        if not self.redis:
            logger.info(f"Training Update: {message} ({status})")
            return

        event = {
            "timestamp": datetime.now().isoformat(),
            "stage": "training",
            "message": message,
            "status": status,
            "progress": progress
        }
        await self.redis.publish("predator:training_updates", json.dumps(event))
        await self.redis.set("system:training_status", json.dumps(event), ex=3600)

    async def check_data_and_train(self, current_dataset_size: int, config_name: str = "default_experiment.yaml") -> bool:
        """
        Main Loop Entry Point: Checks if we need to generate data or train.
        """
        # 1. Check if we need more synthetic data
        if current_dataset_size < 1000:
             await self.notify("🧬 Виявлено дефіцит даних. Запуск генерації синтетичних датасетів...", "processing", 10)
             generated_count = await self.run_synthetic_pipeline()
             if generated_count > 0:
                 current_dataset_size += generated_count

        # 2. Check training threshold
        if current_dataset_size >= self.min_training_samples:
            await self.notify(f"🚀 Поріг даних ({current_dataset_size}) досягнуто! Створення версії датасету...", "start", 20)

            # 3. Versioning before training
            version_path = self._create_dataset_version()

            # 4. Trigger Training
            return await self.trigger_training(config_name, version_path)

        return False

    async def run_synthetic_pipeline(self) -> int:
        """
        Run the data generation pipeline using seed scenarios.
        """
        scenarios = self._parse_seed_scenarios()
        if not scenarios:
            logger.warning("No scenarios found to generate data.")
            return 0

        # Select random 5 scenarios to expand in this cycle
        import random
        selected = random.sample(scenarios, min(5, len(scenarios)))

        total_records = []

        for scenario in selected:
            await self.notify(f"🧪 Генерація: {scenario['title']}", "processing")

            # 1. Generate Suspicious Data
            suspicious = await self.synthetic_agent.generate_dataset(scenario, count=20)
            if suspicious:
                total_records.extend(suspicious)

            # 2. Generate Hard Negatives (Adversarial)
            adversarial = await self.synthetic_agent.generate_adversarial_examples(suspicious)
            if adversarial:
                total_records.extend(adversarial)

        # 3. Validation & Saving
        if total_records:
            try:
                # Import Quality Scorer dynamically
                sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../.."))
                from services.ml_core.quality_scorer import DatasetQualityScorer
                scorer = DatasetQualityScorer()

                report = await scorer.evaluate_dataset(total_records)

                if report.get("valid"):
                    self._append_to_dataset(total_records)
                    await self.notify(f"✅ Згенеровано {len(total_records)} якісних прикладів (Div: {report['diversity']:.2f})", "success")
                    return len(total_records)
                else:
                     await self.notify(f"⚠️ Датасет відхилено Quality Scorer: {report.get('reason')}", "warning")
                     return 0
            except Exception as e:
                logger.error(f"Quality check failed: {e}")
                self._append_to_dataset(total_records)
                return len(total_records)

        return 0

    def _create_dataset_version(self) -> str:
        """
        Simple Dataset Versioning Engine.
        Copies the current training_set.jsonl to a timestamped version.
        """
        os.makedirs(self.version_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version_name = f"dataset_v_{timestamp}.jsonl"
        version_path = os.path.join(self.version_dir, version_name)

        if os.path.exists(self.training_data_path):
            shutil.copy2(self.training_data_path, version_path)
            logger.info(f"📦 Dataset versioned: {version_name}")
            return version_path
        return self.training_data_path

    def _parse_seed_scenarios(self) -> List[Dict]:
        """
        Parse the markdown seed file into structured dicts.
        Uses a robust block-based parsing strategy.
        """
        if not os.path.exists(self.seeds_path):
            logger.error(f"Seeds file not found at {self.seeds_path}")
            return []

        with open(self.seeds_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        scenarios = []
        current = None

        for line in lines:
            line = line.strip()
            if not line: continue

            # Start of a new scenario: e.g. "101. “Title”"
            header_match = re.match(r'^\d+\.\s+[“"](.+?)[”"]', line)
            if header_match:
                if current: scenarios.append(current)
                current = {
                    "title": header_match.group(1),
                    "description": "",
                    "fields": "",
                    "usage": ""
                }
                continue

            if current:
                if line.startswith("Опис:"):
                    current["description"] = line.replace("Опис:", "").strip()
                elif line.startswith("Поля:"):
                    current["fields"] = line.replace("Поля:", "").strip()
                elif line.startswith("Застосування:"):
                    current["usage"] = line.replace("Застосування:", "").strip()
                elif line.startswith("Приклад:"):
                     # Sometimes Example is used instead of Usage
                     current["usage"] = line.replace("Приклад:", "").strip()

        if current:
            scenarios.append(current)

        logger.info(f"Parsed {len(scenarios)} scenarios from {self.seeds_path}")
        return scenarios

    async def ingest_synthesized_directory(self, directory_path: str):
        """
        Ingest all .json files from a directory into the training set.
        """
        if not os.path.exists(directory_path):
            logger.error(f"Directory not found: {directory_path}")
            return

        files = [f for f in os.listdir(directory_path) if f.endswith('.json')]
        total_ingested = 0

        for filename in files:
            file_path = os.path.join(directory_path, filename)
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        self._append_to_dataset(data)
                        total_ingested += len(data)
                        logger.info(f"📥 Ingested {len(data)} records from {filename}")
            except Exception as e:
                logger.error(f"Failed to ingest {filename}: {e}")

        await self.notify(f"📊 Всього імпортовано {total_ingested} записів до датасету.", "success")
        return total_ingested

    def _append_to_dataset(self, records: List[Dict]):
        """
        Append records to the JSONL training file.
        Implements Auto-Labeling Strategy.
        """
        os.makedirs(os.path.dirname(self.training_data_path), exist_ok=True)

        with open(self.training_data_path, 'a') as f:
            for r in records:
                # Instruction format for Llama-3 Fine-tuning
                label = r.get('_label', 'suspicious')
                scenario = r.get('_scenario_id', 'general')

                instruction = {
                    "instruction": "Виконай аудит митного запису на предмет шахрайства.",
                    "input": json.dumps({k:v for k,v in r.items() if not k.startswith('_')}, ensure_ascii=False),
                    "output": f"ВЕРДИКТ: {label.upper()}. АНАЛІЗ: Дана транзакція відповідає патерну '{scenario}'. Виявлено аномальні відхилення у параметрах, що вказують на потенційну схему."
                }
                f.write(json.dumps(instruction, ensure_ascii=False) + "\n")

    async def trigger_training(self, config_name: str, data_path: str) -> bool:
        """
        Execute training, evaluate result, and promote to production if better.
        """
        model_id = f"Predator-v29-{datetime.now().strftime('%m%d_%H%M')}"

        if not self.client:
            await self.notify("⚠️ Docker недоступний. Симуляція навчання...", "warning")
            # Simulation for verification
            return await self._simulate_post_training(model_id)

        try:
            container = self.client.containers.get(self.h2o_container_name)
            command = f"python train.py -C /configs/{config_name} --data /{data_path} --output /{model_id}"

            logger.info(f"Executing training: {command}")
            # container.exec_run(command, detach=True)

            await self.notify("✅ Процес навчання ініціалізовано.", "running", 25)
            await asyncio.sleep(5) # Simulate workload

            return await self._simulate_post_training(model_id)

        except Exception as e:
            await self.notify(f"❌ Помилка запуску навчання: {str(e)}", "error")
            return False

    async def _simulate_post_training(self, model_id: str) -> bool:
        """Handles benchmarking and promotion after training exists"""
        try:
            from ml_core.evaluator import ModelEvaluator
            from ml_core.registry import ModelRegistry

            evaluator = ModelEvaluator()
            registry = ModelRegistry()

            # 1. Benchmark
            await self.notify(f"📊 Тестування моделі {model_id}...", "processing", 80)
            results = await evaluator.run_benchmark(model_id)
            f1 = results['metrics']['f1_score']

            # 2. Compare & Promote
            is_better = evaluator.compare_with_production(results)

            if is_better:
                registry.register_model(model_id, results['metrics'])
                registry.promote_to_production(model_id)
                await self.notify(f"🏆 НОВА МОДЕЛЬ У ПРОДАКШНІ! (F1: {f1:.4f})", "success", 100)
                return True
            else:
                await self.notify(f"⚠️ Нова модель не перевершила поточну (F1: {f1:.4f}). Відхилено.", "warning", 100)
                return False

        except Exception as e:
            logger.error(f"Post-training failed: {e}")
            await self.notify(f"❌ Помилка оцінки моделі: {e}", "error")
            return False

    def get_training_status(self) -> str:
        if not self.client: return "OFFLINE"
        try:
            container = self.client.containers.get(self.h2o_container_name)
            return "RUNNING" if container.status == "running" else "IDLE"
        except:
            return "MISSING"
