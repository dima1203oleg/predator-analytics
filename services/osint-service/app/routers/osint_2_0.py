"""OSINT 2.0 — API Router.

Поглиблений інструментарій 2026:
- People Search 2.0 (Epieos, Holehe, Sherlock)
- Digital Forensics (SpiderFoot, Hunchly, Metagoofil)
- Knowledge Graph (STIX 2.1, NLP Pipeline)
- Міжнародні джерела (OpenCorporates, CrunchBase, Sanctions)
- RAG + Graph інтеграція
"""
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from app.tools.osint_2_0 import (
    CrunchBaseClient,
    # People Search
    EpieosClient,
    HoleheTool,
    MetagoofilTool,
    NLPEntityExtractor,
    # International
    OpenCorporatesClient,
    PromptGuidedExplorer,
    # RAG
    SanctionsAggregator,
    SherlockTool,
    # Digital Forensics
    SpiderFootClient,
)

router = APIRouter(prefix="/osint-2", tags=["OSINT 2.0 — Поглиблений інструментарій"])


# ======================== REQUEST MODELS ========================


class EmailSearchRequest(BaseModel):
    """Запит на пошук за email."""
    email: EmailStr


class PhoneSearchRequest(BaseModel):
    """Запит на пошук за телефоном."""
    phone: str = Field(..., min_length=10, description="Номер телефону")


class UsernameSearchRequest(BaseModel):
    """Запит на пошук за username."""
    username: str = Field(..., min_length=2, description="Username")


class ComprehensiveSearchRequest(BaseModel):
    """Комплексний пошук особи."""
    username: str | None = None
    email: EmailStr | None = None
    phone: str | None = None


class DomainScanRequest(BaseModel):
    """Запит на сканування домену."""
    domain: str = Field(..., description="Домен для сканування")
    scan_type: str = Field(default="passive", description="Тип сканування: passive, active, full")


class CompanySearchRequest(BaseModel):
    """Запит на пошук компанії."""
    name: str = Field(..., min_length=2)
    jurisdiction: str | None = Field(None, description="Юрисдикція (gb, us, ua, cy)")
    country: str | None = None


class SanctionsCheckRequest(BaseModel):
    """Запит на перевірку санкцій."""
    name: str = Field(..., min_length=2)
    entity_type: str | None = Field(None, description="individual або organization")
    include_pep: bool = Field(default=True, description="Включити перевірку PEP")


class NLPAnalysisRequest(BaseModel):
    """Запит на NLP аналіз тексту."""
    text: str = Field(..., min_length=10)


class GraphQueryRequest(BaseModel):
    """Запит до Knowledge Graph."""
    question: str = Field(..., min_length=5, description="Питання природною мовою")
    follow_up: bool = Field(default=False, description="Це продовження попереднього запиту")


class NetworkAnalysisRequest(BaseModel):
    """Запит на аналіз мережі."""
    entity: str = Field(..., description="Центральна сутність")
    depth: int = Field(default=2, ge=1, le=5, description="Глибина аналізу")


# ======================== PEOPLE SEARCH 2.0 ========================


@router.post("/people/epieos/email")
async def epieos_email_search(request: EmailSearchRequest):
    """Epieos — Глибинний пошук за email.

    Знаходить:
    - Google ID, YouTube канали
    - Відгуки на Google Maps (геолокація)
    - Skype профіль
    - Gravatar
    - Витоки даних (HIBP)
    """
    client = EpieosClient()
    result = await client.search_email(request.email)
    return result.data


@router.post("/people/epieos/phone")
async def epieos_phone_search(request: PhoneSearchRequest):
    """Epieos — Пошук за номером телефону.

    Знаходить:
    - WhatsApp, Telegram, Viber
    - Truecaller
    - Оператор та тип номера
    """
    client = EpieosClient()
    result = await client.search_phone(request.phone)
    return result.data


@router.post("/people/holehe")
async def holehe_check(request: EmailSearchRequest):
    """Holehe — Перевірка email на 120+ сервісах.

    ⚠️ Не залишає слідів — власник не отримує сповіщення.
    """
    tool = HoleheTool()
    result = await tool.check_email(request.email)
    return result.data


@router.post("/people/sherlock")
async def sherlock_search(request: UsernameSearchRequest):
    """Sherlock — Пошук username у 340+ соцмережах.

    Створює цифровий профіль особи.
    """
    tool = SherlockTool()
    result = await tool.search_username(request.username)
    return result.data


