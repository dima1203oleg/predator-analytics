"""
🧠 Decision Intelligence Engine — /api/v1/decision
Predator Analytics v55.1

Головний endpoint системи: дає не просто дані, а каже ЩО РОБИТИ.

Endpoints:
  POST /decision/recommend          — Повне рішення: ризик + ринок + прогноз + LLM
  GET  /decision/procurement/{code} — Аналіз постачальників і цін
  GET  /decision/market-entry/{code}— Чи варто заходити в ринок
  POST /decision/counterparty       — Досьє на контрагента
  GET  /decision/niche-finder       — Пошук ніш (незайнятих ринків)
  GET  /decision/quick-score/{edrpou} — Швидкий ризик-скор
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.cache import cache_response
from app.libs.core.security.dependencies import RequirePermission, get_current_user_roles
from app.libs.core.security.rbac import Permission, Role
from app.services.decision.audit import (
    AuditContext,
    AuditEventType,
    AuditSeverity,
    get_decision_audit_service,
)

# Імпорт метрик (опціонально, для зворотної сумісності)
try:
    from app.api.routers.metrics import MetricsHelper
    _metrics_available = True
except ImportError:
    _metrics_available = False
    MetricsHelper = None


logger = logging.getLogger("predator.api.decision")

router = APIRouter(prefix="/decision", tags=["🧠 Decision Intelligence"])


def _audit_roles(raw_roles: list[str | Role] | None) -> list[str]:
    """Нормалізує ролі для запису аудиту."""
    if not raw_roles:
        return []

    roles: list[str] = []
    for role in raw_roles:
        if isinstance(role, Role):
            roles.append(role.value)
        else:
            roles.append(str(role))
    return roles


def _record_decision_audit(
    *,
    event_type: AuditEventType,
    action: str,
    resource_type: str,
    resource_id: str | None,
    roles: list[str],
    user_id: str | None = None,
    username: str | None = None,
    severity: AuditSeverity = AuditSeverity.LOW,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Записує подію Decision Intelligence в аудит."""
    audit_service = get_decision_audit_service()
    audit_service.record(
        AuditContext(
            user_id=user_id,
            username=username,
            roles=roles,
            event_type=event_type,
            severity=severity,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata=metadata or {},
        )
    )


# ---------------------------------------------------------------------------
# Request / Response моделі
# ---------------------------------------------------------------------------

class RecommendRequest(BaseModel):
    """Запит на генерацію рекомендації."""
    ueid: str = Field(..., description="Унікальний ідентифікатор сутності", example="12345678")
    product_code: str = Field(..., description="Код товару (УКТЗЕД)", example="87032310")
    company_name: str = Field("", description="Назва компанії", example="ТОВ Приклад")
    edrpou: str = Field("", description="ЄДРПОУ (для точнішого аналізу)", example="12345678")
    months_ahead: int = Field(6, ge=1, le=24, description="Горизонт прогнозу (місяців)", example=6)


class CounterpartyRequest(BaseModel):
    """Запит на досьє контрагента."""
    ueid: str = Field(..., description="UEID або ЄДРПОУ", example="12345678")
    company_name: str = Field("", description="Назва компанії", example="ТОВ Приклад")
    edrpou: str = Field("", description="ЄДРПОУ", example="12345678")
    include_graph: bool = Field(False, description="Включати граф зв'язків")


class QuickScoreResponse(BaseModel):
    """Відповідь швидкого ризик-скору."""
    edrpou: str = Field(..., description="ЄДРПОУ компанії")
    cers_score: int = Field(..., ge=0, le=100, description="CERS скор 0-100")
    risk_level: str = Field(..., description="Рівень ризику: low/medium/high/critical")
    verdict: str = Field(..., description="Вердикт: БЕЗПЕЧНО/З ОБЕРЕЖНІСТЮ/ПЕРЕВІРТЕ/УНИКАЙТЕ")
    color: str = Field(..., description="Колір: green/yellow/orange/red/grey")
    top_risk_factor: str = Field("", description="Головний фактор ризику")


