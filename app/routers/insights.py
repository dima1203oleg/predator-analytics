from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.insights_engine import insights_engine


router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/")
async def get_insights():
    """Get latest AI-driven insights."""
    try:
        return await insights_engine.get_latest_insights()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{insight_id}/save")
async def save_insight(insight_id: str):
    """Mark insight as saved/bookmarked."""
    return {"success": True, "id": insight_id}


@router.post("/{insight_id}/feedback")
async def process_feedback(insight_id: str, type: str):
    """Submit positive/negative feedback for ML improvement."""
    return {"success": True, "id": insight_id, "feedback": type}
