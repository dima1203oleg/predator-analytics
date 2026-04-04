from typing import Annotated, Any
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_tenant_id
from app.services.ukraine_registries import UkraineRegistriesService

router = APIRouter(prefix="/registries", tags=["Registries UI"])

@router.get("/search")
async def search_registries_ui(
    q: Annotated[str, Query(description="Пошуковий запит (ЄДРПОУ або назва)")],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
):
    """Пошук у реєстрах для UI версії v56.1.4."""
    service = UkraineRegistriesService()
    try:
        # Спершу пробуємо пошук за ЄДРПОУ, якщо q схожий на номер
        if q.isdigit() and len(q) in [8, 10]:
            company = await service.get_company(q)
            if company:
                return {
                    "total": 1,
                    "items": [{
                        "edrpou": company.edrpou,
                        "name": company.name,
                        "status": company.status.value,
                        "address": company.address.full if company.address else None
                    }]
                }
        
        # Інакше повнотекстовий пошук за назвою
        companies, total = await service.search_companies(name=q, limit=20)
        return {
            "total": total,
            "items": [
                {
                    "edrpou": c.edrpou,
                    "name": c.name,
                    "status": c.status.value,
                    "address": c.address.full if c.address else None,
                }
                for c in companies
            ],
        }
    finally:
        await service.close()

@router.get("/company/{edrpou}")
async def get_company_details_ui(
    edrpou: str,
    tenant_id: Annotated[str, Depends(get_tenant_id)],
):
    """Отримати деталі компанії за ЄДРПОУ для UI досьє."""
    service = UkraineRegistriesService()
    try:
        company = await service.get_company(edrpou)
        if not company:
            return {"error": "Компанію не знайдено"}
            
        return {
            "edrpou": company.edrpou,
            "name": company.name,
            "status": company.status.value,
            "registration_date": company.registration_date.isoformat() if company.registration_date else None,
            "address": company.address.full if company.address else None,
            "kved": company.kved_primary,
            "founders": [f.name for f in company.founders],
            "risk_score": 15, # Mock
            "diligence_status": "verified"
        }
    finally:
        await service.close()