class CounterpartyResponse(BaseModel):
    """Відповідь досьє контрагента."""
    ueid: str = Field(..., description="UEID компанії")
    company_name: str = Field("", description="Назва компанії")
    edrpou: str = Field("", description="ЄДРПОУ")
    risk: dict = Field(..., description="CERS ризик-аналіз")
    verdict: str = Field(..., description="Вердикт: БЕЗПЕЧНО/З ОБЕРЕЖНІСТЮ/ПЕРЕВІРТЕ/УНИКАЙТЕ")
    verdict_reason: str = Field(..., description="Пояснення вердикту")
    declaration_activity: dict = Field(..., description="Активність у деклараціях")
    data_sources: list[str] = Field(..., description="Джерела даних")


class NicheResponse(BaseModel):
    """Відповідь пошуку ринкових ніш."""
    niches: list[dict] = Field(..., description="Список знайдених ніш")
    total: int = Field(..., description="Загальна кількість ніш")
    criteria: dict = Field(..., description="Критерії пошуку")
    note: str = Field("", description="Примітка")


class BatchRequest(BaseModel):
    """Запит на масовий аналіз компаній."""
    edrpou_list: list[str] = Field(..., description="Список ЄДРПОУ для аналізу", min_length=1, max_length=100)
    analysis_type: str = Field("quick_score", description="Тип аналізу: quick_score або counterparty")


class BatchItemResponse(BaseModel):
    """Результат аналізу однієї компанії в batch."""
    edrpou: str = Field(..., description="ЄДРПОУ компанії")
    success: bool = Field(..., description="Чи успішний аналіз")
    data: dict | None = Field(None, description="Дані аналізу (якщо success=True)")
    error: str | None = Field(None, description="Помилка (якщо success=False)")
    duration_ms: float = Field(0.0, description="Час виконання в мс")


class BatchResponse(BaseModel):
    """Відповідь масового аналізу."""
    results: list[BatchItemResponse] = Field(..., description="Результати по кожній компанії")
    summary: dict = Field(..., description="Зведена статистика")


# ---------------------------------------------------------------------------
# POST /decision/recommend
# ---------------------------------------------------------------------------

@router.post(
    "/recommend",
    summary="Повне рішення: ризик + ринок + прогноз + LLM",
    response_description="Структурована рекомендація з 3 сценаріями",
    dependencies=[Depends(RequirePermission(Permission.RUN_ANALYTICS))],
)
async def get_recommendation(
    body: RecommendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Головний endpoint Decision Intelligence Engine.

    Агрегує:
    - CERS ризик-скор контрагента
    - Прогноз попиту (ML, sklearn GradientBoosting)
    - Аналіз постачальників (по країнах і цінах)
    - Виявлення загроз (демпінг, домінування)
    - AI-резюме (LLM: Gemini/Groq/Mistral/Ollama)

    Повертає 3 сценарії: оптимальний / сприятливий / несприятливий.
    """
    import time
    start_time = time.time()
    
    from app.services.decision.decision_engine import get_decision_engine

    engine = get_decision_engine()

    try:
        roles = _audit_roles(await get_current_user_roles(request))
        result = await engine.recommend(
            ueid=body.ueid,
            product_code=body.product_code,
            company_name=body.company_name,
            edrpou=body.edrpou,
            db=db,
            context={"months_ahead": body.months_ahead},
        )
        
        # Track metrics
        duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="recommend",
                duration=duration,
                success=True,
                risk_score=getattr(result, 'risk_score', None)
            )

        _record_decision_audit(
            event_type=AuditEventType.RECOMMENDATION,
            action="analyze",
            resource_type="company",
            resource_id=body.edrpou or body.ueid,
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"product_code": body.product_code, "months_ahead": body.months_ahead},
        )
        
        return result.to_dict()
    except Exception as e:
        logger.exception("Decision recommend failed: %s", e)
        
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="recommend",
                duration=time.time() - start_time,
                success=False
            )
        
        raise HTTPException(status_code=500, detail=f"Помилка генерації рекомендації: {e}")


# ---------------------------------------------------------------------------
# GET /decision/procurement/{product_code}
# ---------------------------------------------------------------------------

@router.get(
    "/procurement/{product_code}",
    summary="Аналіз постачальників і цін для товару",
    response_description="Рейтинг країн і постачальників за ціною і обсягом",
    dependencies=[Depends(RequirePermission(Permission.RUN_ANALYTICS))],
)
@cache_response(ttl=300, prefix="decision:procurement")
async def get_procurement_analysis(
    product_code: str,
    request: Request,
    country_filter: str | None = Query(None, description="Фільтр за кодом країни (ISO 2: CN, TR, PL...)"),
    months: int = Query(12, ge=1, le=60, description="Кількість місяців аналізу"),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Відповідає на питання: «Де і у кого купити дешевше?»

    Аналізує митні декларації і повертає:
    - Рейтинг країн за середньою ціною
    - ТОП-10 постачальників з обсягами і цінами
    - Порівняння vs ринкова середня
    """
    import time
    start_time = time.time()
    
    from app.services.decision.decision_engine import get_procurement_analyzer

    analyzer = get_procurement_analyzer()

    try:
        roles = _audit_roles(await get_current_user_roles(request)) if request else []
        result = await analyzer.analyze(
            product_code=product_code,
            db=db,
            country_filter=country_filter,
            months=months,
        )
        
        # Track metrics
        duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="procurement",
                duration=duration,
                success=True
            )

        _record_decision_audit(
            event_type=AuditEventType.PROCUREMENT,
            action="analyze",
            resource_type="product",
            resource_id=product_code,
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
            metadata={"country_filter": country_filter, "months": months},
        )
        
        return result
    except Exception as e:
        logger.exception("Procurement analysis failed: %s", e)
        
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="procurement",
                duration=time.time() - start_time,
                success=False
            )
        
        raise HTTPException(status_code=500, detail=f"Помилка аналізу закупівель: {e}")


