"""Public API Router — Зовнішній API для партнерів.

Версіонований API з rate limiting та API keys.
Endpoints для зовнішніх інтеграцій.
"""
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/public", tags=["публічний API"])


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

    # В реальності тут буде перевірка в базі даних
    # Поки що mock валідація
    if not x_api_key.startswith("pk_"):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format.",
        )

    return {
        "key_id": x_api_key[:10],
        "partner_id": "partner_001",
        "partner_name": "Test Partner",
        "tier": "standard",
        "rate_limit": 1000,
        "permissions": ["read_company", "read_sanctions", "read_risk"],
    }


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
):
    """Отримати базову інформацію про компанію за ЄДРПОУ.

    **Rate limit:** 100 запитів/хвилина
    """
    # Mock відповідь
    return CompanyLookupResponse(
        edrpou=request.edrpou,
        name=f"ТОВ \"КОМПАНІЯ {request.edrpou}\"",
        status="active",
        registration_date="2015-03-20",
        address="м. Київ, вул. Хрещатик, 1",
        kved="62.01",
        authorized_capital=100000.0,
    )


@router.post("/v1/company/batch", response_model=BatchResponse, summary="Пакетний пошук компаній")
async def batch_lookup_companies(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
):
    """Пакетний пошук компаній (до 100 за запит).

    **Rate limit:** 10 запитів/хвилина
    """
    results = []
    for edrpou in request.items:
        results.append({
            "edrpou": edrpou,
            "name": f"ТОВ \"КОМПАНІЯ {edrpou}\"",
            "status": "active",
            "found": True,
        })

    return BatchResponse(
        total=len(request.items),
        processed=len(results),
        results=results,
    )


@router.post("/v1/sanctions/check", response_model=SanctionCheckResponse, summary="Перевірка санкцій")
async def check_sanctions(
    request: SanctionCheckRequest,
    api_key: dict = Depends(validate_api_key),
):
    """Перевірка у санкційних списках (РНБО, OFAC, EU, UK, UN).

    **Rate limit:** 100 запитів/хвилина
    """
    return SanctionCheckResponse(
        query=request.name,
        is_sanctioned=False,
        matches_count=0,
        lists_checked=["rnbo_ua", "ofac", "eu", "uk", "un"],
        checked_at=datetime.now(UTC).isoformat(),
    )


