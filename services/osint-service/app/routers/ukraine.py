"""Ukraine Registry Router — українські державні реєстри."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/ukraine", tags=["Ukraine Registries"])


# ======================== REQUEST MODELS ========================


class CompanySearchRequest(BaseModel):
    """Запит на пошук компанії."""

    query: str = Field(..., description="ЄДРПОУ (8 цифр) або назва компанії")
    include_founders: bool = Field(default=True)
    include_court_cases: bool = Field(default=True)
    include_customs: bool = Field(default=True)
    include_declarations: bool = Field(default=True)


class PersonSearchRequest(BaseModel):
    """Запит на пошук особи."""

    name: str = Field(..., description="ПІБ особи")
    include_companies: bool = Field(default=True)
    include_declarations: bool = Field(default=True)
    include_court_cases: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/company/search")
async def search_company(request: CompanySearchRequest):
    """Комплексний пошук компанії в українських реєстрах.

    Джерела:
    - ЄДР (Єдиний державний реєстр)
    - НАЗК (декларації)
    - ЄДРСР (судові рішення)
    - Митниця (імпорт/експорт)

    Returns:
        Повний профіль компанії
    """
    registry = get_tool_registry()
    results = {}
    findings = []
    risk_score = 0.0

    # ЄДР
    edr = registry.get("edr_ukraine")
    if edr:
        edr_result = await edr.run_with_timeout(
            request.query,
            options={"include_founders": request.include_founders},
        )
        results["edr"] = edr_result.data
        findings.extend(edr_result.findings)

    # Судові справи
    if request.include_court_cases:
        court = registry.get("court_registry_ukraine")
        if court:
            court_result = await court.run_with_timeout(request.query)
            results["court_cases"] = court_result.data
            findings.extend(court_result.findings)
            risk_score += court_result.data.get("risk_score", 0) * 0.3

    # Митниця
    if request.include_customs:
        customs = registry.get("customs_ukraine")
        if customs:
            customs_result = await customs.run_with_timeout(request.query)
            results["customs"] = customs_result.data
            findings.extend(customs_result.findings)
            risk_score += customs_result.data.get("risk_score", 0) * 0.2

    # НАЗК (декларації пов'язаних осіб)
    if request.include_declarations:
        nask = registry.get("nask_ukraine")
        if nask and results.get("edr", {}).get("companies"):
            company = results["edr"]["companies"][0] if results["edr"]["companies"] else {}
            director = company.get("director", {}).get("name")
            if director:
                nask_result = await nask.run_with_timeout(director)
                results["declarations"] = nask_result.data
                findings.extend(nask_result.findings)
                if nask_result.data.get("is_pep"):
                    risk_score += 20

    return {
        "query": request.query,
        "results": results,
        "findings": findings,
        "risk_score": min(100, risk_score),
        "total_findings": len(findings),
    }


@router.get("/edr/{edrpou}")
async def get_company_by_edrpou(edrpou: str):
    """Пошук компанії за ЄДРПОУ.

    Args:
        edrpou: Код ЄДРПОУ (8 цифр)
    """
    if not edrpou.isdigit() or len(edrpou) != 8:
        raise HTTPException(status_code=400, detail="ЄДРПОУ має бути 8-значним числом")

    registry = get_tool_registry()
    edr = registry.get("edr_ukraine")

    if not edr:
        raise HTTPException(status_code=503, detail="ЄДР недоступний")

    result = await edr.run_with_timeout(
        edrpou,
        options={"search_type": "edrpou"},
    )

    return result.data


@router.post("/person/search")
async def search_person(request: PersonSearchRequest):
    """Пошук особи в українських реєстрах.

    Джерела:
    - ЄДР (компанії де засновник/директор)
    - НАЗК (декларації)
    - ЄДРСР (судові справи)

    Returns:
        Профіль особи
    """
    registry = get_tool_registry()
    results = {}
    findings = []

    # НАЗК (декларації)
    if request.include_declarations:
        nask = registry.get("nask_ukraine")
        if nask:
            nask_result = await nask.run_with_timeout(request.name)
            results["declarations"] = nask_result.data
            findings.extend(nask_result.findings)

    # ЄДР (компанії)
    if request.include_companies:
        edr = registry.get("edr_ukraine")
        if edr:
            edr_result = await edr.run_with_timeout(
                request.name,
                options={"search_type": "name"},
            )
            results["companies"] = edr_result.data
            findings.extend(edr_result.findings)

    # Судові справи
    if request.include_court_cases:
        court = registry.get("court_registry_ukraine")
        if court:
            court_result = await court.run_with_timeout(request.name)
            results["court_cases"] = court_result.data
            findings.extend(court_result.findings)

    # Визначаємо PEP статус
    is_pep = results.get("declarations", {}).get("is_pep", False)
    pep_risk = results.get("declarations", {}).get("pep_risk_score", 0)

    return {
        "query": request.name,
        "is_pep": is_pep,
        "pep_risk_score": pep_risk,
        "results": results,
        "findings": findings,
        "total_findings": len(findings),
    }


@router.get("/declarations/{name}")
async def get_declarations(name: str, year: int | None = None):
    """Пошук декларацій в НАЗК.

    Args:
        name: ПІБ особи
        year: Рік декларації
    """
    registry = get_tool_registry()
    nask = registry.get("nask_ukraine")

    if not nask:
        raise HTTPException(status_code=503, detail="НАЗК недоступний")

    result = await nask.run_with_timeout(
        name,
        options={"year": year} if year else {},
    )

    return result.data


@router.get("/courts/{query}")
async def get_court_cases(query: str, case_type: int | None = None):
    """Пошук судових справ в ЄДРСР.

    Args:
        query: Назва компанії, ПІБ або номер справи
        case_type: Тип справи (1-цивільне, 2-кримінальне, 3-господарське, 4-адмін)
    """
    registry = get_tool_registry()
    court = registry.get("court_registry_ukraine")

    if not court:
        raise HTTPException(status_code=503, detail="ЄДРСР недоступний")

    result = await court.run_with_timeout(
        query,
        options={"case_type": case_type} if case_type else {},
    )

    return result.data


@router.get("/customs/{edrpou}")
async def get_customs_data(edrpou: str, months: int = 12):
    """Митні дані компанії.

    Args:
        edrpou: Код ЄДРПОУ
        months: Період в місяцях
    """
    registry = get_tool_registry()
    customs = registry.get("customs_ukraine")

    if not customs:
        raise HTTPException(status_code=503, detail="Митниця недоступна")

    result = await customs.run_with_timeout(
        edrpou,
        options={"period_months": months},
    )

    return result.data


@router.post("/investigate/full")
async def full_investigation(edrpou: str):
    """Повне розслідування компанії.

    Збирає дані з усіх українських реєстрів:
    - ЄДР
    - НАЗК
    - ЄДРСР
    - Митниця

    Args:
        edrpou: Код ЄДРПОУ

    Returns:
        Комплексний звіт з ризик-скором
    """
    if not edrpou.isdigit() or len(edrpou) != 8:
        raise HTTPException(status_code=400, detail="ЄДРПОУ має бути 8-значним числом")

    registry = get_tool_registry()
    results = {}
    risk_indicators = []
    total_risk = 0.0

    # ЄДР
    edr = registry.get("edr_ukraine")
    if edr:
        edr_result = await edr.run_with_timeout(edrpou)
        results["company"] = edr_result.data
        company_data = edr_result.data.get("companies", [{}])[0] if edr_result.data.get("companies") else {}

        # Перевірка статусу
        if company_data.get("status") != "зареєстровано":
            risk_indicators.append({
                "type": "company_status",
                "severity": "high",
                "description": f"Статус компанії: {company_data.get('status')}",
            })
            total_risk += 25

    # Судові справи
    court = registry.get("court_registry_ukraine")
    if court:
        court_result = await court.run_with_timeout(edrpou)
        results["court_cases"] = court_result.data
        total_risk += court_result.data.get("risk_score", 0) * 0.25

        if court_result.data.get("criminal_cases", 0) > 0:
            risk_indicators.append({
                "type": "criminal_cases",
                "severity": "critical",
                "description": f"Кримінальні справи: {court_result.data.get('criminal_cases')}",
            })

    # Митниця
    customs = registry.get("customs_ukraine")
    if customs:
        customs_result = await customs.run_with_timeout(edrpou)
        results["customs"] = customs_result.data
        total_risk += customs_result.data.get("risk_score", 0) * 0.25

        for indicator in customs_result.data.get("risk_indicators", []):
            risk_indicators.append(indicator)

    # НАЗК (якщо є директор)
    if results.get("company", {}).get("companies"):
        company = results["company"]["companies"][0]
        director = company.get("director", {}).get("name")

        if director:
            nask = registry.get("nask_ukraine")
            if nask:
                nask_result = await nask.run_with_timeout(director)
                results["director_declarations"] = nask_result.data

                if nask_result.data.get("is_pep"):
                    risk_indicators.append({
                        "type": "pep",
                        "severity": "medium",
                        "description": f"Директор є PEP: {director}",
                    })
                    total_risk += 15

    return {
        "edrpou": edrpou,
        "results": results,
        "risk_indicators": risk_indicators,
        "risk_score": min(100, total_risk),
        "risk_level": (
            "critical" if total_risk >= 70 else
            "high" if total_risk >= 50 else
            "medium" if total_risk >= 30 else
            "low"
        ),
    }