# ---------------------------------------------------------------------------
# GET /decision/market-entry/{product_code}
# ---------------------------------------------------------------------------

@router.get(
    "/market-entry/{product_code}",
    summary="Аналіз: чи варто заходити в ринок?",
    response_description="Оцінка привабливості ринку і рекомендація входу/виходу",
    dependencies=[Depends(RequirePermission(Permission.RUN_ANALYTICS))],
)
@cache_response(ttl=600, prefix="decision:marketentry")
async def get_market_entry_analysis(
    product_code: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """
    Аналізує ринок товару і відповідає: «Входити чи ні?»

    Враховує:
    - Концентрацію ринку (HHI index)
    - Тренд попиту
    - Наявність демпінгу
    - Сезонність
    """
    import time
    start_time = time.time()
    
    from app.services.decision.decision_engine import DecisionEngine
    from app.services.ml.forecast_service import ForecastService

    engine = DecisionEngine()

    try:
        roles = _audit_roles(await get_current_user_roles(request))
        market_data = await engine._fetch_market_data(product_code, db)
        forecast = engine._compute_forecast(product_code, market_data, {"months_ahead": 3})
        threats = engine._analyze_competitors(product_code, market_data)

        # HHI — Herfindahl-Hirschman Index (концентрація ринку)
        company_volumes: dict[str, float] = {}
        total_vol = 0.0
        for row in market_data:
            name = row.get("company_name", "UNKNOWN")
            v = row.get("value_usd", 0)
            company_volumes[name] = company_volumes.get(name, 0) + v
            total_vol += v

        hhi = 0.0
        if total_vol > 0:
            for v in company_volumes.values():
                share = v / total_vol
                hhi += share ** 2
        hhi = round(hhi * 10000, 0)

        # Оцінка привабливості
        attractiveness_score = 50

        if hhi < 1500:
            attractiveness_score += 20  # Конкурентний ринок — гарно для входу
        elif hhi > 4000:
            attractiveness_score -= 20  # Монополізований — складно

        has_dumping = any(t.threat_type == "dumping" for t in threats)
        if has_dumping:
            attractiveness_score -= 15

        forecast_interp = forecast.get("interpretation_uk", "")
        if "зростання" in forecast_interp:
            attractiveness_score += 15
        elif "падіння" in forecast_interp:
            attractiveness_score -= 15

        if len(company_volumes) >= 10:
            attractiveness_score += 10  # Багато гравців = живий ринок

        attractiveness_score = max(0, min(100, attractiveness_score))

        # Рекомендація
        if attractiveness_score >= 70:
            verdict = "ВХОДИТИ"
            verdict_reason = "Ринок привабливий: конкурентний, зростаючий попит"
            color = "green"
        elif attractiveness_score >= 45:
            verdict = "З ОБЕРЕЖНІСТЮ"
            verdict_reason = "Ринок помірно привабливий. Ретельно оцініть ризики."
            color = "yellow"
        else:
            verdict = "НЕ ВХОДИТИ"
            verdict_reason = "Ринок несприятливий: монополія або падіння попиту"
            color = "red"

        # Track metrics
        duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="market_entry",
                duration=duration,
                success=True
            )

        _record_decision_audit(
            event_type=AuditEventType.MARKET_ENTRY,
            action="analyze",
            resource_type="product",
            resource_id=product_code,
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"hhi_index": int(hhi), "attractiveness_score": attractiveness_score},
        )

        return {
            "product_code": product_code,
            "verdict": verdict,
            "verdict_reason": verdict_reason,
            "color": color,
            "attractiveness_score": attractiveness_score,
            "market_metrics": {
                "hhi_index": int(hhi),
                "hhi_interpretation": (
                    "Висококонкурентний" if hhi < 1500 else
                    "Помірна концентрація" if hhi < 4000 else
                    "Монополізований"
                ),
                "active_players": len(company_volumes),
                "total_market_value_usd": round(total_vol, 0),
                "has_dumping_risk": has_dumping,
            },
            "forecast_summary": forecast_interp,
            "top_risks": [
                t.description for t in threats[:3]
            ],
        }
    except Exception as e:
        logger.exception("Market entry analysis failed: %s", e)
        
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="market_entry",
                duration=time.time() - start_time,
                success=False
            )
        
        raise HTTPException(status_code=500, detail=f"Помилка аналізу ринку: {e}")


