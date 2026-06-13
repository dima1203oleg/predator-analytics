import logging
import sys
from typing import Dict, Any, List

sys.path.append("/Users/Shared/Predator_60/libs/predator-common")
from predator_common.ai.deepseek_core import DeepSeekCore

logger = logging.getLogger("safety_ai")

class SafetyAI:
    """
    Safety + Governance AI Layer.
    Uses DeepSeek R1 to detect PII, check hallucinations, and prevent data leakage.
    """
    def __init__(self):
        self.brain = DeepSeekCore(model_name="cognitive_core")

    async def check_pii(self, sample_data: List[Dict[str, Any]]) -> bool:
        """
        Checks a data sample for exposed Personally Identifiable Information (PII).
        """
        prompt = (
            "Analyze the following data sample for exposed PII (names, emails, exact locations, "
            "financial details). Ignore anonymized or hashed IDs. "
            "Return JSON with 'has_pii' (boolean) and 'detected_fields' (list of strings)."
        )
        
        res = await self.brain._invoke(
            system_prompt="You are the PREDATOR Safety AI. Protect privacy strictly.",
            user_prompt=f"{prompt}\nData: {sample_data}",
            temperature=0.0
        )
        
        has_pii = res.get("has_pii", True) # Default to True to be safe on failure
        if has_pii:
            logger.warning(f"PII Detected in fields: {res.get('detected_fields')}")
        return has_pii

    async def detect_hallucination(self, prompt: str, ai_response: str, db_context: str) -> bool:
        """
        Checks if an LLM-generated explanation contains hallucinations not grounded in db_context.
        """
        eval_prompt = (
            "Evaluate if the 'ai_response' contains any hallucinations, facts, or claims "
            "that are NOT supported by the 'db_context'. "
            "Return JSON with 'is_hallucination' (boolean) and 'reason' (string)."
        )
        data = {"prompt": prompt, "ai_response": ai_response, "db_context": db_context}
        
        res = await self.brain._invoke(
            system_prompt="You are the Fact Checking AI.",
            user_prompt=f"{eval_prompt}\nData: {data}",
            temperature=0.0
        )
        
        is_hallucination = res.get("is_hallucination", True)
        if is_hallucination:
            logger.warning(f"Hallucination detected! Reason: {res.get('reason')}")
        return is_hallucination
