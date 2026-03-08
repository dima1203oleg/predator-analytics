import logging
from typing import Dict, Any, List
import random

logger = logging.getLogger(__name__)

class ModelEvaluator:
    """
    Model Evaluator (COMP-196)
    Supports A/B testing, evaluating models in shadow mode, 
    and selecting the best performing model.
    """
    def __init__(self):
        self.active_experiments = {}

    def start_ab_test(self, experiment_id: str, model_a: str, model_b: str, traffic_split: float = 0.5) -> Dict[str, Any]:
        """
        Registers a new A/B test between two models.
        """
        self.active_experiments[experiment_id] = {
            "model_a": model_a,
            "model_b": model_b,
            "split": traffic_split,
            "metrics": {
                "a": {"requests": 0, "successes": 0},
                "b": {"requests": 0, "successes": 0}
            }
        }
        return {"status": "started", "experiment": experiment_id, "split": traffic_split}

    def route_request(self, experiment_id: str) -> str:
        """
        Routes a request to either Model A or Model B.
        """
        if experiment_id not in self.active_experiments:
            return "default_model"
            
        exp = self.active_experiments[experiment_id]
        if random.random() < exp["split"]:
            exp["metrics"]["a"]["requests"] += 1
            return exp["model_a"]
        else:
            exp["metrics"]["b"]["requests"] += 1
            return exp["model_b"]
