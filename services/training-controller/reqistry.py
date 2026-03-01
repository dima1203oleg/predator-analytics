"""Model Registry abstraction for Predator Analytics v45.1.

Component: training-controller
"""
import logging
from datetime import datetime

from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ModelMetadata(BaseModel):
    model_id: str
    version: str
    status: str = "staging"  # staging, production, archived
    accuracy: float
    created_at: str
    artifact_uri: str
    training_params: dict

class ModelRegistry:
    """
    Abstraction for MLflow Model Registry.
    In Phase 1, we simulate registry operations or wrap MLflow Client.
    """
    
    def __init__(self, tracking_uri: str = "http://predator-analytics-mlflow:5000"):
        self.tracking_uri = tracking_uri
        # In real impl: self.client = MlflowClient(tracking_uri=tracking_uri)
        self._mock_registry: dict[str, ModelMetadata] = {}

    async def register_model(self, model: ModelMetadata):
        """Register a new model version."""
        key = f"{model.model_id}:{model.version}"
        self._mock_registry[key] = model
        logger.info("Registered model %s with accuracy %f", key, model.accuracy)

    async def promote_model_to_production(self, model_id: str, version: str) -> bool:
        """Promote a model to production if it meets criteria."""
        key = f"{model_id}:{version}"
        if key not in self._mock_registry:
            logger.error("Model %s not found", key)
            return False
        
        # Demote current prod
        for m in self._mock_registry.values():
            if m.model_id == model_id and m.status == "production":
                m.status = "archived"
        
        # Promote new
        self._mock_registry[key].status = "production"
        logger.info("Promoted %s to PRODUCTION", key)
        return True

    async def get_production_model(self, model_id: str) -> ModelMetadata | None:
        """Fetch current production model."""
        for m in self._mock_registry.values():
            if m.model_id == model_id and m.status == "production":
                return m
        return None
