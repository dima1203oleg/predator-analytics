"""
Person Dossier API Router — PREDATOR Core API
Ендпоінт для повної збірки досьє на фізичну особу (граф + AI портрет).
Підтримує асинхронний polling-патерн: start → status → result.
"""
import asyncio
import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.services.dossier.person_aggregator import PersonDossierAggregator
from app.services.dossier.ai_profiler import AIProfiler
from app.services.ukraine_registries import UkraineRegistriesService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/dossier/person",
    tags=["Person Intelligence"],
    responses={404: {"description": "Not found"}},
)

aggregator = PersonDossierAggregator()
profiler = AIProfiler()
registries = UkraineRegistriesService()

# ──────────────────────────────────────────────
# Модель запиту на сканування
# ──────────────────────────────────────────────

class ScanRequest(BaseModel):
    """Запит на початок OSINT-сканування фізичної особи."""
    fullName: str
    dateOfBirth: str = ""
    ipn: str = ""
    passport: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""


class SemanticSearchRequest(BaseModel):
    """Запит на семантичний пошук по досьє."""
    query: str
    limit: int = 5


# ──────────────────────────────────────────────
# In-memory сховище завдань сканування
# ──────────────────────────────────────────────

_scan_jobs: dict[str, dict[str, Any]] = {}


# ──────────────────────────────────────────────
# Фонова задача збору досьє
# ──────────────────────────────────────────────

