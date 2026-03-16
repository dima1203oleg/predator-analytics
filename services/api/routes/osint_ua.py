import logging

from fastapi import APIRouter, HTTPException
from services.data_collectors.ua_state.datagov import DataGovUACollector
from services.data_collectors.ua_state.prozorro import ProzorroCollector

router = APIRouter()
logger = logging.getLogger(__name__)
prozorro = ProzorroCollector()
datagov = DataGovUACollector()

@router.get("/prozorro/tenders")
async def get_prozorro_tenders(limit: int = 20, offset: str = ""):
    """Proxy to fetch REAL data from Prozorro API.
    """
    try:
        data = prozorro.fetch_tenders(limit=limit, offset=offset)

        # Hydrate with details for each tender to make it useful
        hydrated_data = []
        for summary in data.get("data", []):
            detail = prozorro.get_tender_details(summary["id"])
            if detail:
                hydrated_data.append({
                    "id": summary["id"],
                    "title": detail.get("title"),
                    "value": detail.get("value", {}).get("amount"),
                    "currency": detail.get("value", {}).get("currency"),
                    "status": detail.get("status"),
                    "procuringEntity": detail.get("procuringEntity", {}).get("name"),
                    "date": detail.get("dateModified")
                })
            else:
                hydrated_data.append(summary)

        return {
            "tenders": hydrated_data,
            "next_page": data.get("next_page", {})
        }
    except Exception as e:
        logger.error(f"Prozorro proxy error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/prozorro/tenders/{tender_id}")
async def get_prozorro_tender_detail(tender_id: str):
    """Get full details for a specific tender.
    """
    detail = prozorro.get_tender_details(tender_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Tender not found")
    return detail

@router.get("/datagov/search")
async def search_datagov_datasets(q: str = "", rows: int = 10, start: int = 0):
    """Proxy to find datasets on the Open Data Portal.
    """
    try:
        results = datagov.search_datasets(query=q, rows=rows, start=start)
        if not results.get("success"):
             raise HTTPException(status_code=500, detail=results.get("error"))
        return results["result"]
    except Exception as e:
        logger.error(f"Datagov search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/datagov/datasets/{id}")
async def get_datagov_dataset(id: str):
    """Get structure of a specific dataset.
    """
    try:
        results = datagov.get_dataset_details(dataset_id=id)
        if not results.get("success"):
            raise HTTPException(status_code=404, detail="Dataset not found or error")
        return results["result"]
    except Exception as e:
        logger.error(f"Datagov get error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
