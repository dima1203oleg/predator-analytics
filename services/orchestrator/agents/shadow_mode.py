"""
Shadow Mode Service - Predator Analytics v29.1
Runs A/B testing between production and candidate models.
"""

import logging
import asyncio
import json
from typing import Dict, Any, List, Optional
from ml_core.registry import ModelRegistry

logger = logging.getLogger("orchestrator.shadow_mode")

class ShadowModeService:
    def __init__(self, registry: Optional[ModelRegistry] = None, redis_client: Any = None):
        self.registry = registry or ModelRegistry()
        self.redis = redis_client
        self.deviations = []

    async def execute_dual_analysis(self, input_data: Dict[str, Any], production_agent: Any) -> Dict[str, Any]:
        """
        Executes analysis on both Production (Real) and Candidate (Shadow) agents.
        Returns the Production result but logs the difference.
        """
        # 1. Get Candidate Model
        candidate = self.registry.get_candidate_model()

        # In a real scenario, we'd instantiate a runner for the specific model_id.
        # For this implementation, we simulate the shadow response if a candidate exists.

        # Run Production
        prod_start = asyncio.get_event_loop().time()
        prod_result = await production_agent.analyze(input_data)
        prod_duration = asyncio.get_event_loop().time() - prod_start

        if not candidate:
            return prod_result

        # Run Shadow (Simulated for v29 demo)
        logger.info(f"👤 SHADOW MODE ACTIVE: Testing against {candidate['id']}")

        shadow_result = self._simulate_shadow_inference(candidate['id'], input_data, prod_result)

        # 2. Compare results
        deviation = self._calculate_deviation(prod_result, shadow_result)

        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "production_model": self.registry.get_active_model().get("id") if self.registry.get_active_model() else "legacy",
            "candidate_model": candidate["id"],
            "deviation_score": deviation,
            "prod_status": prod_result.get("health_status"),
            "shadow_status": shadow_result.get("health_status")
        }
        self.deviations.append(entry)

        if self.redis:
            try:
                await self.redis.lpush("som:shadow:deviations", json.dumps(entry))
                await self.redis.ltrim("som:shadow:deviations", 0, 99) # Keep 100
                await self.redis.set("som:shadow:last_score", deviation)
            except Exception as e:
                logger.error(f"Failed to store shadow metrics: {e}")

        if deviation > 0.3:
            logger.warning(f"⚠️ SHADOW DRIFT DETECTED: {deviation:.2f} difference between models.")

        return prod_result

    def _calculate_deviation(self, prod: Dict, shadow: Dict) -> float:
        """Calculates a simple deviation score [0.0 - 1.0]"""
        if prod.get("health_status") != shadow.get("health_status"):
            return 0.5

        # Compare complexity (number of elements in lists)
        prod_b = len(prod.get("bottlenecks", []))
        shadow_b = len(shadow.get("bottlenecks", []))

        if prod_b == 0 and shadow_b == 0: return 0.0
        return abs(prod_b - shadow_b) / max(prod_b, shadow_b, 1)

    def _simulate_shadow_inference(self, model_id: str, input_data: Any, prod_result: Dict) -> Dict:
        """Simulates how the candidate model might respond slightly differently"""
        import copy
        shadow = copy.deepcopy(prod_result)

        # If CPU is high, shadow model might be 'more sensitive'
        cpu = input_data.get("cpu_usage", 0.5)
        if cpu > 0.7:
             shadow["health_status"] = "degraded"
             if "CPU Pressure" not in shadow["bottlenecks"]:
                 shadow["bottlenecks"].append("Shadow-detected CPU Pressure")

        return shadow

    def get_shadow_report(self) -> List[Dict]:
        return self.deviations[-50:]