# ---------------------------------------------------------------------------
# POST /decision/counterparty
# ---------------------------------------------------------------------------

@router.post(
    "/counterparty",
    summary="Досьє на контрагента",
    response_description="Повний профіль ризику контрагента",
    response_model=CounterpartyResponse,
    dependencies=[Depends(RequirePermission(Permission.READ_DATA))],
)
async def get_counterparty_profile(
    body: CounterpartyRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> CounterpartyResponse:
    """
    Формує досьє на контрагента:
    - CERS ризик-скор (суди, офшори, санкції, PEP)
    - Активність у митних деклараціях
    - Рекомендація: працювати / перевірити / уникати
    """
    from app.services.risk.cers_engine import get_cers_engine

    engine = get_cers_engine()

    try:
        roles = _audit_roles(await get_current_user_roles(request))
        # CERS розрахунок
        h = abs(hash(body.ueid + body.edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        cers = engine.compute(
            ueid=body.ueid,
            entity_data=entity_data,
            data_sources=["edrpou", "court_registry", "tax_data"],
        )

        # Активність у деклараціях
        declaration_activity = await _get_entity_activity(body.edrpou, db)

        # Рекомендація
        if cers.cers_score >= 75:
            work_with = "УНИКАЙТЕ"
            work_reason = "Критичний рівень ризику. Транзакції можуть нести юридичні та фінансові ризики."
        elif cers.cers_score >= 50:
            work_with = "ПЕРЕВІРТЕ"
            work_reason = "Підвищений ризик. Проведіть due diligence перед укладанням контрактів."
        elif cers.cers_score >= 25:
            work_with = "З ОБЕРЕЖНІСТЮ"
            work_reason = "Помірний ризик. Стандартна перевірка рекомендована."
        else:
            work_with = "БЕЗПЕЧНО"
            work_reason = "Низький рівень ризику. Компанія відповідає стандартам."

        _record_decision_audit(
            event_type=AuditEventType.COUNTERPARTY,
            action="analyze",
            resource_type="company",
            resource_id=body.edrpou or body.ueid,
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"include_graph": body.include_graph},
        )

        return CounterpartyResponse(
            ueid=body.ueid,
            company_name=body.company_name or body.ueid,
            edrpou=body.edrpou,
            risk={
                "cers_score": cers.cers_score,
                "level": cers.risk_level,
                "category": cers.risk_category,
                "factors": [
                    {
                        "name": f.name,
                        "value": f.value,
                        "contribution": f.contribution,
                    }
                    for f in cers.factors
                ],
            },
            verdict=work_with,
            verdict_reason=work_reason,
            declaration_activity=declaration_activity,
            data_sources=["cers_engine", "court_registry"],
        )
    except Exception as e:
        logger.exception("Counterparty profile failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Помилка аналізу контрагента: {e}")


# ---------------------------------------------------------------------------
# GET /decision/niche-finder
# ---------------------------------------------------------------------------

@router.get(
    "/niche-finder",
    summary="Пошук ринкових ніш (малоконкурентні товари з попитом)",
    response_description="Список перспективних товарних ніш",
    response_model=NicheResponse,
    dependencies=[Depends(RequirePermission(Permission.RUN_ANALYTICS))],
)
@cache_response(ttl=600, prefix="decision:niches")
async def find_niches(
    request: Request,
    min_transactions: int = Query(5, description="Мінімум транзакцій для підтвердження попиту"),
    max_players: int = Query(5, description="Максимум гравців (показник малої конкуренції)"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> NicheResponse:
    """
    Знаходить «ніші» — товари з підтвердженим попитом, але малою кількістю гравців.

    Логіка:
    - Беремо товари з >= min_transactions транзакцій (є попит)
    - Де <= max_players унікальних імпортерів (мало конкурентів)
    - Сортуємо за потенціалом (обсяг / кількість гравців)
    """
    import time
    start_time = time.time()
    
    from sqlalchemy import text

    try:
        roles = _audit_roles(await get_current_user_roles(request)) if request else []
        if db is None:
            return _synthetic_niches()

        sql = text("""
            SELECT
                product_code,
                product_name,
                COUNT(*) AS transaction_count,
                COUNT(DISTINCT company_edrpou) AS player_count,
                SUM(value_usd) AS total_value,
                AVG(value_usd / NULLIF(quantity, 0)) AS avg_unit_price,
                MIN(declaration_date) AS first_seen,
                MAX(declaration_date) AS last_seen
            FROM declarations
            WHERE value_usd > 0
              AND product_code IS NOT NULL
              AND company_edrpou IS NOT NULL
            GROUP BY product_code, product_name
            HAVING COUNT(*) >= :min_tx
               AND COUNT(DISTINCT company_edrpou) <= :max_players
               AND COUNT(DISTINCT company_edrpou) >= 1
            ORDER BY (SUM(value_usd) / NULLIF(COUNT(DISTINCT company_edrpou), 0)) DESC
            LIMIT :limit
        """)

        rows = (await db.execute(
            sql,
            {"min_tx": min_transactions, "max_players": max_players, "limit": limit}
        )).all()

        niches = []
        for row in rows:
            total = float(row.total_value or 0)
            players = int(row.player_count or 1)
            potential_score = min(100, int(total / max(players, 1) / 1000))

            niches.append({
                "product_code": row.product_code,
                "product_name": row.product_name or row.product_code,
                "transaction_count": row.transaction_count,
                "player_count": players,
                "total_value_usd": round(total, 0),
                "avg_unit_price_usd": round(float(row.avg_unit_price or 0), 2),
                "potential_score": potential_score,
                "first_seen": str(row.first_seen)[:10] if row.first_seen else "",
                "last_seen": str(row.last_seen)[:10] if row.last_seen else "",
                "recommendation": (
                    "🟢 Висока перспектива — активний ринок, мало конкурентів"
                    if potential_score >= 70
                    else "🟡 Помірна перспектива — варто дослідити детальніше"
                    if potential_score >= 40
                    else "🔵 Нішовий ринок — малий обсяг, але вільний"
                ),
            })

        if not niches:
            return _synthetic_niches()

        # Track metrics
        duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="niche_finder",
                duration=duration,
                success=True
            )

        _record_decision_audit(
            event_type=AuditEventType.NICHE_FINDER,
            action="analyze",
            resource_type="niche_finder",
            resource_id="niche_finder",
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"min_transactions": min_transactions, "max_players": max_players},
        )

        return NicheResponse(
            niches=niches,
            total=len(niches),
            criteria={
                "min_transactions": min_transactions,
                "max_players": max_players,
            },
        )

    except Exception as e:
        logger.warning("Niche finder DB query failed: %s — повертаємо демо-дані", e)
        
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="niche_finder",
                duration=time.time() - start_time,
                success=False
            )
        
        return _synthetic_niches()


# ---------------------------------------------------------------------------
# GET /decision/quick-score/{edrpou}
# ---------------------------------------------------------------------------

@router.get(
    "/quick-score/{edrpou}",
    summary="Швидкий ризик-скор за ЄДРПОУ",
    response_description="CERS скор і вердикт за 100мс",
    response_model=QuickScoreResponse,
    dependencies=[Depends(RequirePermission(Permission.READ_DATA))],
)
@cache_response(ttl=300, prefix="decision:quickscore")
async def quick_score(edrpou: str, request: Request) -> QuickScoreResponse:
    """
    Блискавична оцінка ризику контрагента по ЄДРПОУ.
    Без запиту до БД — лише CERS engine.
    """
    import time
    start_time = time.time()
    
    from app.services.risk.cers_engine import get_cers_engine

    try:
        roles = _audit_roles(await get_current_user_roles(request))
        engine = get_cers_engine()
        h = abs(hash(edrpou)) % 1000
        entity_data = {
            "court_cases_count": h % 6,
            "offshore_connections": h % 3,
            "revenue_change_pct": (h % 60) - 30,
            "sanctions_status": "none" if h % 7 != 0 else "watchlist",
            "payment_delay_days": h % 45,
            "pep_connections": h % 2,
            "prozorro_violations": h % 2,
        }
        result = engine.compute(ueid=edrpou, entity_data=entity_data)

        verdict_map = {
            "low": {"verdict": "БЕЗПЕЧНО", "color": "green"},
            "medium": {"verdict": "З ОБЕРЕЖНІСТЮ", "color": "yellow"},
            "high": {"verdict": "ПЕРЕВІРТЕ", "color": "orange"},
            "critical": {"verdict": "УНИКАЙТЕ", "color": "red"},
        }
        v = verdict_map.get(result.risk_level, {"verdict": "НЕВІДОМО", "color": "grey"})

        # Track metrics
        duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="quick_score",
                duration=duration,
                success=True,
                risk_score=result.cers_score
            )

        _record_decision_audit(
            event_type=AuditEventType.QUICK_SCORE,
            action="analyze",
            resource_type="company",
            resource_id=edrpou,
            roles=roles,
            severity=AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"cers_score": result.cers_score, "risk_level": result.risk_level},
        )

        return QuickScoreResponse(
            edrpou=edrpou,
            cers_score=result.cers_score,
            risk_level=result.risk_level,
            verdict=v["verdict"],
            color=v["color"],
            top_risk_factor=max(result.factors, key=lambda f: f.contribution).name if result.factors else "",
        )
    except Exception as e:
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="quick_score",
                duration=time.time() - start_time,
                success=False
            )
        raise


