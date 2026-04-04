from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import Permission
from app.database import get_db
from app.dependencies import PermissionChecker, get_tenant_id
from app.services.ai_service import AIService
from predator_common.models import Anomaly, RiskScore

router = APIRouter(prefix="/premium", tags=["premium features"])

@router.get("/morning-brief")
async def get_premium_morning_brief(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Щоденний аналітичний підсумок (Daily Pulse)."""
    # Збираємо статистику
    risks_count = await db.scalar(
        select(func.count()).select_from(RiskScore).where(RiskScore.cers >= 80)
    ) or 0
    anomalies_count = await db.scalar(select(func.count()).select_from(Anomaly)) or 0

    stats = {
        "risks": risks_count,
        "anomalies": anomalies_count,
        "date": datetime.now(UTC).strftime("%Y-%m-%d"),
    }

    prompt = "Згенеруй короткий аналітичний підсумок дня для PREDATOR Analytics. Використовуй українську мову."
    report = await AIService.generate_insight(prompt, stats)

    return {
        "title": "Ранковий брифінг PREDATOR",
        "report": report,
        "metrics": stats,
        "generated_at": datetime.now(UTC).isoformat()
    }

@router.get("/ai-insights")
async def get_ai_insights(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_INTEL]))
):
    """Отримати останні інсайти від Trinity Engine."""
    return [
        {
            "id": "ins_1",
            "title": "Аномальна активність в офшорних зонах",
            "description": "Виявлено сплеск транзакцій через нові компанії в Белізі.",
            "severity": "high",
            "category": "scheme",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
        },
        {
            "id": "ins_2",
            "title": "Нова схема заниження митної вартості",
            "description": "Аналіз УКТЗЕД 8517 виявив системне відхилення цін на 40% для групи імпортерів.",
            "severity": "medium",
            "category": "customs",
            "timestamp": (datetime.now() - timedelta(hours=5)).isoformat()
        }
    ]

@router.get("/competitors")
async def get_competitors_list(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.READ_COMPANIES]))
):
    """Список конкурентів під моніторингом."""
    return [
        {"name": "ТОВ «Техно-Трейд»", "share": 15.5, "trend": "up", "risk": "low"},
        {"name": "ПРАТ «Глобал-Логістик»", "share": 12.2, "trend": "down", "risk": "medium"},
        {"name": "ТОВ «Смарт-Імпорт»", "share": 8.4, "trend": "stable", "risk": "high"},
    ]

@router.get("/market-trends")
async def get_market_trends(
    tenant_id: str = Depends(get_tenant_id),
):
    """Тренди ринку за основними кодами УКТЗЕД."""
    return {
        "categories": ["Електроніка", "Паливо", "Агро", "Хімія"],
        "values": [45, 30, 65, 20],
        "growth": [12.5, -5.2, 18.0, 3.1]
    }

@router.get("/dashboard-recommendations")
async def get_dashboard_recommendations(
    persona: str = Query(default="analyst"),
    tenant_id: str = Depends(get_tenant_id),
):
    """Персоналізовані рекомендації для дашборду."""
    recs = {
        "analyst": [
            "Перевірити зв'язки нового бенефіціара ТОВ «Митний Портал»",
            "Проаналізувати причину падіння інвойсної вартості зернових",
            "Оновити звіти по AML-ризиках для топ-10 імпортерів"
        ],
        "admin": [
            "Оновити ліцензії OpenSearch",
            "Переглянути логи аугментації даних за вчора",
            "Налаштувати нові правила алертів для санкційних списків"
        ]
    }
    return recs.get(persona, recs["analyst"])
