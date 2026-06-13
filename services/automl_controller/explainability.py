import logging
import sys
from typing import Dict, Any, List

sys.path.append("/Users/Shared/Predator_60/libs/predator-common")
from predator_common.ai.deepseek_core import DeepSeekCore

logger = logging.getLogger("automl_explainability")

class ExplainabilityLayer:
    """
    AI Explainability Layer for AutoML.
    Translates SHAP/LIME values into human-readable business insights using DeepSeek R1.
    """
    
    def __init__(self):
        self.brain = DeepSeekCore(model_name="cognitive_core")

    async def generate_human_explanation(self, shap_values: Dict[str, Any], predictions: List[float]) -> str:
        """
        Takes raw SHAP values and model predictions and converts them into a narrative.
        """
        logger.info("Generating AI Explainability using DeepSeek R1...")
        explanation = await self.brain.explain_results(shap_values, predictions)
        return explanation
