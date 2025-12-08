"""Analytics Router"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["Analytics"])


from app.services.ai_engine import ai_engine
from app.services.risk_engine import risk_engine

@router.post("/deepscan")
async def deep_scan(query: str, sectors: list = ["GOV"]):
    """Deep scan analysis"""
    result = await ai_engine.analyze(query=query, sectors=sectors, depth="deep")
    return {
        "query": query, 
        "results": result.sources, 
        "analysis": result.answer,
        "confidence": result.confidence,
        "risk_assessment": "Scan completed"
    }


@router.get("/risk/{edrpou}")
async def get_risk(edrpou: str):
    """Get risk assessment"""
    # Mock data collection for now (in real scenario this would come from DB/Connectors)
    entity_data = {"edrpou": edrpou, "tax_debtor": False, "court_cases": 0}
    
    assessment = await risk_engine.assess(entity_id=edrpou, entity_data=entity_data)
    
    return {
        "edrpou": edrpou, 
        "risk_level": assessment.risk_level.value, 
        "score": assessment.score,
        "factors": assessment.factors,
        "mitigations": assessment.mitigations
    }


@router.get("/trends")
async def get_trends(sector: str = "GOV"):
    """Get trends"""
    # Placeholder for trend analysis
    return {"sector": sector, "trends": [], "message": "Trend data currently unavailable"}
