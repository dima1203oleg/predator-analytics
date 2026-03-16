"""RET Cycle Engine — Cerebro v55.2.
Логіка перенавчання та оцінки моделей.
"""
import logging
import os
from typing import Any

import httpx

logger = logging.getLogger("cerebro.ret_logic")

TRAINING_URL = os.getenv("TRAINING_CONTROLLER_URL", "http://training-controller:8000")
VALIDATION_URL = os.getenv("VALIDATION_CONTROLLER_URL", "http://validation-controller:8000")
AUTOML_URL = os.getenv("AUTOML_CONTROLLER_URL", "http://automl-controller:8000")
MCP_URL = os.getenv("MCP_ROUTER_URL", "http://mcp-router:8080/v1/query")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8080/api/v1")

class RETEngine:
    @staticmethod
    async def execute(model_id: str, tenant_id: str, context: dict[str, Any]):
        """Повний цикл RET (Retry-Eval-Train) v55.2 з Sovereign Analysis.
        """
        logger.info(f"🚀 [RET_START] Модель: {model_id} | Тенант: {tenant_id}")

        async with httpx.AsyncClient(timeout=300.0) as client:
            # 0. OVERSIGHT phase (SOM Feedback)
            try:
                logger.info("🔭 [OVERSIGHT] Перевірка системних аномалій через SOM...")
                som_resp = await client.get(f"{CORE_API_URL}/som/anomalies")
                if som_resp.status_code == 200:
                    anomalies = som_resp.json()
                    for anomaly in anomalies:
                        if anomaly.get("type") == "DRIFT" and anomaly.get("severity") in ["medium", "high"]:
                            logger.warning(f"🚨 [SOM_ALERT] Виявлено критичний дрифт! Примусове AUTOML. Карта: {anomaly}")
                            context["force_automl"] = True
                            context["som_anomaly"] = anomaly
            except Exception as e:
                logger.warning(f"⚠️ [OVERSIGHT_FAILED] Не вдалося зв'язатися з SOM: {e!s}")

            # 1. ANALYSIS phase (Sovereign Advisor)
            try:
                drift = context.get("drift", 0.0)
                logger.info(f"🧠 [ANALYSIS] Запит до Sovereign Advisor для пояснення дрифту {drift}...")

                analysis_resp = await client.post(
                    MCP_URL,
                    json={
                        "prompt": f"Проаналізуй причини деградації моделі {model_id}. Дрифт: {drift}. Метрики: {context.get('metrics')}",
                        "task_type": "reasoning",
                        "context": context
                    }
                )
                if analysis_resp.status_code == 200:
                    insight = analysis_resp.json().get("content", "Немає інсайтів")
                    logger.info(f"💡 [INSIGHT] Advisor: {insight[:100]}...")
                    context["advisor_insight"] = insight
            except Exception as e:
                logger.warning(f"⚠️ [ANALYSIS_FAILED] Sovereign Advisor недоступний: {e!s}")

            # 2. RETRY / EXECUTION loop
            for attempt in range(2):
                try:
                    # EVALUATION & STRATEGY
                    drift = context.get("drift", 0.0)
                    force_automl = context.get("force_automl", False)
                    strategy = "AUTOML" if drift > 0.15 or force_automl else "FINETUNE"
                    logger.info(f"📋 [EVAL] Attempt {attempt+1}. Стратегія: {strategy} (Force: {force_automl})")

                    # TRAINING phase
                    train_endpoint = "/train" if strategy == "FINETUNE" else "/automl/run"
                    target_url = TRAINING_URL if strategy == "FINETUNE" else AUTOML_URL

                    train_resp = await client.post(
                        f"{target_url}{train_endpoint}",
                        json={"model_id": model_id, "context": context, "tenant_id": tenant_id}
                    )
                    train_resp.raise_for_status()
                    train_data = train_resp.json()

                    # VALIDATION phase
                    logger.info("🔍 [VALIDATE] Верифікація нового кандидата...")
                    val_resp = await client.post(
                        f"{VALIDATION_URL}/compare",
                        json={
                            "model_id": model_id,
                            "challenger_model_id": train_data.get("new_model_id"),
                            "metrics": context.get("metrics", {})
                        }
                    )
                    val_resp.raise_for_status()

                    logger.info(f"✅ [RET_SUCCESS] Модель {model_id} оновлена на спробі {attempt+1}.")
                    return True

                except Exception as e:
                    logger.error(f"❌ [RET_ATTEMPT_FAILED] Спроба {attempt+1} невдала: {e!s}")
                    if attempt == 1: break # Final attempt failed

            return False
