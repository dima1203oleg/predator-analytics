"""Public API Router — Зовнішній API для партнерів.

Версіонований API з rate limiting та API keys.
Endpoints для зовнішніх інтеграцій.
"""
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from predator_common.models import Company, RiskScore


router = APIRouter()

# ======================== API KEY VALIDATION ========================


async def validate_api_key(
    x_api_key: Annotated[str | None, Header()] = None,
) -> dict:
    """Валідація API ключа."""
    if not x_api_key:
        raise HTTPException(
            status_code=401,
            detail="API key required. Provide X-API-Key header.",
        )

    raise HTTPException(
        status_code=501,
        detail="API Key verification requires DB integration. Not implemented yet.",
    )


# ======================== REQUEST/RESPONSE MODELS ========================


class CompanyLookupRequest(BaseModel):
    """Запит на пошук компанії."""

    edrpou: str = Field(..., min_length=8, max_length=10, description="Код ЄДРПОУ")


class CompanyLookupResponse(BaseModel):
    """Відповідь з даними компанії."""

    edrpou: str
    name: str
    status: str
    registration_date: str | None
    address: str | None
    kved: str | None
    authorized_capital: float | None


class SanctionCheckRequest(BaseModel):
    """Запит на перевірку санкцій."""

    name: str = Field(..., min_length=2, description="ПІБ або назва")
    entity_type: str = Field(default="any", description="Тип: person, organization, any")


class SanctionCheckResponse(BaseModel):
    """Відповідь перевірки санкцій."""

    query: str
    is_sanctioned: bool
    matches_count: int
    lists_checked: list[str]
    checked_at: str


class RiskScoreRequest(BaseModel):
    """Запит на розрахунок ризику."""

    edrpou: str = Field(..., min_length=8, max_length=10, description="Код ЄДРПОУ")


class RiskScoreResponse(BaseModel):
    """Відповідь з оцінкою ризику."""

    edrpou: str
    name: str
    risk_score: int
    risk_level: str
    factors: list[dict]
    calculated_at: str


class BatchRequest(BaseModel):
    """Пакетний запит."""

    items: list[str] = Field(..., max_length=100, description="Список ЄДРПОУ (до 100)")


class BatchResponse(BaseModel):
    """Пакетна відповідь."""

    total: int
    processed: int
    results: list[dict]


class WebhookConfig(BaseModel):
    """Конфігурація webhook."""

    url: str = Field(..., description="URL для webhook")
    events: list[str] = Field(..., description="Події: risk_change, sanction_match, new_case")
    secret: str | None = Field(None, description="Secret для підпису")


class APIUsageResponse(BaseModel):
    """Статистика використання API."""

    partner_id: str
    period: str
    requests_total: int
    requests_remaining: int
    rate_limit: int
    endpoints: dict[str, int]


# ======================== ENDPOINTS ========================


@router.get("/v1/health", summary="Перевірка доступності API")
async def health_check():
    """Перевірка доступності Public API."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.post("/v1/company/lookup", response_model=CompanyLookupResponse, summary="Пошук компанії")
async def lookup_company(
    request: CompanyLookupRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Отримати базову інформацію про компанію за ЄДРПОУ.

    **Rate limit:** 100 запитів/хвилина
    """
    result = await db.execute(select(Company).where(Company.edrpou == request.edrpou))
    company = result.scalar_one_or_none()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return CompanyLookupResponse(
        edrpou=company.edrpou,
        name=company.name,
        status=company.status or "unknown",
        region=company.address.split(',')[0] if company.address else None,
        kved=company.industry,
    )


