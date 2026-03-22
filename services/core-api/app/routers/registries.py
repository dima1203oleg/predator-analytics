"""Ukraine Registries Router — Державні реєстри України.

Endpoints:
- /edr — Єдиний державний реєстр
- /vat — Реєстр платників ПДВ
- /debtors — Реєстр боржників
- /court — Судовий реєстр
- /prozorro — Публічні закупівлі
- /sanctions — Санкції РНБО
- /property — Нерухомість
- /vehicles — Транспортні засоби
- /investigate — Комплексне розслідування
"""
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.permissions import Permission
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.ukraine_registries import (
    CompanyStatus,
    UkraineRegistriesService,
)

router = APIRouter(prefix="/ukraine-registries", tags=["державні реєстри України"])


# ======================== STATUS ========================


@router.get("/status", summary="Статус підключення до реєстрів")
async def get_registries_status(
    service: Annotated[UkraineRegistriesService, Depends()],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
):
    """Отримати статус усіх підключених реєстрів."""
    return await service.get_registries_status()


# ======================== REQUEST MODELS ========================


class CompanySearchRequest(BaseModel):
    """Запит на пошук компаній."""

    name: str | None = Field(None, description="Назва компанії")
    region: str | None = Field(None, description="Регіон")
    kved: str | None = Field(None, description="Код КВЕД")
    status: str | None = Field(None, description="Статус")
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class CourtSearchRequest(BaseModel):
    """Запит на пошук судових справ."""

    party_name: str | None = Field(None, description="Назва сторони")
    party_edrpou: str | None = Field(None, description="ЄДРПОУ сторони")
    case_number: str | None = Field(None, description="Номер справи")
    court: str | None = Field(None, description="Назва суду")
    date_from: date | None = Field(None, description="Дата від")
    date_to: date | None = Field(None, description="Дата до")
    limit: int = Field(default=50, ge=1, le=200)


class TenderSearchRequest(BaseModel):
    """Запит на пошук тендерів."""

    participant_edrpou: str | None = Field(None, description="ЄДРПОУ учасника")
    procuring_entity_edrpou: str | None = Field(None, description="ЄДРПОУ замовника")
    status: str | None = Field(None, description="Статус тендера")
    amount_from: float | None = Field(None, description="Сума від")
    amount_to: float | None = Field(None, description="Сума до")
    date_from: date | None = Field(None, description="Дата від")
    date_to: date | None = Field(None, description="Дата до")
    limit: int = Field(default=50, ge=1, le=200)


class SanctionCheckRequest(BaseModel):
    """Запит на перевірку санкцій."""

    name: str = Field(..., description="ПІБ або назва")
    edrpou: str | None = Field(None, description="ЄДРПОУ")
    rnokpp: str | None = Field(None, description="РНОКПП")


class PropertySearchRequest(BaseModel):
    """Запит на пошук нерухомості."""

    owner_name: str | None = Field(None, description="ПІБ власника")
    owner_edrpou: str | None = Field(None, description="ЄДРПОУ власника")
    owner_rnokpp: str | None = Field(None, description="РНОКПП власника")
    address: str | None = Field(None, description="Адреса")
    limit: int = Field(default=50, ge=1, le=200)


class VehicleSearchRequest(BaseModel):
    """Запит на пошук транспортних засобів."""

    owner_name: str | None = Field(None, description="ПІБ власника")
    owner_edrpou: str | None = Field(None, description="ЄДРПОУ власника")
    owner_rnokpp: str | None = Field(None, description="РНОКПП власника")
    vin: str | None = Field(None, description="VIN код")
    plate_number: str | None = Field(None, description="Номерний знак")
    limit: int = Field(default=50, ge=1, le=200)


# ======================== ЄДР ========================


