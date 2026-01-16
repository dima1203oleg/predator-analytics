"""
Model Registry - Predator Analytics v29.1
Manages model versions, deployment status, and activation.
"""

import logging
import json
import os
import shutil
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger("ml_core.registry")

class ModelRegistry:
    def __init__(self, registry_path: str = "data/models/registry.json"):
        self.registry_path = registry_path
        self.models_dir = "data/models/versions"
        os.makedirs(os.path.dirname(self.registry_path), exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)

        self.registry = self._load_registry()

    def _load_registry(self) -> Dict[str, Any]:
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load registry: {e}")

        return {
            "active_model_id": None,
            "models": {},
            "last_updated": datetime.now().isoformat()
        }

    def _save_registry(self):
        self.registry["last_updated"] = datetime.now().isoformat()
        with open(self.registry_path, 'w') as f:
            json.dump(self.registry, f, indent=2)

    def register_model(self, model_id: str, metadata: Dict[str, Any]):
        """Register a new candidate model"""
        self.registry["models"][model_id] = {
            "id": model_id,
            "metadata": metadata,
            "registered_at": datetime.now().isoformat(),
            "status": "candidate"
        }
        self._save_registry()
        logger.info(f"🆕 Model registered: {model_id}")

    def promote_to_production(self, model_id: str):
        """Set a model as the active production model"""
        if model_id not in self.registry["models"]:
            logger.error(f"Cannot promote unknown model: {model_id}")
            return False

        # Mark former active as archived
        old_active = self.registry.get("active_model_id")
        if old_active and old_active in self.registry["models"]:
            self.registry["models"][old_active]["status"] = "archived"

        self.registry["active_model_id"] = model_id
        self.registry["models"][model_id]["status"] = "production"
        self.registry["models"][model_id]["activated_at"] = datetime.now().isoformat()

        self._save_registry()
        logger.info(f"🚀 Model PROMOTED to production: {model_id}")
        return True

    def get_active_model(self) -> Optional[Dict]:
        active_id = self.registry.get("active_model_id")
        if active_id:
            return self.registry["models"].get(active_id)
        return None

    def get_candidate_model(self) -> Optional[Dict]:
        """Returns the most recent candidate model for shadow testing"""
        candidates = [m for m in self.registry["models"].values() if m["status"] == "candidate"]
        if candidates:
            # Sort by registration time descending
            candidates.sort(key=lambda x: x["registered_at"], reverse=True)
            return candidates[0]
        return None

    def list_models(self) -> List[Dict]:
        return list(self.registry["models"].values())
