
"""
Module: controller
Component: sio-controller
Predator Analytics v25.1
"""
import logging
import asyncio
import httpx
from fastapi import FastAPI, BackgroundTasks
from .drift_detector import DriftDetector
from services.shared.events import PredatorEvent
from services.shared.logging_config import setup_logging

setup_logging("sio-controller")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator SIO Controller", version="25.1")

detector = DriftDetector()
RTB_ENGINE_URL = "http://predator-analytics-rtb-engine:8081/events"

async def emit_event_to_rtb(event: PredatorEvent):
    """Sends events to RTB Engine for decision making."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(RTB_ENGINE_URL, json=event.to_dict())
            if resp.status_code == 202 or resp.status_code == 200:
                logger.info(f"Event {event.event_type} sent to RTB", extra={"event_id": event.event_id})
            else:
                logger.error(f"Failed to send event to RTB: {resp.status_code}")
    except Exception as e:
        logger.error(f"Error communicating with RTB: {e}")

async def run_cycle():
    """Main SIO improvement cycle logic."""
    logger.info("Starting SIO Improvement Cycle")
    
    # 1. Run Drift Detection
    result = await detector.analyze_drift("fraud-detector-v1", "s3://data/latest")
    
    if result["is_drifted"]:
        # 2. Emit event if drift found
        event = detector.create_drift_event(result)
        await emit_event_to_rtb(event)
    
    logger.info("SIO Cycle Complete")

@app.post("/run-cycle")
async def trigger_cycle(background_tasks: BackgroundTasks):
    """Manual or Cron trigger for SIO cycle."""
    background_tasks.add_task(run_cycle)
    return {"status": "cycle_started"}

@app.get("/health")
async def health():
    return {"status": "active", "component": "sio-controller"}