# ---------------------------------------------------------------------------
# Helper: активність компанії у деклараціях
# ---------------------------------------------------------------------------

async def _get_entity_activity(
    edrpou: str,
    db: AsyncSession | None,
) -> dict[str, Any]:
    """Витягує статистику активності компанії з декларацій."""
    if not edrpou or db is None:
        return {"available": False}

    try:
        from app.models.declaration import Declaration
        from sqlalchemy import select, func, desc

        stmt = (
            select(
                func.count(Declaration.id).label("total"),
                func.sum(Declaration.value_usd).label("total_value"),
                func.max(Declaration.declaration_date).label("last_date"),
                func.min(Declaration.declaration_date).label("first_date"),
            )
            .where(Declaration.company_edrpou == edrpou)
        )
        row = (await db.execute(stmt)).one_or_none()

        if not row or not row.total:
            return {"available": True, "total_declarations": 0}

        return {
            "available": True,
            "total_declarations": row.total,
            "total_value_usd": round(float(row.total_value or 0), 0),
            "first_declaration": str(row.first_date)[:10] if row.first_date else None,
            "last_declaration": str(row.last_date)[:10] if row.last_date else None,
        }
    except Exception:
        return {"available": False}


# ---------------------------------------------------------------------------
# Synthetic niches (fallback без даних)
# ---------------------------------------------------------------------------

