"""Trade Intelligence Router — санкції, торгові потоки, офшори, митниця."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/trade", tags=["Trade Intelligence"])


# ======================== REQUEST MODELS ========================


class SanctionsCheckRequest(BaseModel):
    """Запит на перевірку санкцій."""

    query: str = Field(..., description="Назва компанії, ім'я особи або судна")
    entity_type: str = Field(default="auto", description="company | person | vessel | auto")
    fuzzy_match: bool = Field(default=True, description="Нечіткий пошук")
    threshold: int = Field(default=80, ge=50, le=100, description="Поріг схожості")


class TradeFlowRequest(BaseModel):
    """Запит на аналіз торгових потоків."""

    query: str = Field(..., description="Код країни (ISO 2), HS код або маршрут")
    analysis_type: str = Field(default="country", description="country | hs_code | route")
    partner_country: str | None = Field(default=None, description="Країна-партнер")
    year: int = Field(default=2025, ge=2000, le=2030)
    detect_anomalies: bool = Field(default=True)


class OffshoreSearchRequest(BaseModel):
    """Запит на пошук офшорних зв'язків."""

    query: str = Field(..., description="Назва компанії або ім'я особи")
    entity_type: str = Field(default="company", description="company | person | address")
    include_related: bool = Field(default=True, description="Включати пов'язані сутності")


class CustomsAnalysisRequest(BaseModel):
    """Запит на аналіз митних даних."""

    query: str = Field(..., description="Назва компанії або HS код")
    analysis_type: str = Field(default="company", description="company | hs_code | declaration")
    period_months: int = Field(default=12, ge=1, le=60)
    detect_anomalies: bool = Field(default=True)


# ======================== SANCTIONS ENDPOINTS ========================


@router.post("/sanctions/check")
async def check_sanctions(request: SanctionsCheckRequest):
    """Перевірка на санкції.

    Джерела:
    - OFAC SDN List (США)
    - EU Consolidated Sanctions
    - UN Security Council Sanctions
    - UK Sanctions List
    - Ukraine NSDC Sanctions

    Returns:
        Результати перевірки та збіги
    """
    registry = get_tool_registry()
    sanctions_checker = registry.get("sanctions_checker")

    if not sanctions_checker:
        raise HTTPException(status_code=503, detail="Sanctions Checker недоступний")

    result = await sanctions_checker.run_with_timeout(
        request.query,
        options={
            "entity_type": request.entity_type,
            "fuzzy_match": request.fuzzy_match,
            "threshold": request.threshold,
        },
    )

    return {
        "status": result.status.value,
        "is_sanctioned": result.data.get("is_sanctioned", False),
        "risk_level": result.data.get("risk_level", "unknown"),
        "matches": result.data.get("matches", []),
        "programs_checked": result.data.get("programs_checked", []),
        "findings": result.findings,
    }


@router.get("/sanctions/{entity}")
async def quick_sanctions_check(entity: str):
    """Швидка перевірка на санкції.

    Args:
        entity: Назва для перевірки
    """
    registry = get_tool_registry()
    sanctions_checker = registry.get("sanctions_checker")

    result = await sanctions_checker.run_with_timeout(entity)

    return {
        "entity": entity,
        "is_sanctioned": result.data.get("is_sanctioned", False),
        "matches_count": result.data.get("total_matches", 0),
    }


# ======================== TRADE FLOW ENDPOINTS ========================


@router.post("/flows/analyze")
async def analyze_trade_flows(request: TradeFlowRequest):
    """Аналіз торгових потоків.

    Можливості:
    - Аналіз імпорту/експорту країни
    - Торгові маршрути
    - Виявлення аномалій
    - Схеми обходу санкцій
    - Трикутна торгівля

    Returns:
        Торгова аналітика
    """
    registry = get_tool_registry()
    trade_analyzer = registry.get("trade_flow_analyzer")

    if not trade_analyzer:
        raise HTTPException(status_code=503, detail="Trade Flow Analyzer недоступний")

    result = await trade_analyzer.run_with_timeout(
        request.query,
        options={
            "analysis_type": request.analysis_type,
            "partner_country": request.partner_country,
            "year": request.year,
            "detect_anomalies": request.detect_anomalies,
        },
    )

    return {
        "status": result.status.value,
        "data": result.data,
        "anomalies": result.data.get("anomalies", []),
        "suspicious_routes": result.data.get("suspicious_routes", []),
        "findings": result.findings,
    }


@router.get("/flows/country/{country_code}")
async def get_country_trade(country_code: str, year: int = 2025):
    """Торгівля країни.

    Args:
        country_code: ISO 2 код країни (напр. UA, DE, CN)
        year: Рік аналізу
    """
    registry = get_tool_registry()
    trade_analyzer = registry.get("trade_flow_analyzer")

    result = await trade_analyzer.run_with_timeout(
        country_code,
        options={"analysis_type": "country", "year": year},
    )

    return result.data


@router.get("/flows/hs/{hs_code}")
async def get_hs_code_trade(hs_code: str):
    """Торгівля за HS кодом.

    Args:
        hs_code: HS код товару (4-8 цифр)
    """
    registry = get_tool_registry()
    trade_analyzer = registry.get("trade_flow_analyzer")

    result = await trade_analyzer.run_with_timeout(
        hs_code,
        options={"analysis_type": "hs_code"},
    )

    return result.data


