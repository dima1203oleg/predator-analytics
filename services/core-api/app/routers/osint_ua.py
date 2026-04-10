from fastapi import APIRouter, HTTPException, Query

from app.services.osint.datagov import DataGovUACollector
from app.services.osint.prozorro import ProzorroCollector
from app.services.osint.youcontrol import YouControlCollector

router = APIRouter(prefix="/osint_ua", tags=["OSINT Ukraine"])

datagov = DataGovUACollector()
prozorro = ProzorroCollector()
youcontrol = YouControlCollector()

@router.get("/youcontrol/dossier/{edrpou}")
async def search_youcontrol(edrpou: str):
    """Пошук повного досьє компанії за ЄДРПОУ через YouControl API."""
    result = await youcontrol.get_dossier(edrpou)
    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result

@router.get("/datagov/search")
async def search_datagov(
    q: str = Query("", description="Пошуковий запит"),
    rows: int = Query(10, ge=1, le=100),
    start: int = Query(0, ge=0)
):
    """Пошук по відкритих даних України (data.gov.ua)
    """
    results = await datagov.search_datasets(query=q, rows=rows, start=start)
    if not results.get("success"):
        raise HTTPException(status_code=500, detail=results.get("error", "DataGov API error"))
    return results["result"]

@router.get("/prozorro/tenders")
async def get_tenders(
    offset: str = Query("", description="Зміщення для пагінації"),
    limit: int = Query(10, ge=1, le=100)
):
    """Отримання списку тендерів з Prozorro
    """
    return await prozorro.fetch_tenders(offset=offset, limit=limit)

@router.get("/prozorro/tenders/{tender_id}")
async def get_tender_detail(tender_id: str):
    """Детальна інформація про конкретний тендер Prozorro
    """
    detail = await prozorro.get_tender_details(tender_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Тендер не знайдено")
    return detail