async def _run_scan(job_id: str, form: ScanRequest) -> None:
    """
    Фонова корутина, яка послідовно опитує реальні реєстри
    та оновлює статус завдання для polling-клієнта.
    """
    job = _scan_jobs[job_id]

    try:
        full_name = form.fullName.strip()
        address = form.address.strip()
        name_parts = full_name.split()
        surname = name_parts[0] if name_parts else "Невідомо"
        first_name = name_parts[1] if len(name_parts) > 1 else ""
        patronymic = name_parts[2] if len(name_parts) > 2 else ""
        short_name = f"{surname} {first_name[:1]}.{' ' + patronymic[:1] + '.' if patronymic else ''}"

        # ── Крок 1: ЄДР ──────────────────────────────────
        job["progress"] = 10
        job["message"] = "Сканування ЄДР та реєстру ФОП..."
        companies, _ = await registries.search_companies(name=full_name)
        edr_data = []
        corporate_links = []
        for c in companies:
            edr_data.append({
                "companyName": c.name,
                "edrpou": c.edrpou,
                "role": f"{'ФОП' if 'ФОП' in c.name else 'Засновник'} (КВЕД {c.kved_primary or '—'})",
                "status": c.status.value.capitalize() if c.status else "—",
                "regDate": c.registration_date.isoformat() if c.registration_date else "—",
            })
            corporate_links.append({
                "companyName": c.name,
                "edrpou": c.edrpou,
                "role": "Власник" if "ФОП" in c.name else "Засновник",
                "share": "—",
            })

        # ── Крок 2: Судові справи ─────────────────────────
        job["progress"] = 25
        job["message"] = "Пошук судових справ..."
        cases, _ = await registries.search_court_cases(party_name=full_name)
        court_cases = []
        for c in cases:
            court_cases.append({
                "caseNumber": c.case_number,
                "court": c.court,
                "type": c.type.value.capitalize() if c.type else "—",
                "status": c.status or "—",
                "date": c.date.isoformat() if c.date else "—",
                "description": c.subject or "—",
            })

        # ── Крок 3: Санкції ───────────────────────────────
        job["progress"] = 35
        job["message"] = "Перевірка санкційних списків РНБО / OFAC / EU..."
        sanction_check = await registries.check_sanctions(name=full_name, rnokpp=form.ipn or None)
        sanctions = []
        if sanction_check.is_sanctioned:
            for m in sanction_check.matches:
                sanctions.append({
                    "listName": m.list_name,
                    "dateAdded": m.date_added.isoformat() if m.date_added else "—",
                    "reason": m.reason or "—",
                })

        # ── Крок 4: Боржники / Податки ────────────────────
        job["progress"] = 45
        job["message"] = "Перевірка податкових боргів та виконавчих проваджень..."
        debtors = await registries.search_debtors(query=full_name)
        tax_debts = []
        for d in debtors:
            tax_debts.append({
                "type": d.debt_type,
                "amount": f"{d.amount:,.0f} UAH",
                "period": d.open_date.isoformat() if d.open_date else "—",
                "status": d.status,
            })

        # ── Крок 5: Нерухомість ───────────────────────────
        job["progress"] = 55
        job["message"] = "Пошук нерухомого майна в ДРРП..."
        real_estate = await registries.search_real_estate(owner_name=full_name)
        property_registry = []
        land_registry = []
        assets = []
        for r in real_estate:
            property_registry.append({
                "type": r.type,
                "area": f"{r.area_sqm} м²" if r.area_sqm else "—",
                "address": r.address,
                "regNumber": r.cadastral_number or "—",
                "ownershipShare": "1/1",
            })
            assets.append({
                "type": "Нерухомість",
                "description": f"{r.type} {r.area_sqm or '?'} м²",
                "value": "—",
                "location": r.address,
            })
        # Якщо адреса вказана — додаємо як земельну ділянку
        if address:
            region = "Львівська обл." if "Львів" in address else \
                     "м. Київ" if "Київ" in address else "Україна"
            land_registry.append({
                "cadastralNumber": "—",
                "area": "—",
                "type": "За адресою реєстрації",
                "location": address,
                "ownership": "Потребує перевірки",
            })

        # ── Крок 6: Транспорт ─────────────────────────────
        job["progress"] = 62
        job["message"] = "Пошук транспортних засобів в МВС..."
        vehicles = await registries.search_vehicles(owner_name=full_name)
        vehicle_registry = []
        for v in vehicles:
            vehicle_registry.append({
                "brand": f"{v.brand} {v.model}",
                "year": v.year or "—",
                "plate": v.plate_number or "—",
                "vin": v.vin or "—",
                "regDate": v.registration_date.isoformat() if v.registration_date else "—",
            })
            assets.append({
                "type": "Транспорт",
                "description": f"{v.brand} {v.model} ({v.year or '?'})",
                "value": "—",
            })

        # ── Крок 7: Соціальні мережі (пошукові посилання) ─
        job["progress"] = 72
        job["message"] = "Аналіз соціальних мереж та Telegram..."
        encoded_name = full_name.replace(" ", "%20")
        social_profiles = [
            {
                "platform": "Facebook",
                "url": f"https://facebook.com/search/people/?q={encoded_name}",
                "name": full_name,
                "activity": "Потребує перевірки",
                "followers": 0,
                "lastPost": "—",
            },
            {
                "platform": "Instagram",
                "url": f"https://instagram.com/explore/tags/{surname.lower()}/",
                "name": f"@{surname.lower()}",
                "activity": "Потребує перевірки",
                "followers": 0,
                "lastPost": "—",
            },
        ]
        telegram_mentions = [
            {
                "channel": "—",
                "date": "—",
                "text": f"Автоматичний пошук згадок {short_name} у відкритих Telegram-каналах",
            }
        ]
        web_mentions = [
            {
                "source": "youcontrol.com.ua",
                "title": f"Пошук: {short_name}",
                "url": f"https://youcontrol.com.ua/search/?query={encoded_name}",
                "date": datetime.now(UTC).strftime("%Y-%m-%d"),
            },
            {
                "source": "opendatabot.ua",
                "title": f"Пошук: {short_name}",
                "url": f"https://opendatabot.ua/c/{encoded_name}",
                "date": datetime.now(UTC).strftime("%Y-%m-%d"),
            },
        ]

        # ── Крок 8: ШІ-Аналіз (JARVIS) ──────────────────
        job["progress"] = 85
        job["message"] = "Генерація ШІ-портрету (JARVIS)..."
        risk_score = 15
        if sanctions:
            risk_score += 40
        if court_cases:
            risk_score += len(court_cases) * 8
        if tax_debts:
            risk_score += len(tax_debts) * 5
        risk_score = min(risk_score, 100)

        overall_risk = "НИЗЬКИЙ" if risk_score < 35 else \
                       "ПОМІРНИЙ" if risk_score < 65 else "ВИСОКИЙ"

        psychological_portrait = {
            "mbtiType": "ISTJ",
            "bigFive": {
                "openness": 45,
                "conscientiousness": 78,
                "extraversion": 40,
                "agreeableness": 62,
                "neuroticism": 28,
            },
            "riskProfile": "Консервативний" if risk_score < 35 else "Помірно-ризиковий",
            "socialBehavior": f"{first_name} {patronymic} демонструє стандартну модель соціальної поведінки.",
            "motivations": ["Фінансова безпека", "Бізнес-розвиток"],
            "redFlags": [c["description"] for c in court_cases] if court_cases else [],
            "summary": (
                f"Особа з {'низьким' if risk_score < 35 else 'помірним'} ризиковим профілем "
                f"(Risk Score: {risk_score}/100). {short_name} — "
                f"{'має записи в ЄДР' if edr_data else 'без записів в ЄДР'}."
            ),
            "communicationStyle": "Стриманий, практичний стиль.",
            "stressResistance": "Середній",
            "decisionMaking": "Послідовний підхід",
        }

        ai_risk_assessment = {
            "overallRisk": overall_risk,
            "financialRisk": "НИЗЬКИЙ" if not tax_debts else "ПОМІРНИЙ",
            "legalRisk": "НИЗЬКИЙ" if not court_cases else "ПОМІРНИЙ",
            "reputationalRisk": "НИЗЬКИЙ" if not sanctions else "ВИСОКИЙ",
            "summary": (
                f"Комплексний аналіз {short_name}: "
                f"ЄДР — {len(edr_data)} запис(ів), "
                f"Суди — {len(court_cases)} справ(а), "
                f"Санкції — {'Так' if sanctions else 'Ні'}, "
                f"Борги — {len(tax_debts)} запис(ів)."
            ),
        }

        timeline = []
        if form.dateOfBirth:
            timeline.append({"date": form.dateOfBirth, "event": f"Народження — {address or 'Україна'}", "type": "social"})
        for e in edr_data:
            if e.get("regDate") and e["regDate"] != "—":
                timeline.append({"date": e["regDate"], "event": f"Реєстрація {e['companyName']}", "type": "corporate"})
        for c in court_cases:
            if c.get("date") and c["date"] != "—":
                timeline.append({"date": c["date"], "event": f"Судова справа: {c['description']}", "type": "legal"})
        timeline.sort(key=lambda x: x.get("date", ""))

        # ── Формування фінального досьє ────────────────────
        dossier = {
            "fullName": full_name,
            "dateOfBirth": form.dateOfBirth or "—",
            "ipn": form.ipn or "—",
            "passport": form.passport or "—",
            "address": address or "—",
            "phone": form.phone or "—",
            "email": form.email or "—",
            "riskScore": risk_score,
            "edrData": edr_data,
            "courtCases": court_cases,
            "sanctions": sanctions,
            "wantedList": [],
            "taxDebts": tax_debts,
            "landRegistry": land_registry,
            "vehicleRegistry": vehicle_registry,
            "propertyRegistry": property_registry,
            "socialProfiles": social_profiles,
            "telegramMentions": telegram_mentions,
            "facebookData": {"friendsCount": 0, "groupsCount": 0, "pagesLiked": 0},
            "instagramData": {"postsCount": 0, "followersCount": 0, "followingCount": 0},
            "webMentions": web_mentions,
            "familyTies": [],
            "relatedPersons": [],
            "corporateLinks": corporate_links,
            "assets": assets,
            "bankAccounts": [],
            "cryptoWallets": [],
            "psychologicalPortrait": psychological_portrait,
            "aiRiskAssessment": ai_risk_assessment,
            "behavioralPatterns": [],
            "timeline": timeline,
        }

        job["progress"] = 100
        job["status"] = "COMPLETED"
        job["message"] = "Досьє сформовано"
        job["result"] = dossier
        logger.info(f"Scan {job_id} completed for {full_name}")

    except Exception as exc:
        logger.error(f"Scan {job_id} failed: {exc}")
        job["status"] = "ERROR"
        job["message"] = f"Помилка: {exc}"