@router.get("/edr/company/{edrpou}", summary="Дані компанії з ЄДР")
async def get_company(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати повні дані компанії з Єдиного державного реєстру."""
    service = UkraineRegistriesService()
    try:
        company = await service.get_company(edrpou)
        if not company:
            raise HTTPException(status_code=404, detail=f"Компанію з ЄДРПОУ {edrpou} не знайдено")

        return {
            "edrpou": company.edrpou,
            "name": company.name,
            "short_name": company.short_name,
            "status": company.status.value,
            "registration_date": company.registration_date.isoformat() if company.registration_date else None,
            "address": {
                "full": company.address.full if company.address else None,
                "region": company.address.region if company.address else None,
                "city": company.address.city if company.address else None,
                "street": company.address.street if company.address else None,
                "building": company.address.building if company.address else None,
            } if company.address else None,
            "kved": {
                "primary": company.kved_primary,
                "primary_name": company.kved_primary_name,
                "secondary": company.kved_secondary,
            },
            "authorized_capital": company.authorized_capital,
            "founders": [
                {
                    "name": f.name,
                    "type": f.type,
                    "share": f.share,
                    "edrpou": f.edrpou,
                    "rnokpp": f.rnokpp,
                    "country": f.country,
                }
                for f in company.founders
            ],
            "managers": [
                {
                    "name": m.name,
                    "position": m.position,
                    "appointment_date": m.appointment_date.isoformat() if m.appointment_date else None,
                }
                for m in company.managers
            ],
            "beneficiaries": [
                {
                    "name": b.name,
                    "ownership_percentage": b.ownership_percentage,
                    "country": b.country,
                }
                for b in company.beneficiaries
            ],
            "contacts": {
                "phone": company.phone,
                "email": company.email,
                "website": company.website,
            },
        }
    finally:
        await service.close()


@router.post("/edr/search", summary="Пошук компаній")
async def search_companies(
    request: CompanySearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук компаній за критеріями."""
    service = UkraineRegistriesService()
    try:
        status = CompanyStatus(request.status) if request.status else None
        companies, total = await service.search_companies(
            name=request.name,
            region=request.region,
            kved=request.kved,
            status=status,
            limit=request.limit,
            offset=request.offset,
        )

        return {
            "total": total,
            "limit": request.limit,
            "offset": request.offset,
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


@router.get("/edr/company/{edrpou}/history", summary="Історія змін компанії")
async def get_company_history(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати історію змін компанії."""
    service = UkraineRegistriesService()
    try:
        history = await service.get_company_history(edrpou)
        return {
            "edrpou": edrpou,
            "changes": history,
        }
    finally:
        await service.close()


# ======================== ПДВ ========================


@router.get("/vat/{edrpou}", summary="Статус платника ПДВ")
async def check_vat_status(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Перевірка статусу платника ПДВ."""
    service = UkraineRegistriesService()
    try:
        vat = await service.check_vat_status(edrpou)
        return {
            "edrpou": vat.edrpou,
            "name": vat.name,
            "ipn": vat.ipn,
            "is_vat_payer": vat.is_vat_payer,
            "registration_date": vat.registration_date.isoformat() if vat.registration_date else None,
            "status": vat.status,
            "tax_office": vat.tax_office,
        }
    finally:
        await service.close()


# ======================== БОРЖНИКИ ========================


@router.get("/debtors/{edrpou}", summary="Податкові борги")
async def check_debtor(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Перевірка податкових боргів."""
    service = UkraineRegistriesService()
    try:
        debtor = await service.check_debtor(edrpou)
        return {
            "edrpou": debtor.edrpou,
            "name": debtor.name,
            "has_debt": debtor.has_debt,
            "total_debt": debtor.total_debt,
            "debts": [
                {
                    "type": d.type,
                    "amount": d.amount,
                    "date": d.date.isoformat() if d.date else None,
                    "description": d.description,
                }
                for d in debtor.debts
            ],
            "is_restructured": debtor.is_restructured,
        }
    finally:
        await service.close()


# ======================== СУДОВИЙ РЕЄСТР ========================


@router.post("/court/search", summary="Пошук судових справ")
async def search_court_cases(
    request: CourtSearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук судових справ за критеріями."""
    service = UkraineRegistriesService()
    try:
        cases, total = await service.search_court_cases(
            party_name=request.party_name,
            party_edrpou=request.party_edrpou,
            case_number=request.case_number,
            court=request.court,
            date_from=request.date_from,
            date_to=request.date_to,
            limit=request.limit,
        )

        return {
            "total": total,
            "cases": [
                {
                    "case_number": c.case_number,
                    "court": c.court,
                    "date": c.date.isoformat(),
                    "type": c.type.value,
                    "status": c.status,
                    "parties": [
                        {
                            "name": p.name,
                            "role": p.role.value,
                            "edrpou": p.edrpou,
                        }
                        for p in c.parties
                    ],
                    "subject": c.subject,
                    "amount": c.amount,
                    "decisions": [
                        {
                            "date": d.date.isoformat(),
                            "type": d.type,
                            "summary": d.summary,
                        }
                        for d in c.decisions
                    ],
                }
                for c in cases
            ],
        }
    finally:
        await service.close()


@router.get("/court/case/{case_number}", summary="Судова справа")
async def get_court_case(
    case_number: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Отримати судову справу за номером."""
    service = UkraineRegistriesService()
    try:
        case = await service.get_court_case(case_number)
        if not case:
            raise HTTPException(status_code=404, detail=f"Справу {case_number} не знайдено")

        return {
            "case_number": case.case_number,
            "court": case.court,
            "date": case.date.isoformat(),
            "type": case.type.value,
            "status": case.status,
            "parties": [
                {
                    "name": p.name,
                    "role": p.role.value,
                    "edrpou": p.edrpou,
                }
                for p in case.parties
            ],
            "subject": case.subject,
            "amount": case.amount,
            "decisions": [
                {
                    "date": d.date.isoformat(),
                    "type": d.type,
                    "summary": d.summary,
                }
                for d in case.decisions
            ],
        }
    finally:
        await service.close()


# ======================== PROZORRO ========================


@router.post("/prozorro/search", summary="Пошук тендерів")
async def search_tenders(
    request: TenderSearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук тендерів у Prozorro."""
    service = UkraineRegistriesService()
    try:
        tenders, total = await service.search_tenders(
            participant_edrpou=request.participant_edrpou,
            procuring_entity_edrpou=request.procuring_entity_edrpou,
            status=request.status,
            amount_from=request.amount_from,
            amount_to=request.amount_to,
            date_from=request.date_from,
            date_to=request.date_to,
            limit=request.limit,
        )

        return {
            "total": total,
            "tenders": [
                {
                    "tender_id": t.tender_id,
                    "title": t.title,
                    "status": t.status,
                    "procuring_entity": {
                        "name": t.procuring_entity_name,
                        "edrpou": t.procuring_entity_edrpou,
                    },
                    "expected_value": t.expected_value,
                    "currency": t.currency,
                    "participants": [
                        {
                            "name": p.name,
                            "edrpou": p.edrpou,
                            "bid_amount": p.bid_amount,
                            "is_winner": p.is_winner,
                        }
                        for p in t.participants
                    ],
                    "award_date": t.award_date.isoformat() if t.award_date else None,
                    "contract_amount": t.contract_amount,
                }
                for t in tenders
            ],
        }
    finally:
        await service.close()


# ======================== САНКЦІЇ ========================


@router.post("/sanctions/check", summary="Перевірка санкцій")
async def check_sanctions(
    request: SanctionCheckRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Перевірка у санкційних списках (РНБО, OFAC, EU, UK, UN)."""
    service = UkraineRegistriesService()
    try:
        result = await service.check_sanctions(
            name=request.name,
            edrpou=request.edrpou,
            rnokpp=request.rnokpp,
        )

        return {
            "query": result.query,
            "is_sanctioned": result.is_sanctioned,
            "matches": [
                {
                    "name": m.name,
                    "list_name": m.list_name,
                    "date_added": m.date_added.isoformat() if m.date_added else None,
                    "reason": m.reason,
                }
                for m in result.matches
            ],
            "checked_lists": result.checked_lists,
            "checked_at": result.checked_at.isoformat(),
        }
    finally:
        await service.close()


# ======================== НЕРУХОМІСТЬ ========================


@router.post("/property/search", summary="Пошук нерухомості")
async def search_property(
    request: PropertySearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук об'єктів нерухомості."""
    service = UkraineRegistriesService()
    try:
        properties = await service.search_real_estate(
            owner_name=request.owner_name,
            owner_edrpou=request.owner_edrpou,
            owner_rnokpp=request.owner_rnokpp,
            address=request.address,
            limit=request.limit,
        )

        return {
            "total": len(properties),
            "items": [
                {
                    "cadastral_number": p.cadastral_number,
                    "address": p.address,
                    "type": p.type,
                    "area_sqm": p.area_sqm,
                    "owner_name": p.owner_name,
                    "registration_date": p.registration_date.isoformat() if p.registration_date else None,
                }
                for p in properties
            ],
        }
    finally:
        await service.close()


# ======================== ТРАНСПОРТ ========================


@router.post("/vehicles/search", summary="Пошук транспортних засобів")
async def search_vehicles(
    request: VehicleSearchRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_CORP_DATA])),
):
    """Пошук транспортних засобів."""
    service = UkraineRegistriesService()
    try:
        vehicles = await service.search_vehicles(
            owner_name=request.owner_name,
            owner_edrpou=request.owner_edrpou,
            owner_rnokpp=request.owner_rnokpp,
            vin=request.vin,
            plate_number=request.plate_number,
            limit=request.limit,
        )

        return {
            "total": len(vehicles),
            "items": [
                {
                    "vin": v.vin,
                    "plate_number": v.plate_number,
                    "brand": v.brand,
                    "model": v.model,
                    "year": v.year,
                    "color": v.color,
                    "owner_name": v.owner_name,
                    "registration_date": v.registration_date.isoformat() if v.registration_date else None,
                }
                for v in vehicles
            ],
        }
    finally:
        await service.close()


# ======================== КОМПЛЕКСНЕ РОЗСЛІДУВАННЯ ========================


@router.get("/investigate/company/{edrpou}", summary="Комплексне розслідування компанії")
async def investigate_company(
    edrpou: str,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Повне розслідування компанії з усіх реєстрів."""
    service = UkraineRegistriesService()
    try:
        result = await service.investigate_company(edrpou)
        return result
    finally:
        await service.close()


@router.get("/investigate/person/{rnokpp}", summary="Комплексне розслідування особи")
async def investigate_person(
    rnokpp: str,
    name: Annotated[str, Query(description="ПІБ особи")],
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.RUN_ANALYTICS])),
):
    """Повне розслідування фізичної особи з усіх реєстрів."""
    service = UkraineRegistriesService()
    try:
        result = await service.investigate_person(rnokpp, name)
        return result
    finally:
        await service.close()
