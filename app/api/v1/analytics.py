from __future__ import annotations


"""Analytics V1 API — Market Integrity, Default Prediction, Customs Fraud."""
from datetime import UTC, datetime

from fastapi import APIRouter, Query
from pydantic import BaseModel, Field

import logging
from typing import Any


logger = logging.getLogger("api.analytics")


router = APIRouter(prefix="/analytics", tags=["Analytics"])


# --- Request/Response Models ---

class MarketPriceData(BaseModel):
    """Price data for market analysis."""
    product_code: str
    entities: dict[str, list[float]] = Field(..., description="entity_name → [prices]")


class FinancialData(BaseModel):
    """Financial data for default prediction."""
    total_assets: float
    total_liabilities: float
    current_assets: float = 0
    current_liabilities: float = 0
    retained_earnings: float = 0
    ebit: float = 0
    revenue: float = 0
    market_value_equity: float = 0


class DefaultPredictionRequest(BaseModel):
    ueid: str
    company_name: str
    financials: FinancialData
    is_public: bool = False
    is_manufacturing: bool = True


class PricePredictionRequest(BaseModel):
    product_code: str
    product_name: str = ""
    price_history: list[float]
    horizon_days: int = 30
    features: dict[str, float] | None = None


class DeclarationData(BaseModel):
    """Customs declaration for fraud analysis."""
    declaration_id: str
    entity: str
    product_code: str
    product_name: str = ""
    declared_value: float = 0
    quantity: float = 0
    weight_kg: float = 0
    unit_price: float = 0
    country_origin: str = ""
    country_destination: str = ""
    direction: str = "import"


# --- Cartel Detection ---

@router.post("/market/cartel-check")
async def check_cartel(data: MarketPriceData):
    """Check for cartel behavior signals in market data."""
    from app.services.ml.market_integrity import market_integrity

    signals = market_integrity.detect_cartel(
        product_code=data.product_code,
        price_series=data.entities,
    )
    return {
        "product_code": data.product_code,
        "entities_analyzed": len(data.entities),
        "signals": [s.to_dict() for s in signals],
        "total_signals": len(signals),
        "timestamp": datetime.now(UTC).isoformat(),
    }


# --- Dumping Detection ---

@router.post("/market/dumping-check")
async def check_dumping(data: MarketPriceData):
    """Check for dumping behavior."""
    from app.services.ml.market_integrity import market_integrity

    signals = market_integrity.detect_dumping(
        product_code=data.product_code,
        price_series=data.entities,
    )
    return {
        "product_code": data.product_code,
        "signals": [s.to_dict() for s in signals],
        "total_signals": len(signals),
        "timestamp": datetime.now(UTC).isoformat(),
    }


# --- Default Prediction ---

@router.post("/default/predict")
async def predict_default(request: DefaultPredictionRequest):
    """Predict default/bankruptcy probability (Altman Z-score)."""
    from app.services.ml.default_predictor import default_predictor

    prediction = default_predictor.predict(
        ueid=request.ueid,
        company_name=request.company_name,
        financials=request.financials.model_dump(),
        is_public=request.is_public,
        is_manufacturing=request.is_manufacturing,
    )
    return prediction.to_dict()


# --- Price Prediction ---

@router.post("/price/predict")
async def predict_price(request: PricePredictionRequest):
    """Predict future price for a product."""
    from app.services.ml.price_predictor import get_price_predictor

    predictor = get_price_predictor()
    forecast = predictor.predict(
        product_code=request.product_code,
        product_name=request.product_name,
        price_history=request.price_history,
        horizon_days=request.horizon_days,
        features=request.features,
    )
    return forecast.to_dict()


# --- Customs Fraud Detection ---

@router.post("/customs/fraud-check")
async def check_customs_fraud(declarations: list[DeclarationData]):
    """Analyze customs declarations for fraud signals."""
    from app.services.ml.customs_fraud_detector import customs_fraud_detector

    decl_dicts = [d.model_dump() for d in declarations]
    signals = customs_fraud_detector.analyze_batch(decl_dicts)
    return {
        "declarations_analyzed": len(declarations),
        "signals": [s.to_dict() for s in signals],
        "total_signals": len(signals),
        "by_severity": {
            "critical": sum(1 for s in signals if s.severity == "critical"),
            "high": sum(1 for s in signals if s.severity == "high"),
            "medium": sum(1 for s in signals if s.severity == "medium"),
            "low": sum(1 for s in signals if s.severity == "low"),
        },
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.post("/customs/fraud-check/single")
async def check_single_declaration(declaration: DeclarationData):
    """Analyze a single declaration for fraud."""
    from app.services.ml.customs_fraud_detector import customs_fraud_detector

    signals = customs_fraud_detector.analyze_declaration(declaration.model_dump())
    return {
        "declaration_id": declaration.declaration_id,
        "entity": declaration.entity,
        "signals": [s.to_dict() for s in signals],
        "is_suspicious": len(signals) > 0,
        "max_severity": max((s.severity for s in signals), default="none"),
    }


# --- Data Lineage ---

@router.get("/lineage/recent")
async def get_recent_lineage(limit: int = Query(50, le=200)):
    """Get recent data lineage records."""
    from app.services.etl.data_lineage import lineage_tracker

    records = lineage_tracker.list_recent(limit=limit)
    return {"records": records, "total": len(records)}


@router.get("/lineage/stats")
async def get_lineage_stats():
    """Get data lineage statistics."""
    from app.services.etl.data_lineage import lineage_tracker

    return lineage_tracker.get_stats()


# --- Entity Resolution ---

@router.get("/entities/resolve")
async def resolve_entity(
    name: str = Query(..., description="Entity name"),
    edrpou: str | None = Query(None),
    entity_type: str = Query("company"),
):
    """Resolve entity to UEID."""
    from app.services.etl.entity_resolver import entity_resolver

    resolved = entity_resolver.resolve(
        name=name, edrpou=edrpou, entity_type=entity_type, source="api",
    )
    return resolved.to_dict()


@router.post("/entities/resolve/batch")
async def resolve_entities_batch(entities: list[dict[str, str]]):
    """Batch resolve entities."""
    from app.services.etl.entity_resolver import entity_resolver

    resolved = entity_resolver.resolve_batch(entities)
    return {
        "results": [r.to_dict() for r in resolved],
        "total": len(resolved),
    }


@router.get("/entities/stats")
async def get_entity_stats():
    """Get entity resolver statistics."""
    from app.services.etl.entity_resolver import entity_resolver

    return entity_resolver.get_stats()


# --- Audit Log ---

@router.get("/audit/recent")
async def get_recent_audit(
    limit: int = Query(50, le=500),
    actor: str | None = Query(None),
    action: str | None = Query(None),
    since: str | None = Query(None, description="ISO datetime"),
):
    """Query audit log."""
    from app.services.audit.audit_logger import audit_logger

    records = audit_logger.query(
        actor=actor, action=action, limit=limit, since=since,
    )
    return {"records": records, "total": len(records)}