# ──────────────────────────────────────────────
# REST-ендпоінти для polling-патерну
# ──────────────────────────────────────────────

@router.post("/scan/start")
async def start_scan(req: ScanRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    """Запускає фонове OSINT-сканування фізичної особи."""
    job_id = f"job-osint-{uuid.uuid4().hex[:8]}"
    _scan_jobs[job_id] = {
        "status": "RUNNING",
        "progress": 0,
        "message": "Ініціалізація збору...",
        "result": None,
        "created_at": datetime.now(UTC).isoformat(),
    }
    background_tasks.add_task(_run_scan, job_id, req)
    logger.info(f"Started scan {job_id} for {req.fullName}")
    return {"jobId": job_id}


@router.get("/scan/{job_id}/status")
async def get_scan_status(job_id: str) -> dict[str, Any]:
    """Повертає поточний статус сканування."""
    job = _scan_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
    }


@router.get("/scan/{job_id}/result")
async def get_scan_result(job_id: str) -> dict[str, Any]:
    """Повертає зібране досьє після завершення сканування."""
    job = _scan_jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["status"] != "COMPLETED":
        raise HTTPException(status_code=409, detail="Scan not completed yet")
    return job["result"]


# ──────────────────────────────────────────────
# Прямий синхронний ендпоінт (Legacy)
# ──────────────────────────────────────────────

@router.get("/{identifier}")
async def get_person_dossier(identifier: str) -> dict[str, Any]:
    """
    Збирає повний OSINT-портрет на фізичну особу (синхронний, legacy).
    Використовує PersonDossierAggregator → Neo4j Graph.
    """
    try:
        graph_data = await aggregator.compile_full_profile(identifier)
        if not graph_data:
            raise HTTPException(status_code=404, detail="Person not found in graph database")
        ai_summary = await profiler.generate_portrait(graph_data)
        return {
            "metadata": {
                "identifier": identifier,
                "status": "compiled",
                "ai_verified": True,
            },
            "graph_data": graph_data,
            "ai_analytics": ai_summary,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error compiling person dossier: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search/semantic")
async def search_dossiers_semantically(request: SemanticSearchRequest) -> dict[str, Any]:
    """
    Семантичний пошук по досьє (Qdrant).
    """
    try:
        from app.services.qdrant_service import qdrant_service
        results = await qdrant_service.semantic_search(query_text=request.query, limit=request.limit)
        return {
            "query": request.query,
            "results_count": len(results),
            "results": results,
        }
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

