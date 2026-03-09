"""
UA Connectors API (Phase 10 — SM Edition).

Endpoints for registry integration (Opendatabot, YouControl, Prozorro).
"""
from fastapi import APIRouter
from typing import Any

from app.services.connectors import OpendatabotClient, YouControlClient, ProzorroClient

router = APIRouter(prefix="/connectors-ua", tags=["UA Integrations (Registry, Sanctions, Prozorro)"])

_odb = OpendatabotClient()
_yc = YouControlClient()
_pz = ProzorroClient()


@router.get("/opendatabot/company/{edrpou}")
async def get_company_data(edrpou: str) -> dict[str, Any]:
    """Дані ЄДР компанії через Опендатабот."""
    return _odb.get_company_info(edrpou)


@router.get("/opendatabot/courts/{edrpou}")
async def get_company_courts(edrpou: str) -> list[dict[str, Any]]:
    """Судові справи компанії."""
    return _odb.get_court_cases(edrpou)


@router.get("/youcontrol/sanctions/{edrpou}")
async def check_company_sanctions(edrpou: str) -> dict[str, Any]:
    """Перевірка санкцій (РНБО, OFAC) через YouControl."""
    return _yc.check_sanctions(edrpou)


@router.get("/youcontrol/risk/{edrpou}")
async def get_company_risk_score(edrpou: str) -> dict[str, Any]:
    """Експрес-оцінка ризиків YouControl (FinScore/MarketScore)."""
    return _yc.get_express_risk(edrpou)


@router.get("/prozorro/tenders/{edrpou}")
async def get_company_tenders(edrpou: str) -> dict[str, Any]:
    """Державні закупівлі компанії на Prozorro."""
    return _pz.get_tenders(edrpou)