@router.post("/people/comprehensive")
async def comprehensive_person_search(request: ComprehensiveSearchRequest):
    """Комплексний пошук особи за всіма ідентифікаторами.

    Об'єднує результати Epieos, Holehe, Sherlock.
    """
    if not any([request.username, request.email, request.phone]):
        raise HTTPException(
            status_code=400,
            detail="Потрібно вказати хоча б один ідентифікатор: username, email або phone",
        )

    tool = SherlockTool()
    result = await tool.comprehensive_search(
        username=request.username,
        email=request.email,
        phone=request.phone,
    )
    return result.data


# ======================== DIGITAL FORENSICS ========================


@router.post("/forensics/spiderfoot/domain")
async def spiderfoot_domain_scan(request: DomainScanRequest):
    """SpiderFoot — Сканування домену (200+ джерел).

    Збирає:
    - DNS, WHOIS, SSL
    - Emails, технології
    - Вразливості
    - Threat Intelligence
    """
    client = SpiderFootClient()
    result = await client.scan_domain(request.domain, scan_type=request.scan_type)
    return result.data


@router.post("/forensics/spiderfoot/email")
async def spiderfoot_email_scan(request: EmailSearchRequest):
    """SpiderFoot — Сканування email."""
    client = SpiderFootClient()
    result = await client.scan_email(request.email)
    return result.data


@router.post("/forensics/spiderfoot/ip")
async def spiderfoot_ip_scan(ip: str = Query(..., description="IP-адреса")):
    """SpiderFoot — Сканування IP-адреси."""
    client = SpiderFootClient()
    result = await client.scan_ip(ip)
    return result.data


@router.post("/forensics/metagoofil")
async def metagoofil_analyze(request: DomainScanRequest):
    """Metagoofil — Видобування метаданих з документів.

    Знаходить:
    - Імена авторів/співробітників
    - Версії ПЗ
    - Приховані шляхи на серверах
    """
    tool = MetagoofilTool()
    result = await tool.analyze_domain(request.domain)
    return result.data


# ======================== KNOWLEDGE GRAPH ========================


@router.post("/graph/nlp/extract")
async def nlp_extract_entities(request: NLPAnalysisRequest):
    """NLP — Витягування сутностей з тексту.

    Використовує NER для знаходження:
    - Компаній, осіб
    - Адрес, дат
    - ЄДРПОУ, email, телефонів
    """
    extractor = NLPEntityExtractor()
    result = await extractor.process_document(request.text)

    return {
        "entities": [
            {
                "id": node.id,
                "type": node.type.value,
                "name": node.name,
                "properties": node.properties,
            }
            for node in result.nodes
        ],
        "relations": [
            {
                "id": rel.id,
                "type": rel.type.value,
                "source": rel.source_id,
                "target": rel.target_id,
            }
            for rel in result.relations
        ],
        "statistics": result.data,
    }


@router.post("/graph/query")
async def graph_natural_query(request: GraphQueryRequest):
    """Knowledge Graph — Запит природною мовою.

    Приклади:
    - "Покажи всі компанії, пов'язані з Івановим"
    - "Знайди компанії з боргами, які вигравали тендери"
    - "Хто є кінцевим бенефіціаром ТОВ «Компанія»?"
    """
    explorer = PromptGuidedExplorer()
    result = await explorer.explore(request.question, follow_up=request.follow_up)

    return {
        "question": result.query,
        "answer": result.answer,
        "sources": result.sources,
        "graph_context": result.graph_context,
        "confidence": result.confidence,
        "response_time_ms": result.response_time_ms,
    }


@router.post("/graph/network")
async def analyze_network(request: NetworkAnalysisRequest):
    """Аналіз мережі зв'язків сутності."""
    explorer = PromptGuidedExplorer()
    result = await explorer.analyze_network(request.entity, depth=request.depth)

    return {
        "entity": request.entity,
        "depth": request.depth,
        "answer": result.answer,
        "network_analysis": result.graph_context.get("network_analysis", {}),
        "sources": result.sources,
    }


@router.post("/graph/trace-ownership")
async def trace_ownership(company: str = Query(..., description="Назва компанії")):
    """Відстеження ланцюга володіння до кінцевого бенефіціара."""
    explorer = PromptGuidedExplorer()
    result = await explorer.trace_ownership(company)

    return {
        "company": company,
        "answer": result.answer,
        "ownership_chain": result.graph_context,
        "sources": result.sources,
    }


