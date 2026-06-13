"""Module: analytics
Component: api
Predator Analytics v45.1.
"""

import logging

from fastapi import APIRouter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Returns high-level metric summary for the UI."""
    return {}


@router.get("/models/performance")
async def get_model_performance():
    """Fetches model metrics from MLflow (via proxy or DB)."""
    return []