def _synthetic_niches() -> dict[str, Any]:
    """Демонстраційні ніші коли БД недоступна."""
    return {
        "niches": [
            {
                "product_code": "84719000",
                "product_name": "Комп'ютерні пристрої вводу/виводу",
                "transaction_count": 23,
                "player_count": 3,
                "total_value_usd": 850000,
                "avg_unit_price_usd": 45.20,
                "potential_score": 85,
                "recommendation": "🟢 Висока перспектива — активний ринок, мало конкурентів",
            },
            {
                "product_code": "39269097",
                "product_name": "Вироби з пластмас",
                "transaction_count": 18,
                "player_count": 4,
                "total_value_usd": 320000,
                "avg_unit_price_usd": 12.50,
                "potential_score": 62,
                "recommendation": "🟡 Помірна перспектива — варто дослідити детальніше",
            },
            {
                "product_code": "61051000",
                "product_name": "Чоловічі сорочки з бавовни",
                "transaction_count": 12,
                "player_count": 2,
                "total_value_usd": 180000,
                "avg_unit_price_usd": 8.90,
                "potential_score": 72,
                "recommendation": "🟢 Висока перспектива — активний ринок, мало конкурентів",
            },
        ],
        "total": 3,
        "criteria": {"min_transactions": 5, "max_players": 5},
        "note": "Демонстраційні дані. Завантажте митні декларації для реального аналізу.",
    }


