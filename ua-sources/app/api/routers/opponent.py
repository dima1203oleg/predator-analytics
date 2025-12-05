"""Opponent Router"""
from fastapi import APIRouter

router = APIRouter(prefix="/opponent", tags=["Opponent"])


@router.post("/ask")
async def ask_opponent(query: str, sector: str = "GOV"):
    """Ask opponent engine"""
    return {"query": query, "answer": "", "sources": []}


@router.post("/analyze")
async def analyze_opponent(company: str):
    """Analyze competitor"""
    return {"company": company, "analysis": {}}


@router.post("/compare")
async def compare_companies(company_a: str, company_b: str):
    """Compare two companies"""
    return {"comparison": {}}