# ======================== OFFSHORE ENDPOINTS ========================


@router.post("/offshore/search")
async def search_offshore(request: OffshoreSearchRequest):
    """Пошук офшорних зв'язків.

    Джерела:
    - Panama Papers (2016)
    - Paradise Papers (2017)
    - Pandora Papers (2021)
    - Offshore Leaks (2013)
    - Bahamas Leaks (2016)

    Returns:
        Офшорні сутності та зв'язки
    """
    registry = get_tool_registry()
    offshore_detector = registry.get("offshore_detector")

    if not offshore_detector:
        raise HTTPException(status_code=503, detail="Offshore Detector недоступний")

    result = await offshore_detector.run_with_timeout(
        request.query,
        options={
            "entity_type": request.entity_type,
            "include_related": request.include_related,
        },
    )

    return {
        "status": result.status.value,
        "offshore_entities": result.data.get("offshore_entities", []),
        "jurisdictions": result.data.get("jurisdictions", []),
        "risk_score": result.data.get("risk_score", 0),
        "findings": result.findings,
    }


@router.get("/offshore/{entity}")
async def quick_offshore_check(entity: str):
    """Швидка перевірка офшорних зв'язків.

    Args:
        entity: Назва для перевірки
    """
    registry = get_tool_registry()
    offshore_detector = registry.get("offshore_detector")

    result = await offshore_detector.run_with_timeout(entity)

    return {
        "entity": entity,
        "found_in_leaks": result.data.get("total_found", 0) > 0,
        "entities_count": result.data.get("total_found", 0),
        "risk_score": result.data.get("risk_score", 0),
    }


# ======================== CUSTOMS ENDPOINTS ========================


@router.post("/customs/analyze")
async def analyze_customs(request: CustomsAnalysisRequest):
    """Аналіз митних даних.

    Можливості:
    - Аналіз імпорту компанії
    - Виявлення заниження вартості
    - Аналіз HS кодів
    - Порівняння з ринковими цінами
    - Виявлення схем ухилення

    Returns:
        Митна аналітика
    """
    registry = get_tool_registry()
    customs_intel = registry.get("customs_intel")

    if not customs_intel:
        raise HTTPException(status_code=503, detail="Customs Intel недоступний")

    result = await customs_intel.run_with_timeout(
        request.query,
        options={
            "analysis_type": request.analysis_type,
            "period_months": request.period_months,
            "detect_anomalies": request.detect_anomalies,
        },
    )

    return {
        "status": result.status.value,
        "data": result.data,
        "anomalies": result.data.get("anomalies", []),
        "price_anomalies": result.data.get("price_anomalies", []),
        "risk_score": result.data.get("risk_score", 0),
        "findings": result.findings,
    }


@router.get("/customs/company/{company}")
async def get_company_imports(company: str, months: int = 12):
    """Імпорт компанії.

    Args:
        company: Назва компанії
        months: Період в місяцях
    """
    registry = get_tool_registry()
    customs_intel = registry.get("customs_intel")

    result = await customs_intel.run_with_timeout(
        company,
        options={"analysis_type": "company", "period_months": months},
    )

    return result.data


# ======================== COMBINED ANALYSIS ========================


@router.post("/investigate/company")
async def investigate_company_trade(company: str):
    """Комплексне розслідування компанії.

    Виконує:
    1. Перевірку санкцій
    2. Пошук офшорних зв'язків
    3. Аналіз митних даних
    4. Аналіз торгових потоків

    Args:
        company: Назва компанії

    Returns:
        Комплексний звіт
    """
    registry = get_tool_registry()

    results = {}
    risk_score = 0

    # Санкції
    sanctions = registry.get("sanctions_checker")
    if sanctions:
        s_result = await sanctions.run_with_timeout(company)
        results["sanctions"] = {
            "is_sanctioned": s_result.data.get("is_sanctioned", False),
            "matches": s_result.data.get("matches", []),
        }
        if s_result.data.get("is_sanctioned"):
            risk_score += 50

    # Офшори
    offshore = registry.get("offshore_detector")
    if offshore:
        o_result = await offshore.run_with_timeout(company)
        results["offshore"] = {
            "found": o_result.data.get("total_found", 0) > 0,
            "entities": o_result.data.get("offshore_entities", []),
            "jurisdictions": o_result.data.get("jurisdictions", []),
        }
        risk_score += o_result.data.get("risk_score", 0) * 0.3

    # Митниця
    customs = registry.get("customs_intel")
    if customs:
        c_result = await customs.run_with_timeout(company)
        results["customs"] = {
            "total_value_usd": c_result.data.get("total_value_usd", 0),
            "anomalies": c_result.data.get("anomalies", []),
            "price_anomalies": c_result.data.get("price_anomalies", []),
        }
        risk_score += c_result.data.get("risk_score", 0) * 0.2

    return {
        "company": company,
        "results": results,
        "overall_risk_score": min(100, risk_score),
        "risk_level": (
            "critical" if risk_score >= 70 else
            "high" if risk_score >= 50 else
            "medium" if risk_score >= 30 else
            "low"
        ),
    }