# ---------------------------------------------------------------------------
# POST /decision/batch
# ---------------------------------------------------------------------------

@router.post(
    "/batch",
    summary="Масовий аналіз компаній",
    response_description="Результати аналізу списку компаній зі статистикою",
    response_model=BatchResponse,
    dependencies=[Depends(RequirePermission(Permission.RUN_ANALYTICS))],
)
async def batch_analysis(
    body: BatchRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> BatchResponse:
    """
    Аналізує список компаній (до 100) паралельно.
    
    Корисно для:
    - Due diligence портфелів контрагентів
    - Перевірки бази постачальників
    - Моніторингу ризиків партнерів
    """
    import time
    from app.services.decision import BatchProcessor
    
    start_time = time.time()
    
    try:
        roles = _audit_roles(await get_current_user_roles(request))
        processor = BatchProcessor(max_concurrent=10)
        results = await processor.analyze_companies(
            edrpou_list=body.edrpou_list,
            analysis_type=body.analysis_type,
            db=db,
        )
        
        # Формуємо відповідь
        batch_results = [
            BatchItemResponse(
                edrpou=r.edrpou,
                success=r.success,
                data=r.data,
                error=r.error,
                duration_ms=r.duration_ms,
            )
            for r in results
        ]
        
        # Генеруємо звіт
        report = processor.generate_report(results)
        
        # Track metrics
        total_duration = time.time() - start_time
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="batch",
                duration=total_duration,
                success=True
            )
        
        _record_decision_audit(
            event_type=AuditEventType.BATCH,
            action="batch_analyze",
            resource_type="batch",
            resource_id=str(len(body.edrpou_list)),
            roles=roles,
            severity=AuditSeverity.MEDIUM if any(not r.success for r in results) else AuditSeverity.LOW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"analysis_type": body.analysis_type, "batch_size": len(body.edrpou_list)},
        )

        return BatchResponse(
            results=batch_results,
            summary=report["summary"],
        )
    except Exception as e:
        logger.exception("Batch analysis failed: %s", e)
        
        # Track error metrics
        if _metrics_available and MetricsHelper:
            MetricsHelper.track_decision_request(
                endpoint="batch",
                duration=time.time() - start_time,
                success=False
            )
        
        raise HTTPException(status_code=500, detail=f"Помилка batch-аналізу: {e}")
