"""Ownership Graph Router — API для роботи з графами власності компаній.

Ендпоінти:
- GET /graph/ownership/{edrpou} — граф власності компанії
- GET /graph/ownership/{edrpou}/tenders — зв'язок із тендерами Prozorro
- GET /graph/ownership/{edrpou}/risks — агреговані ризики (борг, обтяження)
"""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Path, Query

from predator_common.logging import get_logger

logger = get_logger("core_api.routers.ownership_graph")

router = APIRouter(prefix="/graph/ownership", tags=["ownership-graph"])


# Mock data for ownership graphs based on the analytical report
# In production, this would query Neo4j
_mock_graphs: dict[str, dict[str, Any]] = {
    "04362489": {
        "root_edrpou": "04362489",
        "collected_at": "2026-07-17T06:00:00Z",
        "depth": 2,
        "nodes": [
            {
                "node_id": "04362489",
                "label": "Борщагівська сільська рада",
                "node_type": "government",
                "properties": {
                    "legal_form": "Орган місцевого самоврядування",
                    "status": "зареєстровано",
                },
            },
            {
                "node_id": "43966710",
                "label": "Управління фінансів",
                "node_type": "government",
                "properties": {},
            },
            {
                "node_id": "43978511",
                "label": "Управління освіти",
                "node_type": "government",
                "properties": {},
            },
            {
                "node_id": "43933622",
                "label": "КП Бюро ритуальних послуг",
                "node_type": "company",
                "properties": {},
            },
            {
                "node_id": "32393133",
                "label": "КП Борщагівка",
                "node_type": "company",
                "properties": {},
            },
            {
                "node_id": "person_1",
                "label": "Наталія Ліщинецька",
                "node_type": "person",
                "properties": {"role": "Контактна особа (Тендери)"},
            },
        ],
        "edges": [
            {
                "source_id": "04362489",
                "target_id": "43966710",
                "relationship": "MANAGES",
                "properties": {},
            },
            {
                "source_id": "04362489",
                "target_id": "43978511",
                "relationship": "MANAGES",
                "properties": {},
            },
            {
                "source_id": "04362489",
                "target_id": "43933622",
                "relationship": "OWNS",
                "properties": {"share_percent": 100.0},
            },
            {
                "source_id": "04362489",
                "target_id": "32393133",
                "relationship": "TRANSFERS_ASSETS",
                "properties": {"asset": "Генератори"},
            },
            {
                "source_id": "person_1",
                "target_id": "04362489",
                "relationship": "REPRESENTS_IN_TENDERS",
                "properties": {},
            },
        ],
    },
}

_mock_risks: dict[str, dict[str, Any]] = {
    "04362489": {
        "edrpou": "04362489",
        "risk_score": 15,
        "risk_level": "LOW",
        "indicators": [
            {
                "type": "tax_debt",
                "description": "Податковий борг відсутній",
                "severity": "info",
                "source": "ДПС",
            },
            {
                "type": "encumbrances",
                "description": "Майно не перебуває в заставі",
                "severity": "info",
                "source": "ДРОРМ",
            },
            {
                "type": "enforcement",
                "description": "Активних виконавчих проваджень не знайдено",
                "severity": "info",
                "source": "ЄРБ",
            },
            {
                "type": "collusion_risk",
                "description": "Виявлено регулярні закупівлі з однією групою постачальників",
                "severity": "warning",
                "source": "Prozorro (Аналітика)",
            },
        ],
        "last_updated": "2026-07-17T06:30:00Z",
    }
}


@router.get("/{edrpou}")
async def get_ownership_graph(
    edrpou: str = Path(..., description="Код ЄДРПОУ компанії (8 цифр)"),
    depth: int = Query(default=2, ge=1, le=5, description="Глибина графа"),
) -> dict[str, Any]:
    """Отримати граф власності компанії.

    Повертає вузли (компанії, особи) та зв'язки (засновник, бенефіціар, директор)
    у форматі, зручному для візуалізації (наприклад, Cytoscape.js).
    """
    logger.info(f"📊 Запит графа власності для ЄДРПОУ: {edrpou} (глибина {depth})")

    graph = _mock_graphs.get(edrpou)

    if not graph:
        # Повертаємо порожній граф, якщо даних немає
        return {
            "root_edrpou": edrpou,
            "collected_at": datetime.now(UTC).isoformat(),
            "depth": depth,
            "nodes": [
                {
                    "node_id": edrpou,
                    "label": f"Компанія {edrpou}",
                    "node_type": "company",
                    "properties": {"status": "unknown"},
                }
            ],
            "edges": [],
            "message": "Дані відсутні або компанію не знайдено",
        }

    return graph


@router.get("/{edrpou}/risks")
async def get_company_risks(
    edrpou: str = Path(..., description="Код ЄДРПОУ компанії (8 цифр)"),
) -> dict[str, Any]:
    """Отримати агреговані ризики компанії з відкритих джерел.

    Включає перевірку податкового боргу, обтяжень, виконавчих проваджень,
    а також аналітику тендерних ризиків (Collusion Detection).
    """
    logger.info(f"⚠️ Запит ризиків для ЄДРПОУ: {edrpou}")

    risks = _mock_risks.get(edrpou)

    if not risks:
        return {
            "edrpou": edrpou,
            "risk_score": 0,
            "risk_level": "UNKNOWN",
            "indicators": [],
            "last_updated": datetime.now(UTC).isoformat(),
            "message": "Недостатньо даних для розрахунку ризиків",
        }

    return risks


@router.get("/{edrpou}/tenders")
async def get_company_tender_links(
    edrpou: str = Path(..., description="Код ЄДРПОУ компанії (8 цифр)"),
) -> dict[str, Any]:
    """Отримати зв'язки компанії з публічними закупівлями.

    Повертає агреговану статистику участі в тендерах Prozorro
    (як замовник або учасник/переможець).
    """
    logger.info(f"📋 Запит тендерних зв'язків для ЄДРПОУ: {edrpou}")

    # Mock statistics
    if edrpou == "04362489":
        return {
            "edrpou": edrpou,
            "role": "procuring_entity",
            "total_tenders": 45,
            "active_tenders": 3,
            "total_value_uah": 125_400_000.0,
            "top_suppliers": [
                {"name": "ТОВ БудСервіс", "edrpou": "12345678", "contracts": 12},
                {"name": "ТОВ ЕнергоПостач", "edrpou": "87654321", "contracts": 5},
            ],
            "last_updated": datetime.now(UTC).isoformat(),
        }

    return {
        "edrpou": edrpou,
        "role": "unknown",
        "total_tenders": 0,
        "active_tenders": 0,
        "total_value_uah": 0.0,
        "top_suppliers": [],
        "last_updated": datetime.now(UTC).isoformat(),
    }
