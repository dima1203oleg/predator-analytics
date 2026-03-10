"""
RET Cycle Engine — Cerebro v55.2.
Логіка перенавчання та оцінки моделей.
"""
from typing import Dict, Any
import httpx
import os
import logging

logger = logging.getLogger("cerebro.ret_logic")

TRAINING_URL = os.getenv("TRAINING_CONTROLLER_URL", "http://training-controller:8000")
VALIDATION_URL = os.getenv("VALIDATION_CONTROLLER_URL", "http://validation-controller:8000")
AUTOML_URL = os.getenv("AUTOML_CONTROLLER_URL", "http://automl-controller:8000")

class RETEngine:
    @staticmethod
    async def execute(model_id: str, tenant_id: str, context: Dict[str, Any]):
        """
        Повний цикл RET (Retry-Eval-Train) v55.2.
        Синхронізує роботу Training та Validation контролерів.
        """
        logger.info(f"🚀 [RET_START] Модель: {model_id} | Тенант: {tenant_id}")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
            try:
                # 1. EVALUATION phase
                drift = context.get("drift", 0.0)
                strategy = "AUTOML" if drift > 0.15 else "FINETUNE"
                
                logger.info(f"📋 [EVAL] Дрифт: {drift:.4f}. Вибрана стратегія: {strategy}")
                
                # 2. TRAINING phase
                train_endpoint = "/train" if strategy == "FINETUNE" else "/automl/run"
                target_url = TRAINING_URL if strategy == "FINETUNE" else AUTOML_URL
                
                logger.info(f"⚙️ [TRAIN] Запуск фази навчання через {target_url}{train_endpoint}")
                train_resp = await client.post(
                    f"{target_url}{train_endpoint}",
                    json={"model_id": model_id, "context": context, "tenant_id": tenant_id}
                )
                train_resp.raise_for_status()
                train_data = train_resp.json()
                
                # 3. VALIDATION phase
                logger.info("🔍 [VALIDATE] Початок фази верифікації (Champion vs Challenger)...")
                val_resp = await client.post(
                    f"{VALIDATION_URL}/compare",
                    json={
                        "model_id": model_id,
                        "challenger_model_id": train_data.get("new_model_id"),
                        "metrics": context.get("metrics", {})
                    }
                )
                val_resp.raise_for_status()
                
                logger.info(f"✅ [RET_SUCCESS] Модель {model_id} успішно оновлена.")
                return True
                
            except httpx.HTTPError as e:
                logger.error(f"❌ [RET_FAILED] Помилка мережі при взаємодії з контролерами: {str(e)}")
                return False
            except Exception as e:
                logger.error(f"❌ [RET_CRITICAL] Критична помилка циклу RET: {str(e)}")
                return False
