"""Open Data Router — API для управління збором відкритих даних України.

Ендпоінти:
- GET /open-data/catalog — каталог зібраних наборів
- GET /open-data/stats — статистика інгестії
- POST /open-data/harvest — тригер ручного запуску
- GET /open-data/prozorro/search — пошук тендерів за ЄДРПОУ
"""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Query

from predator_common.logging import get_logger

logger = get_logger("core_api.routers.open_data")

router = APIRouter(prefix="/open-data", tags=["open-data"])

# Стан інгестії (у реальному проді — Redis/PostgreSQL)
_harvester_state: dict[str, Any] = {
    "ckan": {
        "status": "idle",
        "last_run": None,
        "datasets_indexed": 0,
        "organizations": [
            "tax-gov-ua", "mtu-gov-ua", "customs-gov-ua",
            "minfin-gov-ua", "nssmc-gov-ua", "bank-gov-ua",
        ],
    },
    "prozorro": {
        "status": "idle",
        "last_run": None,
        "tenders_synced": 0,
        "contracts_synced": 0,
        "last_offset": "",
    },
    "edr": {
        "status": "idle",
        "last_run": None,
        "companies_fetched": 0,
        "graphs_built": 0,
    },
}

# Mock каталог зібраних наборів
_mock_catalog: list[dict[str, Any]] = [
    {
        "id": "dps-tax-debt-2024",
        "title": "Інформація про податковий борг платників",
        "source": "data.gov.ua",
        "organization": "Державна податкова служба",
        "format": "CSV",
        "records": 45_200,
        "size_mb": 12.4,
        "last_updated": "2026-07-15T10:00:00Z",
        "tags": ["податковий борг", "ДПС", "фінанси"],
    },
    {
        "id": "dps-vat-refund-2024",
        "title": "Відшкодування податку на додану вартість",
        "source": "data.gov.ua",
        "organization": "Державна податкова служба",
        "format": "CSV",
        "records": 8_750,
        "size_mb": 3.2,
        "last_updated": "2026-07-14T08:30:00Z",
        "tags": ["ПДВ", "відшкодування", "експорт"],
    },
    {
        "id": "mtu-port-statistics-2024",
        "title": "Реєстр судозаходів та портова статистика",
        "source": "data.gov.ua",
        "organization": "Міністерство інфраструктури",
        "format": "JSON",
        "records": 156_800,
        "size_mb": 45.7,
        "last_updated": "2026-07-16T14:00:00Z",
        "tags": ["порти", "морський трафік", "логістика"],
    },
    {
        "id": "prozorro-tenders-active",
        "title": "Активні тендери Prozorro",
        "source": "prozorro.gov.ua",
        "organization": "ProZorro",
        "format": "JSON (OCDS)",
        "records": 2_340_000,
        "size_mb": 890.0,
        "last_updated": "2026-07-17T06:00:00Z",
        "tags": ["публічні закупівлі", "тендери", "OCDS"],
    },
    {
        "id": "edr-companies-graph",
        "title": "Графи власності компаній (ЄДР)",
        "source": "Агрегатори (Clarity/Opendatabot)",
        "organization": "ЄДР",
        "format": "Neo4j Graph",
        "records": 12_450,
        "size_mb": 0,
        "last_updated": "2026-07-17T05:00:00Z",
        "tags": ["ЄДРПОУ", "графи власності", "бенефіціари"],
    },
]


