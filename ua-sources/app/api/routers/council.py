from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import asyncio
from app.services.llm import llm_service
from app.core.prompts import get_prompt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/council", tags=["Neural Council"])

class CouncilRequest(BaseModel):
    query: str
    models: List[str] = ["gemini", "groq", "mistral"]
    synthesis_model: str = "gemini"

class CouncilResponse(BaseModel):
    final_answer: str
    per_model_answers: List[Dict[str, Any]]
    ranking: List[str] = []

@router.post("/run", response_model=CouncilResponse)
async def run_council(req: CouncilRequest):
    """
    Run Neural Council: Query multiple LLMs and synthesize the best answer.
    """
    logger.info(f"Running Council for query: {req.query}")
    
    # 1. Parallel execution
    async def call_model(provider: str, prompt: str):
        try:
            resp = await llm_service.generate(
                prompt=prompt,
                provider=provider,
                max_tokens=1000
            )
            return {
                "model": provider,
                "answer": resp.content if resp.success else f"Error: {resp.error}",
                "status": "success" if resp.success else "error",
                "latency": resp.latency_ms
            }
        except Exception as e:
            return {"model": provider, "answer": str(e), "status": "error"}

    tasks = [call_model(m, req.query) for m in req.models]
    results = await asyncio.gather(*tasks)
    
    # 2. Synthesis
    valid_answers = [r["answer"] for r in results if r["status"] == "success"]
    
    if not valid_answers:
        return {
            "final_answer": "Council failed to reach a consensus (all models failed).",
            "per_model_answers": results
        }
        
    # Use centralized prompt template
    synthesis_prompt = get_prompt(
        "council_synthesis",
        query=req.query,
        responses="\n\n".join(valid_answers)
    )
    
    try:
        final_resp = await llm_service.generate(
            prompt=synthesis_prompt,
            provider=req.synthesis_model,
            max_tokens=2000
        )
        final_answer = final_resp.content if final_resp.success else "Synthesis failed."
    except Exception as e:
        final_answer = f"Synthesis error: {e}"
        
    return {
        "final_answer": final_answer,
        "per_model_answers": results,
        "ranking": [r["model"] for r in results] # Dummy ranking
    }

@router.get("/config")
async def get_config():
    """Get active Council configuration"""
    return {
        "available_models": list(llm_service.providers.keys()),
        "default_models": ["gemini", "groq", "mistral"],
        "max_concurrent": 5
    }
