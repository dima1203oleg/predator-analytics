from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

# Setup Router
router = APIRouter(tags=["Google Ecosystem (Assistant)"])

# --- Models ---
class GoogleSuggestion(BaseModel):
    id: str
    context: str
    suggestion: str
    code_snippet: Optional[str] = None
    origin: str = "google_ai_studio"
    timestamp: str
    status: str = "NEW" # NEW, REVIEWED, PROPOSED

class SuggestionPushRequest(BaseModel):
    context: str
    suggestion: str
    code_snippet: Optional[str] = None
    origin: str = "cli_google_bridge"

# --- In-Memory Store (Persist to Redis in prod) ---
# A simple list to hold recent suggestions pushed from CLI
_suggestion_store: List[GoogleSuggestion] = []

# --- Endpoints ---

@router.get("/google/suggestions", response_model=List[GoogleSuggestion])
async def get_suggestions():
    """
    Get active suggestions from Google AI Ecosystem.
    Used by OperatorShell (GoogleAdvisoryPanel).
    """
    # Return last 10, newest first
    return sorted(_suggestion_store, key=lambda x: x.timestamp, reverse=True)[:10]

@router.post("/google/suggestions", response_model=GoogleSuggestion)
async def push_suggestion(payload: SuggestionPushRequest):
    """
    Push a new suggestion from external Google Runtime (via CLI).
    """
    new_sug = GoogleSuggestion(
        id=f"sug_{uuid.uuid4().hex[:8]}",
        context=payload.context,
        suggestion=payload.suggestion,
        code_snippet=payload.code_snippet,
        origin=payload.origin,
        timestamp=datetime.now().isoformat()
    )

    _suggestion_store.append(new_sug)

    # Keep store size manageable
    if len(_suggestion_store) > 50:
        _suggestion_store.pop(0)

    return new_sug

@router.post("/google/suggestions/{sug_id}/ack")
async def ack_suggestion(sug_id: str):
    """
    Acknowledge/Dismiss a suggestion.
    """
    global _suggestion_store
    _suggestion_store = [s for s in _suggestion_store if s.id != sug_id]
    return {"status": "ACKNOWLEDGED", "id": sug_id}
