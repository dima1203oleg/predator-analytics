 from fastapi import APIRouter
import json
import os
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

BLUEPRINTS_PATH = "/Users/Shared/Predator_60/services/synthetic-data-engine/data/known_blueprints.json"
# We're running in Docker on Nvidia, so paths might be different. Let's use env or standard paths
# Actually, AGENTS.md says we must deploy to NVIDIA node where /home/dima/Predator_60 is used.
# Let's handle both.
REAL_BLUEPRINTS_PATH = "/home/dima/Predator_60/services/synthetic-data-engine/data/known_blueprints.json"
FALLBACK_PATH = "/Users/Shared/Predator_60/services/synthetic-data-engine/data/known_blueprints.json"

@router.get("/automl")
async def get_automl_experiments():
    """Повертає історію згенерованих датасетів (Continuous Learning Loop)."""
    path = REAL_BLUEPRINTS_PATH if os.path.exists(REAL_BLUEPRINTS_PATH) else FALLBACK_PATH
    
    try:
        if not os.path.exists(path):
            return {"status": "ok", "experiments": []}
            
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        # Форматуємо як NasTournament або ModelCandidate для UI
        # UI expect a list, but wait, we can just return the raw list and adapt in UI
        return data
    except Exception as e:
        logger.error(f"Error reading blueprints: {e}")
        return {"error": str(e), "experiments": []}
