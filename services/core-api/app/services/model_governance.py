import logging
import sys
from typing import Dict, Any

sys.path.append("/Users/Shared/Predator_60/libs/predator-common")
from predator_common.ai.deepseek_core import DeepSeekCore

logger = logging.getLogger("model_governance")

class ModelGovernanceAI:
    """
    MLOps Control Layer.
    Uses DeepSeek R1 to manage model promotions and canary deployment analysis.
    """
    def __init__(self):
        self.brain = DeepSeekCore(model_name="cognitive_core")

    async def decide_promotion(self, current_metrics: Dict[str, float], candidate_metrics: Dict[str, float]) -> bool:
        """
        Decides whether to promote a model from staging to production.
        """
        prompt = (
            "You are the Model Governance AI. Compare current production metrics with "
            "candidate staging metrics. Decide if the candidate should be promoted. "
            "Consider not just accuracy, but precision, recall, and potential risk. "
            "Return JSON with 'decision' (string: 'PROMOTE' or 'REJECT') and 'rationale' (string)."
        )
        data = {"current": current_metrics, "candidate": candidate_metrics}
        
        res = await self.brain._invoke(
            system_prompt="You are the Model Governance Core.",
            user_prompt=f"{prompt}\nData: {data}",
            temperature=0.1
        )
        
        decision = res.get("decision", "REJECT")
        logger.info(f"Model Promotion Decision: {decision}. Rationale: {res.get('rationale')}")
        return decision == "PROMOTE"

    async def analyze_canary(self, canary_logs: str) -> bool:
        """
        Analyzes logs from a canary deployment to detect silent failures.
        """
        prompt = (
            "Analyze these canary deployment logs. Look for error spikes, high latency, "
            "or strange distribution shifts. Return JSON with 'decision' (string: 'SAFE' or 'ROLLBACK') "
            "and 'rationale' (string)."
        )
        
        res = await self.brain._invoke(
            system_prompt="You are the MLOps Deployment AI.",
            user_prompt=f"{prompt}\nLogs: {canary_logs}",
            temperature=0.1
        )
        
        decision = res.get("decision", "ROLLBACK")
        logger.info(f"Canary Analysis Decision: {decision}. Rationale: {res.get('rationale')}")
        return decision == "SAFE"
