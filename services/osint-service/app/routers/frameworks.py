"""OSINT Frameworks Router — комплексні фреймворки для автоматизованої розвідки."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/frameworks", tags=["OSINT Frameworks"])


# ======================== REQUEST MODELS ========================


class SpiderFootScanRequest(BaseModel):
    """Запит на SpiderFoot сканування."""

    target: str = Field(..., description="Ціль (домен, IP, email, username)")
    scan_type: str = Field(default="quick", description="quick | full | custom")
    modules: list[str] | None = Field(default=None, description="Модулі для запуску")
    max_depth: int = Field(default=2, ge=1, le=5)


class ReconNGRequest(BaseModel):
    """Запит на Recon-ng сканування."""

    target: str = Field(..., description="Домен або компанія")
    modules: list[str] | None = Field(default=None)


class OsmedeusScanRequest(BaseModel):
    """Запит на Osmedeus сканування."""

    target: str = Field(..., description="Домен, IP або CIDR")
    workflow: str = Field(default="general", description="general | subdomain | urls | vuln | cidr")


class ComprehensiveScanRequest(BaseModel):
    """Запит на комплексне сканування."""

    target: str = Field(..., description="Ціль для сканування")
    include_spiderfoot: bool = Field(default=True)
    include_recon_ng: bool = Field(default=True)
    include_osmedeus: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/spiderfoot/scan")
async def spiderfoot_scan(request: SpiderFootScanRequest):
    """SpiderFoot сканування — 200+ модулів OSINT.

    Можливості:
    - DNS розвідка
    - Email пошук
    - Соціальні мережі
    - Dark web
    - Витоки даних
    - Репутаційний аналіз

    Returns:
        Результати сканування з ризик-скором
    """
    registry = get_tool_registry()
    spiderfoot = registry.get("spiderfoot")

    if not spiderfoot:
        raise HTTPException(status_code=503, detail="SpiderFoot недоступний")

    result = await spiderfoot.run_with_timeout(
        request.target,
        options={
            "scan_type": request.scan_type,
            "modules": request.modules,
            "max_depth": request.max_depth,
        },
    )

    return result.data


@router.post("/recon-ng/scan")
async def recon_ng_scan(request: ReconNGRequest):
    """Recon-ng сканування — модульна веб-розвідка.

    Можливості:
    - Пошук субдоменів
    - Збір контактів
    - Аналіз інфраструктури

    Returns:
        Хости, контакти, credentials
    """
    registry = get_tool_registry()
    recon_ng = registry.get("recon_ng")

    if not recon_ng:
        raise HTTPException(status_code=503, detail="Recon-ng недоступний")

    result = await recon_ng.run_with_timeout(
        request.target,
        options={"modules": request.modules},
    )

    return result.data


@router.post("/osmedeus/scan")
async def osmedeus_scan(request: OsmedeusScanRequest):
    """Osmedeus сканування — offensive security.

    Workflows:
    - general: повне сканування
    - subdomain: тільки субдомени
    - urls: URL discovery
    - vuln: vulnerability scanning
    - cidr: мережевий діапазон

    Returns:
        Субдомени, порти, вразливості
    """
    registry = get_tool_registry()
    osmedeus = registry.get("osmedeus")

    if not osmedeus:
        raise HTTPException(status_code=503, detail="Osmedeus недоступний")

    result = await osmedeus.run_with_timeout(
        request.target,
        options={"workflow": request.workflow},
    )

    return result.data


@router.post("/comprehensive")
async def comprehensive_scan(request: ComprehensiveScanRequest):
    """Комплексне сканування всіма фреймворками.

    Об'єднує результати:
    - SpiderFoot (200+ модулів)
    - Recon-ng (веб-розвідка)
    - Osmedeus (security scanning)

    Returns:
        Зведені результати з усіх фреймворків
    """
    registry = get_tool_registry()
    results = {}
    all_findings = []
    total_risk = 0.0

    # SpiderFoot
    if request.include_spiderfoot:
        spiderfoot = registry.get("spiderfoot")
        if spiderfoot:
            sf_result = await spiderfoot.run_with_timeout(
                request.target,
                options={"scan_type": "quick"},
            )
            results["spiderfoot"] = sf_result.data
            all_findings.extend(sf_result.findings)
            total_risk += sf_result.data.get("risk_score", 0) * 0.4

    # Recon-ng
    if request.include_recon_ng:
        recon_ng = registry.get("recon_ng")
        if recon_ng:
            rn_result = await recon_ng.run_with_timeout(request.target)
            results["recon_ng"] = rn_result.data
            all_findings.extend(rn_result.findings)

    # Osmedeus
    if request.include_osmedeus:
        osmedeus = registry.get("osmedeus")
        if osmedeus:
            os_result = await osmedeus.run_with_timeout(
                request.target,
                options={"workflow": "general"},
            )
            results["osmedeus"] = os_result.data
            all_findings.extend(os_result.findings)
            total_risk += os_result.data.get("risk_score", 0) * 0.6

    # Агрегація
    unique_subdomains = set()
    unique_emails = set()
    unique_vulnerabilities = []

    for finding in all_findings:
        if finding["type"] == "subdomain":
            unique_subdomains.add(finding["value"])
        elif finding["type"] in ["email", "contact"]:
            unique_emails.add(finding["value"])
        elif finding["type"] == "vulnerability":
            unique_vulnerabilities.append(finding)

    return {
        "target": request.target,
        "frameworks_used": list(results.keys()),
        "summary": {
            "subdomains_found": len(unique_subdomains),
            "emails_found": len(unique_emails),
            "vulnerabilities_found": len(unique_vulnerabilities),
            "total_findings": len(all_findings),
        },
        "risk_score": min(100, total_risk),
        "results": results,
        "findings": all_findings,
    }


@router.get("/available")
async def get_available_frameworks():
    """Список доступних OSINT фреймворків."""
    registry = get_tool_registry()

    frameworks = [
        {
            "name": "SpiderFoot",
            "id": "spiderfoot",
            "version": "4.0",
            "modules": 200,
            "available": registry.get("spiderfoot") is not None,
        },
        {
            "name": "Recon-ng",
            "id": "recon_ng",
            "version": "5.1",
            "modules": 80,
            "available": registry.get("recon_ng") is not None,
        },
        {
            "name": "Osmedeus",
            "id": "osmedeus",
            "version": "4.6",
            "workflows": ["general", "subdomain", "urls", "vuln", "cidr"],
            "available": registry.get("osmedeus") is not None,
        },
    ]

    return {"frameworks": frameworks}
