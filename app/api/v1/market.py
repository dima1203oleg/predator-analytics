"""
📊 Ринок — /api/v1/market

Ендпоінти ринкової аналітики: декларації, огляд ринку, тренди.
"""

from __future__ import annotations

from fastapi import APIRouter, Query

router = APIRouter(prefix="/market")


@router.get("/overview")
async def get_market_overview() -> dict:
    """
    Загальний огляд ринку.

    Повертає сумарні дані за період (декларації, обсяги, ТОП-товари).
    """
    return {
        "total_declarations": 12450,
        "total_value_usd": 850_000_000,
        "total_companies": 2340,
        "top_products": [
            {
                "code": "84713000",
                "name": "Портативні ЕОМ (ноутбуки)",
                "value_usd": 45_000_000,
                "change_percent": 12.5,
            },
            {
                "code": "85171200",
                "name": "Телефони стільникові",
                "value_usd": 38_000_000,
                "change_percent": -3.2,
            },
            {
                "code": "87032310",
                "name": "Автомобілі легкові (до 1500 куб.см)",
                "value_usd": 95_000_000,
                "change_percent": 7.8,
            },
        ],
        "period": "2025-Q4",
    }


@router.get("/declarations")
async def get_declarations(
    limit: int = Query(default=50, ge=1, le=500),
    page: int = Query(default=1, ge=1),
) -> dict:
    """
    Список митних декларацій з пагінацією.

    Повертає декларації з фільтрацією та пошуком.
    """
    # Mock дані — замінити на реальний сервіс
    companies = [
        {"name": "ТОВ «Технологія Майбутнього»", "edrpou": "12345678"},
        {"name": "ПАТ «Укрімпорт»", "edrpou": "87654321"},
        {"name": "ФОП Коваленко О.В.", "edrpou": "11223344"},
        {"name": "ТОВ «Глобал Трейд»", "edrpou": "99887766"},
        {"name": "ПП «Інновація»", "edrpou": "55443322"},
    ]

    products = [
        {"code": "84713000", "name": "Портативні ЕОМ (ноутбуки)"},
        {"code": "85171200", "name": "Телефони стільникові"},
        {"code": "87032310", "name": "Автомобілі легкові"},
        {"code": "61091000", "name": "Футболки бавовняні"},
        {"code": "90213900", "name": "Медичні прилади"},
    ]

    countries = ["CN", "DE", "PL", "TR", "US", "KR", "JP"]
    import random

    items = []
    for i in range(limit):
        company = companies[i % len(companies)]
        product = products[i % len(products)]
        country = countries[i % len(countries)]

        items.append({
            "id": f"DECL-{i + 1:06d}",
            "declaration_number": f"UA{100000 + i}UA",
            "declaration_date": f"2025-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
            "company_name": company["name"],
            "company_edrpou": company["edrpou"],
            "product_code": product["code"],
            "product_name": product["name"],
            "country_code": country,
            "weight_kg": round(100 + random.random() * 10000),
            "value_usd": round(1000 + random.random() * 500000),
            "anomaly_score": round(random.random(), 3) if random.random() > 0.8 else None,
        })

    return {
        "items": items,
        "total": 12450,
        "page": page,
        "limit": limit,
    }
