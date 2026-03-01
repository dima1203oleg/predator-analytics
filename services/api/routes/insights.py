"""Module: insights
Component: api
Predator Analytics v45.1.
"""

import logging
from typing import Any
import uuid

from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel


router = APIRouter()
logger = logging.getLogger(__name__)

MCP_ROUTER_URL = "http://predator-analytics-mcp-router:8080/v1/query"


class InsightRequest(BaseModel):
    query: str
    context: dict[str, Any] = {}


class InsightResponse(BaseModel):
    insight: str
    trace_id: str


@router.post("/generate", response_model=InsightResponse)
async def generate_insight(req: InsightRequest):
    """User asks a question -> API calls MCP Router -> LLM answers."""
    trace_id = str(uuid.uuid4())
    logger.info(f"Generating insight for query: {req.query}", extra={"trace_id": trace_id})

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                MCP_ROUTER_URL,
                json={"prompt": req.query, "task_type": "analysis", "context": req.context, "trace_id": trace_id},
            )
            data = resp.json()

            return InsightResponse(insight=data.get("content", "No insight generated."), trace_id=trace_id)

    except Exception as e:
        logger.exception(f"Insight generation failed: {e}")
        raise HTTPException(status_code=503, detail="AI Service unavailable")
