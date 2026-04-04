from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/newspaper", tags=["newspaper"])

class NewspaperHeadline(BaseModel):
    title: str
    subtitle: str
    riskScore: int
    tag: str
    hook: str
    edrpou: str
    declarationNumber: str
    date: str

class NewspaperData(BaseModel):
    headline: NewspaperHeadline
    compromat: list[dict[str, Any]]
    trends: list[dict[str, Any]]
    customs: list[dict[str, Any]]
    alerts: list[dict[str, Any]]
    metrics: dict[str, Any]
    summary: str
    generated_at: str

@router.get("", response_model=NewspaperData)
async def get_newspaper_data():
    """Повертає дані для Газети ПРЕДАТОР (Ранковий брифінг)."""
    return {
        "headline": {
            "title": "МИТНИЙ ШТОРМ: ПЕРЕВІРКА КРИТИЧНОГО ІМПОРТУ",
            "subtitle": "Аналіз аномалій у секторі енергетичного обладнання",
            "riskScore": 88,
            "tag": "CRITICAL RISK",
            "hook": "Виявлено систематичне заниження митної вартості групою імпортерів у Одеській області.",
            "edrpou": "37189254",
            "declarationNumber": "UA100110/2024/001234",
            "date": datetime.now(UTC).strftime("%d.%m.%Y")
        },
        "compromat": [
            {
                "id": "c1",
                "title": "ТОВ 'Енерго-Трейд-Захід'",
                "subtitle": "Зв'язки з офшорними прокладками",
                "risk": "ВИСОКИЙ РИЗИК",
                "hook": "Прямі транзакції з компанією у списку FATF.",
                "riskLevel": "high",
                "source": "OSINT-Контур"
            },
            {
                "id": "c2",
                "title": "ПП 'Брокер-Плюс'",
                "subtitle": "Атипова активність",
                "risk": "СЕРЕДНІЙ РИЗИК",
                "hook": "Зростання обсягів оформлення на 450% за 3 дні.",
                "riskLevel": "medium",
                "source": "Митний Моніторинг"
            }
        ],
        "trends": [
            {
                "id": "t1",
                "title": "Генератори 8502",
                "subtitle": "Цінова аномалія",
                "hook": "Падіння декларованої вартості нижче ринкової на 35%.",
                "direction": "up",
                "percent": 35.4,
                "hsCode": "8502112000",
                "count": 452,
                "totalValue": 12450000
            },
            {
                "id": "t2",
                "title": "Трансформатори",
                "subtitle": "Дефіцит маржі",
                "hook": "Збільшення податкового навантаження на імпорт.",
                "direction": "down",
                "percent": 12.1,
                "hsCode": "8504210000",
                "count": 89,
                "totalValue": 5600000
            }
        ],
        "customs": [
            {
                "id": "cu1",
                "title": "Одеська митниця",
                "subtitle": "Червона зона",
                "hook": "Найвищий показник пропуску товарів з групи ризику.",
                "type": "risk",
                "avgRisk": 92
            },
            {
                "id": "cu2",
                "title": "Львівська митниця",
                "subtitle": "Оптимізація таймінгу",
                "hook": "Зменшення часу оформлення на 20% для білих списків.",
                "type": "opportunity",
                "avgRisk": 15
            }
        ],
        "alerts": [
            {
                "id": "a1",
                "text": "Критичне спрацювання на компанію 'Метал-Інвест'.",
                "urgency": "high",
                "time": "10:45"
            },
            {
                "id": "a2",
                "text": "Оновлено санкційний список РНБО: 12 нових позицій.",
                "urgency": "medium",
                "time": "09:30"
            }
        ],
        "metrics": {
            "materials": 124,
            "riskAlerts": 42,
            "trends": 18,
            "customsEvents": 9,
            "totalDeclarations": 145020,
            "totalValueUsd": 1250000000,
            "importCount": 89000,
            "exportCount": 56020
        },
        "summary": "На сьогодні ринок демонструє підвищену активність у секторі критичного імпорту. Система PREDATOR виявила 3 великих ланцюги заниження митних зборів. Рекомендовано перевірити компанії зі списку 'Компромат'.",
        "generated_at": datetime.now(UTC).isoformat()
    }
