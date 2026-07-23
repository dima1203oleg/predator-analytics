from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Any

from app.services.osint.datagov import DataGovUACollector

router = APIRouter(prefix="/osint_ua", tags=["OSINT Ukraine"])

# [DEPRECATED] Manual OSINT connectors are deprecated in favor of AI Factory
def get_datagov() -> DataGovUACollector:
    import logging
    logging.warning("[DEPRECATED] DataGovUACollector is deprecated. Use AI Factory.")
    return DataGovUACollector()

# [DEPRECATED] Manual OSINT connectors are deprecated
def get_prozorro() -> Any:
    raise HTTPException(status_code=501, detail="[DEPRECATED] Manual Prozorro API integration is deprecated. Use AI Factory Connectors.")

@router.get("/datagov/search", deprecated=True)
async def search_datagov(
    q: str = Query("", description="Пошуковий запит"),
    rows: int = Query(10, ge=1, le=100),
    start: int = Query(0, ge=0),
    datagov: DataGovUACollector = Depends(get_datagov)
):
    """Пошук по відкритих даних України (data.gov.ua)"""
    results = await datagov.search_datasets(query=q, rows=rows, start=start)
    if not results.get("success"):
        raise HTTPException(status_code=500, detail=results.get("error", "DataGov API error"))
    return results["result"]

@router.get("/prozorro/tenders", deprecated=True)
async def get_tenders(
    offset: str = Query("", description="Зміщення для пагінації"),
    limit: int = Query(10, ge=1, le=100),
    prozorro: Any = Depends(get_prozorro)
):
    """Отримання списку тендерів з Prozorro"""
    return await prozorro.fetch_tenders(offset=offset, limit=limit)

@router.get("/prozorro/tenders/{tender_id}", deprecated=True)
async def get_tender_detail(
    tender_id: str,
    prozorro: Any = Depends(get_prozorro)
):
    """Детальна інформація про конкретний тендер Prozorro"""
    detail = await prozorro.get_tender_details(tender_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Тендер не знайдено")
    return detail