@router.post("/graph/risk-factors")
async def find_risk_factors(entity: str = Query(..., description="Назва сутності")):
    """Пошук факторів ризику для сутності."""
    explorer = PromptGuidedExplorer()
    result = await explorer.find_risk_factors(entity)

    return {
        "entity": entity,
        "answer": result.answer,
        "risk_factors": result.graph_context,
        "sources": result.sources,
    }


# ======================== INTERNATIONAL SOURCES ========================


@router.post("/international/opencorporates/search")
async def opencorporates_search(request: CompanySearchRequest):
    """OpenCorporates — Пошук серед 200+ млн компаній світу."""
    client = OpenCorporatesClient()
    result = await client.search_company(
        name=request.name,
        jurisdiction=request.jurisdiction,
        country=request.country,
    )
    return result.data


@router.get("/international/opencorporates/company/{jurisdiction}/{company_number}")
async def opencorporates_get_company(jurisdiction: str, company_number: str):
    """OpenCorporates — Детальна інформація про компанію."""
    client = OpenCorporatesClient()
    result = await client.get_company(jurisdiction, company_number)
    return result.data


@router.post("/international/opencorporates/officer")
async def opencorporates_search_officer(name: str = Query(..., min_length=2)):
    """OpenCorporates — Пошук директора/посадової особи."""
    client = OpenCorporatesClient()
    result = await client.search_officer(name)
    return result.data


@router.get("/international/opencorporates/network/{jurisdiction}/{company_number}")
async def opencorporates_corporate_network(
    jurisdiction: str,
    company_number: str,
    depth: int = Query(default=2, ge=1, le=3),
):
    """OpenCorporates — Корпоративна мережа (материнські/дочірні компанії)."""
    client = OpenCorporatesClient()
    result = await client.get_corporate_network(company_number, jurisdiction, depth)
    return result.data


@router.post("/international/crunchbase/search")
async def crunchbase_search(request: CompanySearchRequest):
    """CrunchBase — Пошук стартапів та технологічних компаній."""
    client = CrunchBaseClient()
    result = await client.search_organization(request.name)
    return result.data


@router.get("/international/crunchbase/funding/{organization_uuid}")
async def crunchbase_funding(organization_uuid: str):
    """CrunchBase — Раунди фінансування компанії."""
    client = CrunchBaseClient()
    result = await client.get_funding_rounds(organization_uuid)
    return result.data


@router.get("/international/crunchbase/investors/{organization_uuid}")
async def crunchbase_investors(organization_uuid: str):
    """CrunchBase — Інвестори компанії."""
    client = CrunchBaseClient()
    result = await client.get_investors(organization_uuid)
    return result.data


@router.post("/international/crunchbase/person")
async def crunchbase_person(name: str = Query(..., min_length=2)):
    """CrunchBase — Пошук особи (засновники, інвестори)."""
    client = CrunchBaseClient()
    result = await client.search_person(name)
    return result.data


# ======================== SANCTIONS ========================


@router.post("/sanctions/check")
async def sanctions_check(request: SanctionsCheckRequest):
    """Перевірка у всіх санкційних списках.

    Списки:
    - OFAC SDN (США)
    - EU Sanctions
    - UK Sanctions
    - UN Sanctions
    - FATF
    - Україна (РНБО)

    + PEP перевірка (опціонально)
    """
    aggregator = SanctionsAggregator()
    result = await aggregator.check_all(
        name=request.name,
        entity_type=request.entity_type,
        include_pep=request.include_pep,
    )
    return result.data


@router.post("/sanctions/batch")
async def sanctions_batch_check(names: list[str]):
    """Пакетна перевірка списку імен у санкційних списках."""
    if len(names) > 100:
        raise HTTPException(
            status_code=400,
            detail="Максимум 100 імен за один запит",
        )

    aggregator = SanctionsAggregator()
    result = await aggregator.batch_check(names)
    return result.data


# ======================== COMPREHENSIVE INVESTIGATION ========================


