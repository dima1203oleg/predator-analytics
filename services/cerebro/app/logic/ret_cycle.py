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
MCP_URL = os.getenv("MCP_ROUTER_URL", "http://mcp-router:8080/v1/query")

class RETEngine:
    @staticmethod
    async def execute(model_id: str, tenant_id: str, context: Dict[str, Any]):
        """
        Повний цикл RET (Retry-Eval-Train) v55.2 з Sovereign Analysis.
        """
        logger.info(f"🚀 [RET_START] Модель: {model_id} | Тенант: {tenant_id}")
        
        async with httpx.AsyncClient(timeout=300.0) as client:
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
                logger.warning(f"⚠️ [ANALYSIS_FAILED] Sovereign Advisor недоступний: {str(e)}")

            # 2. RETRY / EXECUTION loop
            for attempt in range(2):
                try:
                    # EVALUATION & STRATEGY
                    strategy = "AUTOML" if drift > 0.15 else "FINETUNE"
                    logger.info(f"📋 [EVAL] Attempt {attempt+1}. Стратегія: {strategy}")
                    
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
                    logger.error(f"❌ [RET_ATTEMPT_FAILED] Спроба {attempt+1} невдала: {str(e)}")
                    if attempt == 1: break # Final attempt failed
            
            return False
