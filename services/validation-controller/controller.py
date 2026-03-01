"""Validation Controller API for Predator Analytics v45.1.

This service acts as an entry point for model validation requests.
"""
import logging
from fastapi import FastAPI, BackgroundTasks
from services.shared.logging_config import setup_logging
from services.shared.events import PredatorEvent
from .validator import ModelValidator

setup_logging("validation-controller")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator Validation Controller", version="25.1")
validator = ModelValidator()

@app.post("/events/validate")
async def validation_trigger(event_dict: dict, background_tasks: BackgroundTasks):
    """Triggered when Training Controller finishes a job."""
    event = PredatorEvent.from_dict(event_dict)
    background_tasks.add_task(validator.handle_validation_request, event)
    return {"status": "validation_started"}

@app.get("/health")
async def health():
    return {"status": "active"}