@router.post("/investigate/person")
async def investigate_person(request: ComprehensiveSearchRequest):
    """Повне розслідування особи.

    Об'єднує:
    - People Search (Epieos, Holehe, Sherlock)
    - Санкційні списки
    - Міжнародні бази
    """
    results: dict[str, Any] = {}

    # 1. People Search
    if request.username or request.email or request.phone:
        sherlock = SherlockTool()
        people_result = await sherlock.comprehensive_search(
            username=request.username,
            email=request.email,
            phone=request.phone,
        )
        results["people_search"] = people_result.data

    # 2. Sanctions check
    name_to_check = request.username or (request.email.split("@")[0] if request.email else None)
    if name_to_check:
        sanctions = SanctionsAggregator()
        sanctions_result = await sanctions.check_all(name_to_check, "individual")
        results["sanctions"] = sanctions_result.data

    # 3. Risk assessment
    risk_score = 0
    risk_factors = []

    if results.get("people_search", {}).get("summary", {}).get("digital_footprint") == "high":
        risk_score += 20
        risk_factors.append("Високий цифровий слід")

    if results.get("sanctions", {}).get("is_sanctioned"):
        risk_score += 100
        risk_factors.append("Знайдено у санкційних списках")

    if results.get("sanctions", {}).get("pep_status", {}).get("is_pep"):
        risk_score += 50
        risk_factors.append("Політично значуща особа (PEP)")

    results["risk_assessment"] = {
        "risk_score": min(100, risk_score),
        "risk_level": "critical" if risk_score >= 100 else "high" if risk_score >= 50 else "medium" if risk_score >= 20 else "low",
        "risk_factors": risk_factors,
    }

    return results


@router.post("/investigate/company")
async def investigate_company(request: CompanySearchRequest):
    """Повне розслідування компанії.

    Об'єднує:
    - OpenCorporates
    - CrunchBase
    - Санкційні списки
    - Knowledge Graph
    """
    results: dict[str, Any] = {"company_name": request.name}

    # 1. OpenCorporates
    oc_client = OpenCorporatesClient()
    oc_result = await oc_client.search_company(
        name=request.name,
        jurisdiction=request.jurisdiction,
    )
    results["opencorporates"] = oc_result.data

    # 2. CrunchBase
    cb_client = CrunchBaseClient()
    cb_result = await cb_client.search_organization(request.name)
    results["crunchbase"] = cb_result.data

    # 3. Sanctions
    sanctions = SanctionsAggregator()
    sanctions_result = await sanctions.check_all(request.name, "organization")
    results["sanctions"] = sanctions_result.data

    # 4. Risk assessment
    risk_score = 0
    risk_factors = []

    if results.get("sanctions", {}).get("is_sanctioned"):
        risk_score += 100
        risk_factors.append("Знайдено у санкційних списках")

    # Перевірка офшорних зв'язків
    if request.jurisdiction in ["cy", "bvi", "ky", "pa"]:
        risk_score += 30
        risk_factors.append(f"Офшорна юрисдикція: {request.jurisdiction}")

    results["risk_assessment"] = {
        "risk_score": min(100, risk_score),
        "risk_level": "critical" if risk_score >= 100 else "high" if risk_score >= 50 else "medium" if risk_score >= 20 else "low",
        "risk_factors": risk_factors,
    }

    return results


@router.get("/status")
async def get_osint_2_status():
    """Статус OSINT 2.0 інструментів."""
    return {
        "people_search": {
            "epieos": {"status": "active", "description": "Email/Phone deep search"},
            "holehe": {"status": "active", "description": "120+ services check"},
            "sherlock": {"status": "active", "description": "340+ social networks"},
        },
        "digital_forensics": {
            "spiderfoot": {"status": "active", "description": "200+ sources"},
            "hunchly": {"status": "active", "description": "Investigation documentation"},
            "metagoofil": {"status": "active", "description": "Metadata extraction"},
        },
        "knowledge_graph": {
            "stix_builder": {"status": "active", "description": "STIX 2.1 ontology"},
            "nlp_extractor": {"status": "active", "description": "NER + Relation extraction"},
            "rag_engine": {"status": "active", "description": "Natural language queries"},
        },
        "international": {
            "opencorporates": {"status": "active", "description": "200M+ companies"},
            "crunchbase": {"status": "active", "description": "Startups & investments"},
            "sanctions": {"status": "active", "description": "OFAC, EU, UK, UN, FATF"},
        },
        "total_tools": 12,
        "total_data_sources": "500+",
    }
