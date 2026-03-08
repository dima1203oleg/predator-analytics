from __future__ import annotations


"""Risk & Sanctions API Router (v1)

Endpoints:
  GET  /risk/company/{ueid}       — Composite risk profile (§14.4)
  POST /risk/batch                — Batch scoring
  GET  /sanctions/check/{query}   — Sanctions screening (РНБО, EU, OFAC)
  GET  /sanctions/lists           — Available sanctions lists
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel


logger = logging.getLogger("api.risk")

router = APIRouter(prefix="/risk", tags=["Risk & Sanctions"])


# --- Pydantic Models ---

class RiskFactorResponse(BaseModel):
    name: str
    value: Any
    weight: float
    contribution: float
    unit: str | None = None


class RiskProfileResponse(BaseModel):
    ueid: str
    cers_score: int
    risk_level: str
    risk_category: str
    factors: list[RiskFactorResponse]
    data_sources: list[str]
    computed_at: str
    model_version: str


class BatchRiskRequest(BaseModel):
    entities: list[dict[str, Any]]


class SanctionHitResponse(BaseModel):
    list_name: str
    entity_name: str
    match_score: float
    reason: str | None
    since: str | None
    source_url: str | None


class SanctionsCheckResponse(BaseModel):
    query: str
    is_sanctioned: bool
    risk_level: str
    hits: list[SanctionHitResponse]
    lists_checked: list[str]
    checked_at: str


# --- Endpoints ---

@router.get("/company/{ueid}", response_model=RiskProfileResponse)
async def get_risk_profile(
    ueid: str,
    include_shap: bool = Query(False, description="Include SHAP explanation"),
    include_graph: bool = Query(False, description="Include graph connections"),
    include_history: bool = Query(False, description="Include CERS history"),
):
    """Get composite risk profile for a company (§14.4).

    Returns CERS score (0-100), risk factors, and explanations.
    """
    from app.services.risk.cers_engine import get_cers_engine

    engine = get_cers_engine()

    # In production, this would fetch from PostgreSQL/Neo4j
    # For now, use mock data that simulates DB lookup
    entity_data = _lookup_entity_data(ueid)

    if entity_data is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "ENTITY_NOT_FOUND",
                "message": f"Компанію з UEID {ueid[:12]}... не знайдено",
            },
        )

    result = engine.compute(
        ueid=ueid,
        entity_data=entity_data,
        data_sources=["edrpou", "court_registry", "tax_data", "customs", "sanctions"],
    )

    return RiskProfileResponse(
        ueid=result.ueid,
        cers_score=result.cers_score,
        risk_level=result.risk_level,
        risk_category=result.risk_category,
        factors=[
            RiskFactorResponse(
                name=f.name,
                value=f.value,
                weight=f.weight,
                contribution=f.contribution,
                unit=f.unit,
            )
            for f in result.factors
        ],
        data_sources=result.data_sources,
        computed_at=result.computed_at.isoformat(),
        model_version=result.model_version,
    )


@router.post("/batch")
async def batch_risk_scoring(request: BatchRiskRequest):
    """Batch CERS scoring for up to 1000 entities."""
    from app.services.risk.cers_engine import get_cers_engine

    if len(request.entities) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 entities per batch")

    engine = get_cers_engine()
    results = []

    for entity in request.entities:
        ueid = entity.get("ueid", "unknown")
        result = engine.compute(ueid=ueid, entity_data=entity)
        results.append({
            "ueid": ueid,
            "cers_score": result.cers_score,
            "risk_level": result.risk_level,
        })

    return {
        "total": len(results),
        "results": results,
    }


# --- Sanctions Router ---

sanctions_router = APIRouter(prefix="/sanctions", tags=["Sanctions"])


@sanctions_router.get("/check/{query}", response_model=SanctionsCheckResponse)
async def check_sanctions(
    query: str,
    entity_type: str = Query("company", description="company or person"),
    edrpou: str | None = Query(None, description="Optional EDRPOU for exact match"),
):
    """Check entity against sanctions lists (РНБО, EU, OFAC)."""
    from app.services.risk.sanctions_checker import sanctions_checker

    result = await sanctions_checker.check(
        query=query,
        entity_type=entity_type,
        edrpou=edrpou,
    )

    return SanctionsCheckResponse(
        query=result.query,
        is_sanctioned=result.is_sanctioned,
        risk_level=result.risk_level,
        hits=[
            SanctionHitResponse(
                list_name=h.list_name,
                entity_name=h.entity_name,
                match_score=h.match_score,
                reason=h.reason,
                since=h.since,
                source_url=h.source_url,
            )
            for h in result.hits
        ],
        lists_checked=result.lists_checked,
        checked_at=result.checked_at.isoformat(),
    )


@sanctions_router.get("/lists")
async def list_sanctions_sources():
    """Get available sanctions list sources."""
    from app.services.risk.sanctions_checker import SANCTIONS_LISTS

    return {
        "lists": SANCTIONS_LISTS,
        "total": len(SANCTIONS_LISTS),
    }


# --- Helper ---

def _lookup_entity_data(ueid: str) -> dict[str, Any] | None:
    """Lookup entity risk factor data.

    In production: PostgreSQL query + Neo4j graph analysis.
    For now: deterministic mock based on UEID hash.
    """
    # Use hash of ueid to generate deterministic but varying data
    h = hash(ueid) % 1000

    if h == 0:
        return None  # Simulate not found

    return {
        "court_cases_count": h % 8,
        "offshore_connections": h % 4,
        "revenue_change_pct": (h % 80) - 40,  # -40 to +40
        "sanctions_status": "none" if h % 5 != 0 else "watchlist",
        "payment_delay_days": h % 60,
        "pep_connections": h % 3,
        "prozorro_violations": h % 2,
    }
