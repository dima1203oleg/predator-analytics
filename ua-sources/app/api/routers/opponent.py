"""Opponent Router"""
from fastapi import APIRouter
from ...services.opponent_engine import opponent_engine

router = APIRouter(prefix="/opponent", tags=["Opponent"])


@router.post("/ask")
async def ask_opponent(query: str, sector: str = "GOV"):
    """Ask opponent engine"""
    result = await opponent_engine.analyze_opponent(query=query, sector=sector)
    return {
        "query": query,
        "answer": result.get("analysis", ""),
        "sources": result.get("sources", [])
    }


@router.post("/analyze")
async def analyze_opponent(company: str):
    """Analyze competitor"""
    result = await opponent_engine.analyze_opponent(query=company)
    return {
        "company": company,
        "analysis": result
    }


@router.post("/compare")
async def compare_companies(company_a: str, company_b: str):
    """Compare two companies"""
    result = await opponent_engine.compare_companies(company_a=company_a, company_b=company_b)
    return {"comparison": result}
