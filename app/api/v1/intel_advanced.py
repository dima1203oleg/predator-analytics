from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.intelligence.counter_intel import (
    PsychographicProfiler, get_psychographic_profiler
)

router = APIRouter(prefix="/intel", tags=["Intelligence Services"])

class ProfilerRequest(BaseModel):
    name: str
    samples: List[str]

@router.post("/profiler/psychographic")
async def building_psychographic_profile(
    data: ProfilerRequest,
    profiler: PsychographicProfiler = Depends(get_psychographic_profiler)
) -> Dict[str, Any]:
    """
    Builds a behavioral and psychographic profile of an entity (COMP-220 part).
    """
    return profiler.build_profile(data.name, data.samples)