@router.get("/catalog")
async def get_data_catalog(
    source: str = Query(default="", description="Фільтр за джерелом (data.gov.ua, prozorro.gov.ua)"),
    tag: str = Query(default="", description="Фільтр за тегом"),
) -> dict[str, Any]:
    """Повертає каталог зібраних наборів відкритих даних.

    Кожен елемент каталогу містить метадані: джерело, формат,
    кількість записів, дату останнього оновлення та теги.
    """
    catalog = _mock_catalog

    if source:
        catalog = [d for d in catalog if source.lower() in d["source"].lower()]
    if tag:
        catalog = [
            d for d in catalog
            if any(tag.lower() in t.lower() for t in d["tags"])
        ]

    return {
        "total": len(catalog),
        "datasets": catalog,
        "sources": ["data.gov.ua", "prozorro.gov.ua", "ЄДР"],
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.get("/stats")
async def get_ingestion_stats() -> dict[str, Any]:
    """Повертає статистику роботи всіх harvesters."""
    total_records = sum(d["records"] for d in _mock_catalog)
    total_size = sum(d["size_mb"] for d in _mock_catalog)

    return {
        "harvesters": _harvester_state,
        "totals": {
            "datasets_in_catalog": len(_mock_catalog),
            "total_records": total_records,
            "total_size_mb": round(total_size, 1),
            "sources_connected": 3,
            "organizations_monitored": 6,
        },
        "data_freshness": {
            "ckan_last_sync": _harvester_state["ckan"]["last_run"],
            "prozorro_last_sync": _harvester_state["prozorro"]["last_run"],
            "edr_last_sync": _harvester_state["edr"]["last_run"],
        },
        "generated_at": datetime.now(UTC).isoformat(),
    }


@router.post("/harvest")
async def trigger_harvest(
    source: str = Query(
        default="all",
        description="Джерело: ckan | prozorro | edr | all",
    ),
) -> dict[str, Any]:
    """Запускає ручний збір даних з обраного джерела.

    У виробничому середовищі відправляє задачу в Kafka
    для обробки ingestion-worker'ом.
    """
    logger.info(f"🚀 Тригер ручного збору: {source}")

    targets = [source] if source != "all" else ["ckan", "prozorro", "edr"]
    results: dict[str, str] = {}

    for target in targets:
        if target in _harvester_state:
            _harvester_state[target]["status"] = "running"
            _harvester_state[target]["last_run"] = datetime.now(UTC).isoformat()
            results[target] = "triggered"
            # TODO: Відправити повідомлення в Kafka topic для ingestion-worker
        else:
            results[target] = "unknown_source"

    return {
        "action": "harvest_triggered",
        "targets": results,
        "message": f"Збір даних запущено для: {', '.join(targets)}",
        "triggered_at": datetime.now(UTC).isoformat(),
    }


@router.get("/prozorro/search")
async def search_prozorro_tenders(
    edrpou: str = Query(description="Код ЄДРПОУ замовника (8 цифр)"),
    status: str = Query(default="", description="Статус тендеру"),
) -> dict[str, Any]:
    """Пошук тендерів Prozorro за кодом ЄДРПОУ.

    Повертає список тендерів, де зазначена компанія є замовником.
    """
    logger.info(f"🔍 Пошук тендерів Prozorro для ЄДРПОУ: {edrpou}")

    # Mock результати на основі реальних даних із звіту
    mock_tenders: list[dict[str, Any]] = []

    if edrpou == "04362489":
        mock_tenders = [
            {
                "tender_id": "UA-2026-07-01-001234-a",
                "title": "Закупівля генераторів для потреб громади",
                "status": "active.qualification",
                "value": {"amount": 1_250_000.00, "currency": "UAH"},
                "procuring_entity": {
                    "name": "Борщагівська сільська рада",
                    "edrpou": "04362489",
                },
                "contact": {
                    "name": "Наталія Ліщинецька",
                    "phone": "+380978077679",
                    "email": "n_lischuna@ukr.net",
                },
                "date_modified": "2026-07-15T14:30:00Z",
            },
            {
                "tender_id": "UA-2026-06-15-005678-b",
                "title": "Капітальний ремонт доріг у с. Софіївська Борщагівка",
                "status": "complete",
                "value": {"amount": 8_500_000.00, "currency": "UAH"},
                "procuring_entity": {
                    "name": "Борщагівська сільська рада",
                    "edrpou": "04362489",
                },
                "contact": {
                    "name": "Наталія Ліщинецька",
                    "phone": "+380978077679",
                    "email": "n_lischuna@ukr.net",
                },
                "date_modified": "2026-06-30T10:00:00Z",
            },
        ]

    if status:
        mock_tenders = [t for t in mock_tenders if status.lower() in t["status"].lower()]

    return {
        "edrpou": edrpou,
        "total": len(mock_tenders),
        "tenders": mock_tenders,
        "source": "prozorro.gov.ua",
        "generated_at": datetime.now(UTC).isoformat(),
    }
