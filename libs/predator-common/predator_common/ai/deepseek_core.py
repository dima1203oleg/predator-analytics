import os
import json
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import httpx

logger = logging.getLogger("deepseek_core")

# LiteLLM proxy URL for routing
LITELLM_URL = os.getenv("LITELLM_URL", "http://litellm:4000")

class DeepSeekMode:
    SYSTEM_BRAIN = "system_brain"
    DATASET_DESIGN = "dataset_design"
    MODEL_STRATEGY = "model_strategy"
    EXPLANATION = "explanation"

class CognitiveDecision(BaseModel):
    decision: str
    rationale: str
    confidence: float
    parameters: Dict[str, Any]

class DeepSeekCore:
    """
    Central Cognitive Orchestrator using DeepSeek R1.
    Handles decision making for datasets, models, and orchestration.
    """
    
    def __init__(self, model_name: str = "cognitive_core"):
        self.model_name = model_name
        self.api_url = f"{LITELLM_URL.rstrip('/')}/v1/chat/completions"
        self.headers = {"Content-Type": "application/json"}

    async def _invoke(self, system_prompt: str, user_prompt: str, temperature: float = 0.2) -> Dict[str, Any]:
        """Base invocation to the Cognitive Core via LiteLLM."""
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"}
        }
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=self.headers)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
            except Exception as e:
                logger.error(f"DeepSeek Core invocation failed: {e}")
                # Fallback format if error occurs to not break the pipeline
                return {
                    "decision": "ERROR",
                    "rationale": f"API Exception: {str(e)}",
                    "confidence": 0.0,
                    "parameters": {}
                }

    async def evaluate_drift(self, drift_metrics: Dict[str, Any]) -> CognitiveDecision:
        """System Brain Mode: Decide whether drift is concept, data, or noise."""
        system_prompt = (
            "You are the System Brain of PREDATOR Analytics. You analyze data/concept drift "
            "metrics and decide the retrain strategy. Return JSON with: decision (string: "
            "'FULL_RETRAIN', 'INCREMENTAL', 'PARTIAL', 'IGNORE'), rationale (string), "
            "confidence (float 0-1), and parameters (dict)."
        )
        user_prompt = f"Analyze the following drift metrics: {json.dumps(drift_metrics)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.1)
        return CognitiveDecision(**res)

    async def design_dataset(self, raw_metadata: Dict[str, Any]) -> CognitiveDecision:
        """Dataset Design Mode: Recommend features, balances, synthetic data."""
        system_prompt = (
            "You are the Dataset Architect. Analyze raw metadata and recommend dataset structure. "
            "Return JSON with: decision (string: dataset blueprint name), rationale (string), "
            "confidence (float), and parameters (dict containing feature_engineering, "
            "imbalance_strategy, synthetic_data_needs)."
        )
        user_prompt = f"Metadata: {json.dumps(raw_metadata)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.3)
        return CognitiveDecision(**res)

    async def strategy_optimizer(self, task_desc: Dict[str, Any]) -> CognitiveDecision:
        """Model Strategy Mode: Define search space, models, loss for AutoML."""
        system_prompt = (
            "You are the AI Meta-Optimizer. Define the AutoML strategy. "
            "Return JSON with: decision (model family e.g., 'tree-ensemble', 'neural'), "
            "rationale, confidence, parameters (search_space, loss_function, hyperparams)."
        )
        user_prompt = f"Task Description: {json.dumps(task_desc)}"
        res = await self._invoke(system_prompt, user_prompt, temperature=0.2)
        return CognitiveDecision(**res)

    async def explain_results(self, shap_values: Dict[str, Any], predictions: List[float]) -> str:
        """Explanation Mode: Human readable insights."""
        system_prompt = (
            "You are the Explainability Core. Convert SHAP values and predictions into a "
            "human-readable business insight. Focus on risk factors and recommendations."
        )
        user_prompt = json.dumps({"shap": shap_values, "predictions": predictions})
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.4
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
            except Exception as e:
                logger.error(f"Explanation failed: {e}")
                return "Explainability generation failed."
