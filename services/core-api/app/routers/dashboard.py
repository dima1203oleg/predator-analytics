from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_tenant_id
from predator_common.models import Alert, Anomaly, Company, Declaration, RiskScore

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/overview")
async def get_dashboard_overview(
    tenant_id: str = Depends(get_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Повертає консолідовані дані для головної панелі PREDATOR Analytics v56.1.4."""
    # 1. Загальна статистика (SQLAlchemy)
    companies_count = await db.scalar(select(func.count()).select_from(Company)) or 0
    declarations_count = await db.scalar(select(func.count()).select_from(Declaration)) or 0
    high_risk_count = await db.scalar(
        select(func.count()).select_from(RiskScore).where(RiskScore.cers >= 80)
    ) or 0
    medium_risk_count = 156 # Mock

    # 2. Останні алерти
    last_alerts = (await db.execute(
        select(Alert).order_by(Alert.created_at.desc()).limit(10)
    )).scalars().all()

    # 3. Аномалії
    anomalies_count = await db.scalar(select(func.count()).select_from(Anomaly)) or 0

    # 4. Формуємо структуру DashboardOverview згідно з UI v56.1.4
    return {
        "summary": {
            "total_declarations": declarations_count,
            "total_value_usd": 1250000000.50, # Mock
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "import_count": 89000,
            "export_count": declarations_count - 89000 if declarations_count > 89000 else 15000,
            "graph_nodes": 12450,
            "graph_edges": 45600,
            "search_documents": 1420000,
            "vectors": 450000,
            "active_pipelines": 3,
            "completed_pipelines": 124
        },
        "radar": [
            {"name": "ТОВ 'Газ-Трейд'", "value": 92.5, "count": 14},
            {"name": "ПП 'Медуза'", "value": 85.1, "count": 8},
            {"name": "Брокер-А", "value": 78.4, "count": 45}
        ],
        "top_risk_companies": [
            {
                "name": "Метал-Інвест Холдинг",
                "edrpou": "38291045",
                "maxRisk": 98,
                "totalValue": 45000000,
                "count": 112
            },
            {
                "name": "Транс-Груп",
                "edrpou": "40112345",
                "maxRisk": 88,
                "totalValue": 12000000,
                "count": 45
            }
        ],
        "alerts": [
            {
                "id": str(a.id),
                "type": "risk_burst",
                "message": a.title,
                "severity": a.severity if a.severity in ["critical", "warning", "info"] else "warning",
                "timestamp": a.created_at.isoformat(),
                "sector": "Енергетика",
                "company": a.entity_id or "Невідомо",
                "value": 150000
            }
            for a in last_alerts
        ],
        "infrastructure": {
            "postgres": {"status": "ok", "records": declarations_count},
            "neo4j": {"status": "ok", "nodes": 12450, "edges": 45600},
            "opensearch": {"status": "ok", "documents": 1420000},
            "qdrant": {"status": "ok", "vectors": 450000},
            "kafka": {"status": "ok", "keys": 124000},
            "redis": {"status": "ok", "keys": 8500}
        },
        "engines": {
            "aml_core": {
                "id": "aml-01",
                "name": "AML Core",
                "score": 98.4,
                "trend": "up",
                "status": "optimal",
                "throughput": 450,
                "latency": 45,
                "load": 22
            },
            "graph_ai": {
                "id": "graph-01",
                "name": "Graph AI",
                "score": 92.1,
                "trend": "stable",
                "status": "optimal",
                "throughput": 120,
                "latency": 350,
                "load": 45
            }
        },
        "categories": {
            "8502": {"count": 452, "value": 12450000, "avgRisk": 42},
            "8504": {"count": 89, "value": 5600000, "avgRisk": 12},
            "2710": {"count": 1204, "value": 890000000, "avgRisk": 65}
        },
        "countries": {
            "CN": {"count": 4500, "value": 450000000},
            "DE": {"count": 1200, "value": 120000000},
            "PL": {"count": 890, "value": 45000000}
        },
        "customs_offices": {
            "UA100000": {"count": 45000, "value": 450000000, "highRisk": 12},
            "UA500000": {"count": 22000, "value": 220000000, "highRisk": 8}
        },
        "generated_at": datetime.now(UTC).isoformat()
    }
