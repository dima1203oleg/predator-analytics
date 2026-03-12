"""Financial Intelligence Router — корпоративні розслідування, бенефіціари, офшори."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/financial", tags=["Financial Intelligence"])


# ======================== REQUEST MODELS ========================


class CompanyInvestigationRequest(BaseModel):
    """Запит на розслідування компанії."""

    query: str = Field(..., description="Назва компанії")
    jurisdiction: str | None = Field(default=None, description="Код юрисдикції (ua, gb, us)")
    include_officers: bool = Field(default=True)
    include_ownership: bool = Field(default=True)
    include_leaks: bool = Field(default=True)


class PersonInvestigationRequest(BaseModel):
    """Запит на розслідування особи."""

    name: str = Field(..., description="ПІБ особи")
    include_companies: bool = Field(default=True)
    include_declarations: bool = Field(default=True)
    include_leaks: bool = Field(default=True)


class LeakSearchRequest(BaseModel):
    """Запит на пошук у витоках."""

    query: str = Field(..., description="Email, домен або username")
    search_type: str = Field(default="auto", description="email | domain | username | auto")
    check_hibp: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/company/investigate")
async def investigate_company(request: CompanyInvestigationRequest):
    """Комплексне розслідування компанії.

    Джерела:
    - OpenCorporates (200M+ компаній)
    - OpenOwnership (бенефіціари)
    - Aleph (OCCRP документи)
    - FollowTheMoney (графи зв'язків)

    Returns:
        Повний профіль компанії
    """
    registry = get_tool_registry()
    results = {}
    findings = []

    # OpenCorporates
    open_corp = registry.get("open_corporates")
    if open_corp:
        oc_result = await open_corp.run_with_timeout(
            request.query,
            options={
                "jurisdiction": request.jurisdiction,
                "include_officers": request.include_officers,
            },
        )
        results["open_corporates"] = oc_result.data
        findings.extend(oc_result.findings)

    # OpenOwnership (бенефіціари)
    if request.include_ownership:
        open_own = registry.get("open_ownership")
        if open_own:
            oo_result = await open_own.run_with_timeout(request.query)
            results["beneficial_owners"] = oo_result.data
            findings.extend(oo_result.findings)

    # Aleph (OCCRP)
    aleph = registry.get("aleph")
    if aleph:
        aleph_result = await aleph.run_with_timeout(request.query)
        results["aleph"] = aleph_result.data
        findings.extend(aleph_result.findings)

    # FollowTheMoney (граф)
    ftm = registry.get("follow_the_money")
    if ftm:
        ftm_result = await ftm.run_with_timeout(request.query)
        results["graph"] = ftm_result.data.get("graph")
        findings.extend(ftm_result.findings)

    # Витоки
    if request.include_leaks:
        leak_search = registry.get("leak_search")
        if leak_search:
            # Шукаємо за доменом компанії
            domain = request.query.lower().replace(" ", "").replace(",", "") + ".com"
            leak_result = await leak_search.run_with_timeout(
                domain,
                options={"search_type": "domain"},
            )
            results["leaks"] = leak_result.data
            findings.extend(leak_result.findings)

    return {
        "query": request.query,
        "results": results,
        "findings": findings,
        "total_findings": len(findings),
    }


@router.post("/person/investigate")
async def investigate_person(request: PersonInvestigationRequest):
    """Комплексне розслідування особи.

    Джерела:
    - OpenOwnership (бенефіціарна власність)
    - Aleph (OCCRP документи)
    - OpenCorporates (директорства)
    - Leak databases

    Returns:
        Повний профіль особи
    """
    registry = get_tool_registry()
    results = {}
    findings = []

    # OpenOwnership
    open_own = registry.get("open_ownership")
    if open_own:
        oo_result = await open_own.run_with_timeout(
            request.name,
            options={"search_type": "person"},
        )
        results["ownership"] = oo_result.data
        findings.extend(oo_result.findings)

    # Aleph
    aleph = registry.get("aleph")
    if aleph:
        aleph_result = await aleph.run_with_timeout(request.name)
        results["aleph"] = aleph_result.data
        findings.extend(aleph_result.findings)

    # OpenCorporates (директорства)
    if request.include_companies:
        open_corp = registry.get("open_corporates")
        if open_corp:
            oc_result = await open_corp.run_with_timeout(request.name)
            results["companies"] = oc_result.data
            findings.extend(oc_result.findings)

    # Витоки
    if request.include_leaks:
        leak_search = registry.get("leak_search")
        if leak_search:
            # Генеруємо можливий email
            email_guess = request.name.lower().replace(" ", ".") + "@gmail.com"
            leak_result = await leak_search.run_with_timeout(
                email_guess,
                options={"search_type": "email"},
            )
            results["leaks"] = leak_result.data

    return {
        "query": request.name,
        "results": results,
        "findings": findings,
        "total_findings": len(findings),
    }


@router.post("/leaks/search")
async def search_leaks(request: LeakSearchRequest):
    """Пошук у витоках даних.

    Джерела:
    - Have I Been Pwned
    - h8mail databases
    - LeakLooker

    Returns:
        Знайдені витоки та breaches
    """
    registry = get_tool_registry()
    leak_search = registry.get("leak_search")

    if not leak_search:
        raise HTTPException(status_code=503, detail="Leak Search недоступний")

    result = await leak_search.run_with_timeout(
        request.query,
        options={
            "search_type": request.search_type,
            "check_hibp": request.check_hibp,
        },
    )

    return {
        "query": request.query,
        "is_compromised": result.data.get("is_compromised", False),
        "breaches": result.data.get("breaches", []),
        "total_breaches": result.data.get("total_breaches", 0),
        "risk_score": result.data.get("risk_score", 0),
        "findings": result.findings,
    }


@router.get("/aleph/search/{query}")
async def search_aleph(query: str, limit: int = 50):
    """Пошук в OCCRP Aleph.

    Args:
        query: Пошуковий запит
        limit: Максимум результатів
    """
    registry = get_tool_registry()
    aleph = registry.get("aleph")

    if not aleph:
        raise HTTPException(status_code=503, detail="Aleph недоступний")

    result = await aleph.run_with_timeout(
        query,
        options={"limit": limit},
    )

    return result.data


@router.get("/opencorporates/search/{company}")
async def search_opencorporates(company: str, jurisdiction: str | None = None):
    """Пошук в OpenCorporates.

    Args:
        company: Назва компанії
        jurisdiction: Код юрисдикції
    """
    registry = get_tool_registry()
    open_corp = registry.get("open_corporates")

    if not open_corp:
        raise HTTPException(status_code=503, detail="OpenCorporates недоступний")

    result = await open_corp.run_with_timeout(
        company,
        options={"jurisdiction": jurisdiction},
    )

    return result.data


@router.get("/ownership/{entity}")
async def get_beneficial_owners(entity: str):
    """Пошук бенефіціарних власників.

    Args:
        entity: Назва компанії або особи
    """
    registry = get_tool_registry()
    open_own = registry.get("open_ownership")

    if not open_own:
        raise HTTPException(status_code=503, detail="OpenOwnership недоступний")

    result = await open_own.run_with_timeout(entity)

    return {
        "entity": entity,
        "beneficial_owners": result.data.get("beneficial_owners", []),
        "total_owners": result.data.get("total_owners", 0),
    }


@router.post("/graph/build")
async def build_relationship_graph(entity: str, depth: int = 2):
    """Побудова графу зв'язків (FollowTheMoney).

    Args:
        entity: Центральна сутність
        depth: Глибина графу

    Returns:
        Граф у форматі nodes/edges
    """
    registry = get_tool_registry()
    ftm = registry.get("follow_the_money")

    if not ftm:
        raise HTTPException(status_code=503, detail="FollowTheMoney недоступний")

    result = await ftm.run_with_timeout(
        entity,
        options={"depth": depth},
    )

    return {
        "entity": entity,
        "graph": result.data.get("graph"),
        "entities": result.data.get("entities", []),
        "relationships": result.data.get("relationships", []),
        "neo4j_export": ftm.export_to_neo4j(
            result.data.get("entities", []),
            result.data.get("relationships", []),
        ) if hasattr(ftm, "export_to_neo4j") else None,
    }
