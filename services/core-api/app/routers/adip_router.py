from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl
import logging

from app.services.adip.adip_core import adip_core

logger = logging.getLogger(__name__)

adip_router = APIRouter()

class DiscoverRequest(BaseModel):
    url: HttpUrl

@adip_router.post("/discover")
async def discover_source(request: DiscoverRequest):
    """
    Triggers the Autonomous Connector Factory (ADIP) pipeline to scan a URL,
    discover its API structure, and generate a new Python connector.
    """
    logger.info(f"Received ADIP discover request for: {request.url}")
    try:
        # Convert HttpUrl to string
        result = await adip_core.process_new_source(str(request.url))
        return result
    except Exception as e:
        logger.error(f"ADIP discovery failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
