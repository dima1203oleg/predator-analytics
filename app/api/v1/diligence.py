"""🔍 Due Diligence — /api/v1/diligence

Ендпоінти ризик-аналізу компаній та партнерів.
"""

from __future__ import annotations

from fastapi import APIRouter, Path

router = APIRouter(prefix="/diligence")


@router.get("/company/{edrpou}")
async def get_company_profile(
    edrpou: str = Path(description="Код ЄДРПОУ компанії"),
) -> dict:
    """Повний профіль компанії з ризик-аналізом.

    Повертає інформацію з реєстрів, ризик-бали, зв'язки.
    """
    return {
        "edrpou": edrpou,
        "name": "ТОВ «Технологія Майбутнього»",
        "status": "active",
        "registration_date": "2015-03-15",
        "risk_score": 35.5,
        "sanctions": [],
        "anomalies": [],
        "directors": [
            {
                "id": "1234567890",
                "type": "Person",
                "label": "Петренко Іван Васильович",
                "properties": {
                    "role": "Директор",
                    "is_pep": False,
                },
            },
        ],
        "owners": [
            {
                "id": "0987654321",
                "type": "Person",
                "label": "Коваль Олена Миколаївна",
                "properties": {
                    "share_percent": 100,
                    "is_pep": False,
                },
            },
        ],
        "ultimate_beneficiaries": [],
        "related_companies": [],
    }