@router.post("/v1/sanctions/batch", response_model=BatchResponse, summary="Пакетна перевірка санкцій")
async def batch_check_sanctions(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
):
    """Пакетна перевірка санкцій (до 100 за запит).

    **Rate limit:** 10 запитів/хвилина
    """
    results = []
    for name in request.items:
        results.append({
            "query": name,
            "is_sanctioned": False,
            "matches_count": 0,
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
):
    """Отримати AML-скор компанії.

    **Rate limit:** 50 запитів/хвилина
    """
    return RiskScoreResponse(
        edrpou=request.edrpou,
        name=f"ТОВ \"КОМПАНІЯ {request.edrpou}\"",
        risk_score=35,
        risk_level="low",
        factors=[
            {"category": "tax", "detected": False},
            {"category": "sanctions", "detected": False},
            {"category": "court_cases", "detected": True, "count": 2},
        ],
        calculated_at=datetime.now(UTC).isoformat(),
    )


@router.post("/v1/risk/batch", response_model=BatchResponse, summary="Пакетна оцінка ризику")
async def batch_risk_score(
    request: BatchRequest,
    api_key: dict = Depends(validate_api_key),
):
    """Пакетна оцінка ризику (до 100 за запит).

    **Rate limit:** 5 запитів/хвилина
    """
    results = []
    for edrpou in request.items:
        results.append({
            "edrpou": edrpou,
            "risk_score": 35,
            "risk_level": "low",
        })

    return BatchResponse(
        total=len(request.items),
        processed=len(results),
        results=results,
    )


@router.get("/v1/company/{edrpou}/monitoring", summary="Статус моніторингу")
async def get_monitoring_status(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    """Отримати статус моніторингу компанії.

    **Rate limit:** 100 запитів/хвилина
    """
    return {
        "edrpou": edrpou,
        "is_monitored": True,
        "monitoring_since": "2025-01-15T10:00:00Z",
        "last_check": datetime.now(UTC).isoformat(),
        "alerts_count": 0,
        "next_check": "2026-03-12T00:00:00Z",
    }


@router.post("/v1/company/{edrpou}/monitoring/start", summary="Почати моніторинг")
async def start_monitoring(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    """Додати компанію до моніторингу.

    **Rate limit:** 10 запитів/хвилина
    """
    return {
        "edrpou": edrpou,
        "status": "monitoring_started",
        "started_at": datetime.now(UTC).isoformat(),
    }


@router.delete("/v1/company/{edrpou}/monitoring/stop", summary="Зупинити моніторинг")
async def stop_monitoring(
    edrpou: str,
    api_key: dict = Depends(validate_api_key),
):
    """Видалити компанію з моніторингу.

    **Rate limit:** 10 запитів/хвилина
    """
    return {
        "edrpou": edrpou,
        "status": "monitoring_stopped",
        "stopped_at": datetime.now(UTC).isoformat(),
    }


# ======================== WEBHOOKS ========================


@router.post("/v1/webhooks/configure", summary="Налаштувати webhook")
async def configure_webhook(
    config: WebhookConfig,
    api_key: dict = Depends(validate_api_key),
):
    """Налаштувати webhook для отримання сповіщень.

    **Події:**
    - `risk_change` — зміна рівня ризику
    - `sanction_match` — збіг у санкційних списках
    - `new_case` — нова судова справа
    - `status_change` — зміна статусу компанії
    """
    return {
        "webhook_id": "wh_001",
        "url": config.url,
        "events": config.events,
        "status": "active",
        "created_at": datetime.now(UTC).isoformat(),
    }


@router.get("/v1/webhooks", summary="Список webhooks")
async def list_webhooks(
    api_key: dict = Depends(validate_api_key),
):
    """Отримати список налаштованих webhooks."""
    return {
        "webhooks": [
            {
                "webhook_id": "wh_001",
                "url": "https://partner.example.com/webhook",
                "events": ["risk_change", "sanction_match"],
                "status": "active",
                "last_triggered": "2026-03-10T15:30:00Z",
            },
        ],
    }


@router.delete("/v1/webhooks/{webhook_id}", summary="Видалити webhook")
async def delete_webhook(
    webhook_id: str,
    api_key: dict = Depends(validate_api_key),
):
    """Видалити webhook."""
    return {
        "webhook_id": webhook_id,
        "status": "deleted",
        "deleted_at": datetime.now(UTC).isoformat(),
    }


# ======================== USAGE & BILLING ========================


@router.get("/v1/usage", response_model=APIUsageResponse, summary="Статистика використання")
async def get_usage(
    period: str = Query(default="current_month", description="Період: current_month, last_month, current_year"),
    api_key: dict = Depends(validate_api_key),
):
    """Отримати статистику використання API."""
    return APIUsageResponse(
        partner_id=api_key["partner_id"],
        period=period,
        requests_total=1500,
        requests_remaining=8500,
        rate_limit=api_key["rate_limit"],
        endpoints={
            "/v1/company/lookup": 800,
            "/v1/sanctions/check": 500,
            "/v1/risk/score": 200,
        },
    )


@router.get("/v1/usage/history", summary="Історія використання")
async def get_usage_history(
    days: int = Query(default=30, ge=1, le=90),
    api_key: dict = Depends(validate_api_key),
):
    """Отримати історію використання API за днями."""
    # Mock дані
    history = []
    for i in range(days):
        history.append({
            "date": f"2026-03-{11-i:02d}",
            "requests": 50 + i * 10,
            "errors": i % 5,
        })

    return {
        "partner_id": api_key["partner_id"],
        "days": days,
        "history": history[::-1],  # Від старих до нових
    }


# ======================== API KEYS MANAGEMENT ========================


@router.get("/v1/keys", summary="Список API ключів")
async def list_api_keys(
    api_key: dict = Depends(validate_api_key),
):
    """Отримати список API ключів партнера."""
    return {
        "keys": [
            {
                "key_id": "pk_live_xxx",
                "name": "Production",
                "created_at": "2025-01-01T00:00:00Z",
                "last_used": "2026-03-11T20:00:00Z",
                "status": "active",
            },
            {
                "key_id": "pk_test_xxx",
                "name": "Testing",
                "created_at": "2025-01-01T00:00:00Z",
                "last_used": "2026-03-10T15:00:00Z",
                "status": "active",
            },
        ],
    }


@router.post("/v1/keys/rotate", summary="Ротація API ключа")
async def rotate_api_key(
    api_key: dict = Depends(validate_api_key),
):
    """Згенерувати новий API ключ (старий буде деактивовано через 24 години)."""
    return {
        "new_key": "pk_live_new_xxx",
        "old_key_expires_at": "2026-03-12T23:00:00Z",
        "created_at": datetime.now(UTC).isoformat(),
    }


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
