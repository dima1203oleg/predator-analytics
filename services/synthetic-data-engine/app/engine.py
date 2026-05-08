"""Оркестратор Synthetic Data Engine."""

import pandas as pd
from typing import Dict, Any, Optional
import asyncio
import structlog
import uuid

from app.config import config
from app.analyzer.dataset_profiler import DatasetProfiler
from app.generators.zero_shot import ZeroShotDomainGenerator
from app.generators.llm_generator import LLMSyntheticGenerator
from app.generators.statistical import GaussianCopulaGenerator, CTGANGenerator, TVAEGenerator
from app.trainers.auto_trainer import AutoTrainer
from app.trainers.quality_evaluator import SyntheticQualityEvaluator
from app.cards.card_generator import CardGenerator
from app.storage.versioned_store import VersionedDatasetStore

logger = structlog.get_logger("sde.engine")

class DatasetGeneratorTrainer:
    """Головний фасад модуля."""

    def __init__(self):
        self.store = VersionedDatasetStore(bucket_name=config.DATASET_BUCKET)
        
    def _get_generator(self, gen_type: str, gen_config: Dict[str, Any] = None):
        """Фабрика генераторів."""
        gen_type = gen_type.lower()
        if gen_type == "gaussiancopula":
            return GaussianCopulaGenerator(gen_config)
        elif gen_type == "ctgan":
            return CTGANGenerator(gen_config)
        elif gen_type == "tvae":
            return TVAEGenerator(gen_config)
        elif gen_type == "llm":
            return LLMSyntheticGenerator(gen_config)
        else:
            logger.warning(f"Unknown generator {gen_type}, fallback to GaussianCopula")
            return GaussianCopulaGenerator(gen_config)

    async def zero_shot(self, domain: str, num_rows: int, custom_schema: Dict[str, Any] = None) -> Dict[str, Any]:
        """Режим 1: Генерація з нуля."""
        logger.info(f"🚀 Запуск Zero-Shot пайплайну для домену: {domain}")
        
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        
        # 1. Генерація
        gen_config = {"custom_schema": custom_schema} if custom_schema else {}
        generator = ZeroShotDomainGenerator(domain, config=gen_config)
        synthetic_data = generator.sample(num_rows)
        
        # 2. Збереження
        dataset_name = f"zeroshot-{domain}-{job_id}"
        dataset_path = await self.store.save_dataset(dataset_name, synthetic_data)
        
        # 3. Data Card
        card = CardGenerator.generate_data_card(
            dataset_name=dataset_name,
            domain=domain,
            data=synthetic_data,
            generation_method="zero_shot_template",
            quality_metrics={"note": "Zero-shot, no real data to compare"}
        )
        card_path = await self.store.save_card(card)
        
        logger.info(f"✅ Zero-Shot завершено. Дані: {dataset_path}")
        return {
            "job_id": job_id,
            "status": "completed",
            "dataset_path": dataset_path,
            "card_path": card_path,
            "num_rows": len(synthetic_data)
        }

    async def reference_based(
        self, 
        real_data: pd.DataFrame, 
        num_rows: int, 
        force_generator: str = None
    ) -> Dict[str, Any]:
        """Режим 2: Генерація на основі існуючих даних."""
        logger.info("🚀 Запуск Reference-Based пайплайну")
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        
        # 1. Профілювання
        profile = DatasetProfiler.profile(real_data)
        
        # 2. Вибір генератора
        gen_type = force_generator or profile.get("recommended_generator", "GaussianCopula")
        
        if not config.ENABLE_SDV and gen_type in ["CTGAN", "TVAE", "GaussianCopula"]:
            logger.warning("SDV вимкнено в конфігурації. Fallback на LLM генератор.")
            gen_type = "llm"
            
        logger.info(f"Вибрано генератор: {gen_type}")
        generator = self._get_generator(gen_type)
        
        # 3. Навчання та генерація
        generator.fit(real_data)
        
        # Якщо це асинхронний генератор (LLM)
        if hasattr(generator, "sample_async"):
            synthetic_data = await generator.sample_async(num_rows)
        else:
            synthetic_data = generator.sample(num_rows)
            
        # 4. Оцінка якості
        quality_metrics = SyntheticQualityEvaluator.evaluate(real_data, synthetic_data)
        
        # 5. Збереження
        dataset_name = f"refbased-{job_id}"
        dataset_path = await self.store.save_dataset(dataset_name, synthetic_data)
        
        # 6. Data Card
        card = CardGenerator.generate_data_card(
            dataset_name=dataset_name,
            domain="custom",
            data=synthetic_data,
            generation_method=gen_type,
            quality_metrics=quality_metrics
        )
        card_path = await self.store.save_card(card)
        
        logger.info(f"✅ Reference-Based завершено. Дані: {dataset_path}")
        return {
            "job_id": job_id,
            "status": "completed",
            "generator_used": gen_type,
            "quality_score": quality_metrics.get("overall_score"),
            "dataset_path": dataset_path,
            "card_path": card_path
        }

    async def hybrid_pipeline(
        self,
        real_data: pd.DataFrame,
        target_column: str,
        synthetic_ratio: float = 1.0
    ) -> Dict[str, Any]:
        """Режим 3: Генерація + Тренування."""
        logger.info("🚀 Запуск Hybrid Training Pipeline")
        
        # 1. Генеруємо синтетику (пропорційно до ratio)
        num_synthetic = int(len(real_data) * synthetic_ratio)
        gen_result = await self.reference_based(real_data, num_synthetic)
        
        if gen_result["status"] != "completed":
            raise RuntimeError("Помилка генерації синтетичних даних")
            
        # У реальному коді тут було б завантаження з MinIO
        # synthetic_data = await self.store.load_dataset(gen_result["dataset_path"])
        # Але для поточного флоу ми знаємо що генератор вже навчений
        
        # Для спрощення припускаємо, що ми маємо дані в пам'яті (уникаємо MinIO MOCK)
        generator = self._get_generator(gen_result["generator_used"])
        generator.fit(real_data)
        if hasattr(generator, "sample_async"):
            synthetic_data = await generator.sample_async(num_synthetic)
        else:
            synthetic_data = generator.sample(num_synthetic)
            
        # 2. Комбінуємо дані
        combined_data = pd.concat([real_data, synthetic_data], ignore_index=True)
        logger.info(f"Створено комбінований датасет: {len(combined_data)} рядків")
        
        # 3. Навчання
        trainer = AutoTrainer(target_column=target_column)
        metrics = trainer.train(combined_data)
        
        # 4. Model Card
        model_name = f"hybrid-model-{uuid.uuid4().hex[:6]}"
        model_card = CardGenerator.generate_model_card(
            model_name=model_name,
            task_type=trainer.task_type,
            metrics=metrics,
            training_data_ref=gen_result["card_path"],
            hyperparameters={"model_class": trainer.model.__class__.__name__}
        )
        model_card_path = await self.store.save_card(model_card, is_model_card=True)
        
        logger.info(f"✅ Hybrid Pipeline завершено. Model Card: {model_card_path}")
        return {
            "status": "completed",
            "generation_result": gen_result,
            "metrics": metrics,
            "model_card_path": model_card_path
        }