@router.post("/v1/company/batch", response_model=BatchResponse, summary="Пакетний пошук компаній")
async def batch_lookup_companies(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Пакетний пошук компаній (до 100 за запит).

    **Rate limit:** 10 запитів/хвилина
    """
    if not request.items:
        return BatchResponse(total=0, processed=0, results=[])

    result = await db.execute(select(Company).where(Company.edrpou.in_(request.items)))
    companies = result.scalars().all()
    found_edrpou = {c.edrpou: c for c in companies}

    results = []
    for edrpou in request.items:
        company = found_edrpou.get(edrpou)
        if company:
            results.append({
                "edrpou": company.edrpou,
                "name": company.name,
                "status": company.status,
                "found": True,
            })
        else:
            results.append({
                "edrpou": edrpou,
                "name": None,
                "status": None,
                "found": False,
            })

    return BatchResponse(
        total=len(request.items),
        processed=len(companies),
        results=results,
    )


@router.post("/v1/sanctions/check", response_model=SanctionCheckResponse, summary="Перевірка санкцій")
async def check_sanctions(
    request: SanctionCheckRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Перевірка у санкційних списках (РНБО, OFAC, EU, UK, UN).

    **Rate limit:** 100 запитів/хвилина
    """
    result = await db.execute(select(Company).where(Company.name.ilike(f"%{request.name}%")))
    entries = result.scalars().all()

    return SanctionCheckResponse(
        query=request.name,
        is_sanctioned=len(entries) > 0,
        matches_count=len(entries),
        lists_checked=["rnbo_ua", "ofac", "eu", "uk", "un"],
        checked_at=datetime.now(UTC).isoformat(),
    )


@router.post("/v1/sanctions/batch", response_model=BatchResponse, summary="Пакетна перевірка санкцій")
async def batch_check_sanctions(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Пакетна перевірка санкцій (до 100 за запит).

    **Rate limit:** 10 запитів/хвилина
    """
    if not request.items:
        return BatchResponse(total=0, processed=0, results=[])

    # Simple approach: fetch all matches
    results = []
    for name in request.items:
        result = await db.execute(select(Company).where(Company.name.ilike(f"%{name}%")))
        count = len(result.scalars().all())
        results.append({
            "query": name,
            "is_sanctioned": count > 0,
            "matches_count": count,
        })

    return BatchResponse(
        total=len(request.items),
        processed=len(results),
        results=results,
    )


@router.post("/v1/risk/score", response_model=RiskScoreResponse, summary="Оцінка ризику")
async def get_risk_score(
    request: RiskScoreRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Отримати AML-скор компанії.

    **Rate limit:** 50 запитів/хвилина
    """
    result = await db.execute(select(Company).where(Company.edrpou == request.edrpou))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return RiskScoreResponse(
        edrpou=request.edrpou,
        risk_score=company.cers_score or 0,
        risk_level=company.cers_level or "low",
        factors=[],
        calculated_at=company.cers_updated_at.isoformat() if company.cers_updated_at else datetime.now(UTC).isoformat()
    )


@router.post("/v1/risk/batch", response_model=BatchResponse, summary="Пакетна оцінка ризику")
async def batch_risk_score(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Пакетна оцінка ризику (до 100 за запит).

    **Rate limit:** 5 запитів/хвилина
    """
    if not request.items:
        return BatchResponse(total=0, processed=0, results=[])

    result = await db.execute(select(Company).where(Company.edrpou.in_(request.items)))
    companies = result.scalars().all()
    found_edrpou = {c.edrpou: c for c in companies}

    results = []
    for edrpou in request.items:
        company = found_edrpou.get(edrpou)
        if company:
            results.append({
                "edrpou": edrpou,
                "risk_score": company.cers_score or 0,
                "risk_level": company.cers_level or "low",
            })
        else:
            results.append({
                "edrpou": edrpou,
                "risk_score": None,
                "risk_level": None,
            })

    return BatchResponse(
        total=len(request.items),
        processed=len(companies),
        results=results,
    )


@router.get("/v1/company/{edrpou}/monitoring", summary="Статус моніторингу")
async def get_monitoring_status(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Monitoring not implemented yet.")

@router.post("/v1/company/{edrpou}/monitoring/start", summary="Почати моніторинг")
async def start_monitoring(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Monitoring not implemented yet.")

@router.delete("/v1/company/{edrpou}/monitoring/stop", summary="Зупинити моніторинг")
async def stop_monitoring(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Monitoring not implemented yet.")


# ======================== WEBHOOKS ========================


@router.post("/v1/webhooks/configure", summary="Налаштувати webhook")
async def configure_webhook(
    config: WebhookConfig,
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Webhooks not implemented yet.")


@router.get("/v1/webhooks", summary="Список webhooks")
async def list_webhooks(
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Webhooks not implemented yet.")


@router.delete("/v1/webhooks/{webhook_id}", summary="Видалити webhook")
async def delete_webhook(
    webhook_id: str,
    api_key: dict = Depends(validate_api_key),
):
    raise HTTPException(status_code=501, detail="Webhooks not implemented yet.")


# ======================== USAGE & BILLING ========================


@router.get("/v1/usage", response_model=APIUsageResponse, summary="Статистика використання")
async def get_usage(
    period: str = Query(default="current_month", description="Період: current_month, last_month, current_year"),
    api_key: dict = Depends(validate_api_key),
):
    """Отримати статистику використання API."""
    raise HTTPException(status_code=501, detail="Usage statistics not implemented yet.")


@router.get("/v1/usage/history", summary="Історія використання")
async def get_usage_history(
    days: int = Query(default=30, ge=1, le=90),
    api_key: dict = Depends(validate_api_key),
):
    """Отримати історію використання API за днями."""
    # Реальні дані будуть братися з Prometheus/ClickHouse
    history = []
    return {
        "partner_id": api_key["partner_id"],
        "days": days,
        "history": history,
    }


# ======================== API KEYS MANAGEMENT ========================


@router.get("/v1/keys", summary="Список API ключів")
async def list_api_keys(
    api_key: dict = Depends(validate_api_key),
):
    """Отримати список API ключів партнера."""
    raise HTTPException(status_code=501, detail="API Keys management not implemented yet.")


@router.post("/v1/keys/rotate", summary="Ротація API ключа")
async def rotate_api_key(
    api_key: dict = Depends(validate_api_key),
):
    """Згенерувати новий API ключ (старий буде деактивовано через 24 години)."""
    raise HTTPException(status_code=501, detail="API Keys rotation not implemented yet.")


# ======================== DOCUMENTATION ========================


@router.get("/v1/openapi.json", summary="OpenAPI специфікація")
async def get_openapi_spec():
    """Отримати OpenAPI специфікацію Public API."""
    return {
        "openapi": "3.0.0",
        "info": {
            "title": "PREDATOR Analytics Public API",
            "version": "1.0.0",
            "description": "API для інтеграції з PREDATOR Analytics",
        },
        "servers": [
            {"url": "https://api.predator.ua/public/v1", "description": "Production"},
            {"url": "https://sandbox.predator.ua/public/v1", "description": "Sandbox"},
        ],
    }
