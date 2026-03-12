"""Dark Web Router — розвідка в TOR мережі."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.tools import get_tool_registry

router = APIRouter(prefix="/darkweb", tags=["Dark Web OSINT"])


# ======================== REQUEST MODELS ========================


class OnionScanRequest(BaseModel):
    """Запит на сканування .onion сайту."""

    target: str = Field(..., description=".onion URL")
    depth: int = Field(default=1, ge=1, le=3)
    check_ssh: bool = Field(default=True)
    check_bitcoin: bool = Field(default=True)


class TorBotCrawlRequest(BaseModel):
    """Запит на краулінг Dark Web."""

    target: str = Field(..., description=".onion URL або ключове слово")
    depth: int = Field(default=2, ge=1, le=5)
    extract_emails: bool = Field(default=True)
    classify: bool = Field(default=True)


# ======================== ENDPOINTS ========================


@router.post("/onionscan")
async def onion_scan(request: OnionScanRequest):
    """Сканування .onion сайту.

    Аналізує:
    - Конфігурацію сервера
    - Витоки інформації (IP leaks)
    - Bitcoin адреси
    - SSH fingerprints
    - Зв'язки з іншими .onion сайтами

    Returns:
        Результати сканування з ризик-скором
    """
    if not request.target.endswith(".onion"):
        raise HTTPException(status_code=400, detail="Ціль має бути .onion URL")

    registry = get_tool_registry()
    onionscan = registry.get("onionscan")

    if not onionscan:
        raise HTTPException(status_code=503, detail="OnionScan недоступний")

    result = await onionscan.run_with_timeout(
        request.target,
        options={
            "depth": request.depth,
            "check_ssh": request.check_ssh,
            "check_bitcoin": request.check_bitcoin,
        },
    )

    return result.data


@router.post("/torbot/crawl")
async def torbot_crawl(request: TorBotCrawlRequest):
    """Краулінг Dark Web.

    Можливості:
    - Збір посилань з .onion сайтів
    - Класифікація контенту
    - Витягування email, телефонів
    - Пошук Bitcoin адрес

    Returns:
        Результати краулінгу
    """
    registry = get_tool_registry()
    torbot = registry.get("torbot")

    if not torbot:
        raise HTTPException(status_code=503, detail="TorBot недоступний")

    result = await torbot.run_with_timeout(
        request.target,
        options={
            "depth": request.depth,
            "extract_emails": request.extract_emails,
            "classify": request.classify,
        },
    )

    return result.data


@router.post("/investigate")
async def investigate_onion(target: str):
    """Комплексне розслідування .onion сайту.

    Об'єднує:
    - OnionScan (security analysis)
    - TorBot (crawling)

    Returns:
        Повний аналіз з ризик-скором
    """
    if not target.endswith(".onion"):
        raise HTTPException(status_code=400, detail="Ціль має бути .onion URL")

    registry = get_tool_registry()
    results = {}
    all_findings = []
    total_risk = 0.0

    # OnionScan
    onionscan = registry.get("onionscan")
    if onionscan:
        os_result = await onionscan.run_with_timeout(target)
        results["security_scan"] = {
            "server_info": os_result.data.get("server_info"),
            "security_issues": os_result.data.get("security_issues"),
            "information_leaks": os_result.data.get("information_leaks"),
            "related_onions": os_result.data.get("related_onions"),
        }
        all_findings.extend(os_result.findings)
        total_risk += os_result.data.get("risk_score", 0) * 0.6

    # TorBot
    torbot = registry.get("torbot")
    if torbot:
        tb_result = await torbot.run_with_timeout(target, options={"depth": 2})
        results["crawl"] = {
            "pages_crawled": tb_result.data.get("pages_crawled"),
            "links_found": tb_result.data.get("links_found"),
            "emails": tb_result.data.get("emails_found"),
            "bitcoin_addresses": tb_result.data.get("bitcoin_addresses"),
            "classifications": tb_result.data.get("classifications"),
        }
        all_findings.extend(tb_result.findings)
        total_risk += tb_result.data.get("risk_score", 0) * 0.4

    # Агрегація Bitcoin адрес
    all_bitcoin = set()
    for finding in all_findings:
        if finding["type"] == "bitcoin_address":
            all_bitcoin.add(finding["value"])

    return {
        "target": target,
        "results": results,
        "findings": all_findings,
        "bitcoin_addresses": list(all_bitcoin),
        "risk_score": min(100, total_risk),
        "risk_level": (
            "critical" if total_risk >= 80 else
            "high" if total_risk >= 60 else
            "medium" if total_risk >= 40 else
            "low"
        ),
    }


@router.get("/status")
async def get_darkweb_status():
    """Статус Dark Web інструментів."""
    registry = get_tool_registry()

    return {
        "tools": [
            {
                "name": "OnionScan",
                "id": "onionscan",
                "available": registry.get("onionscan") is not None,
                "description": "Сканування .onion сайтів",
            },
            {
                "name": "TorBot",
                "id": "torbot",
                "available": registry.get("torbot") is not None,
                "description": "Краулер Dark Web",
            },
        ],
        "warning": "Dark Web інструменти потребують TOR proxy",
    }
