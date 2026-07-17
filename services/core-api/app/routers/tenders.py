"""Tenders Analytics Router — Агрегації тендерних даних з ClickHouse.

Модуль надає OLAP-аналітику по тендерній активності компаній.
Дані зберігаються в ClickHouse відповідно до System Memory Contract (HR-17).
"""
import logging
from datetime import date
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.config import get_settings

logger = logging.getLogger("predator.routers.tenders")

router = APIRouter(prefix="/analytics", tags=["тендерна аналітика"])


# ======================== RESPONSE MODELS ========================


class TenderAggregation(BaseModel):
    """Агрегація тендерної активності компанії."""

    ueid: str = Field(..., description="ЄДРПОУ компанії")
    total_tenders: int = Field(default=0, description="Загальна кількість тендерів")
    total_value: float = Field(default=0.0, description="Загальна сума тендерів (UAH)")
    won_tenders: int = Field(default=0, description="Кількість виграних тендерів")
    avg_tender_value: float = Field(default=0.0, description="Середня сума тендера")
    currency_breakdown: dict[str, float] = Field(
        default_factory=dict, description="Розбивка за валютами"
    )
    monthly_activity: list[dict[str, Any]] = Field(
        default_factory=list, description="Помісячна активність"
    )


class FraudRingResponse(BaseModel):
    """Виявлені фрод-кільця."""

    fraud_rings: list[dict[str, Any]] = Field(
        default_factory=list, description="Список виявлених циклічних зв'язків"
    )


class TenderAggregationResponse(BaseModel):
    """Відповідь з агрегацією тендерів."""

    data: TenderAggregation
    source: str = "clickhouse"
    cached: bool = False


# ======================== CLICKHOUSE CLIENT ========================


def _get_clickhouse_client():  # type: ignore[return]
    """Ліниво створює ClickHouse клієнт. Повертає None, якщо бібліотека недоступна."""
    try:
        import clickhouse_connect  # type: ignore[import-untyped]
    except ImportError:
        logger.warning("clickhouse-connect не встановлено. Тендерна аналітика недоступна.")
        return None

    settings = get_settings()
    return clickhouse_connect.get_client(
        host=settings.CLICKHOUSE_HOST,
        port=settings.CLICKHOUSE_PORT,
        username=settings.CLICKHOUSE_USER,
        password=settings.CLICKHOUSE_PASSWORD,
        database=settings.CLICKHOUSE_DATABASE,
    )


# ======================== ENDPOINTS ========================


@router.get(
    "/company/{ueid}/tenders",
    response_model=TenderAggregationResponse,
    summary="Агрегація тендерної активності компанії",
)
async def get_company_tenders(
    ueid: str,
    date_from: date | None = Query(None, description="Дата початку (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="Дата кінця (YYYY-MM-DD)"),
):
    """Повертає агрегацію тендерної активності компанії з ClickHouse (OLAP)."""

    client = _get_clickhouse_client()
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="ClickHouse недоступний. Перевірте налаштування або встановіть clickhouse-connect.",
        )

    # --- Базова агрегація ---
    params: dict[str, Any] = {"ueid": ueid}
    date_filter = ""
    if date_from:
        date_filter += " AND date_modified >= {date_from:Date}"
        params["date_from"] = date_from.isoformat()
    if date_to:
        date_filter += " AND date_modified <= {date_to:Date}"
        params["date_to"] = date_to.isoformat()

    summary_query = f"""
    SELECT
        count() AS total_tenders,
        sum(value_amount) AS total_value,
        countIf(status = 'active.awarded') AS won_tenders,
        avg(value_amount) AS avg_tender_value
    FROM prozorro_tenders
    WHERE procuring_entity_id = {{ueid:String}}
    {date_filter}
    """

    currency_query = f"""
    SELECT
        currency,
        sum(value_amount) AS total
    FROM prozorro_tenders
    WHERE procuring_entity_id = {{ueid:String}}
    {date_filter}
    GROUP BY currency
    ORDER BY total DESC
    """

    monthly_query = f"""
    SELECT
        toStartOfMonth(date_modified) AS month,
        count() AS tender_count,
        sum(value_amount) AS month_total
    FROM prozorro_tenders
    WHERE procuring_entity_id = {{ueid:String}}
    {date_filter}
    GROUP BY month
    ORDER BY month ASC
    """

    try:
        # Виконуємо запити (HR-07: конкретні колонки, жодних SELECT *)
        summary_result = client.query(summary_query, parameters=params)
        currency_result = client.query(currency_query, parameters=params)
        monthly_result = client.query(monthly_query, parameters=params)

        # Розбір результатів
        row = summary_result.first_row if summary_result.row_count > 0 else (0, 0.0, 0, 0.0)

        currency_breakdown = {
            str(r[0]): float(r[1])
            for r in currency_result.result_rows
        }

        monthly_activity = [
            {
                "month": str(r[0]),
                "tender_count": int(r[1]),
                "month_total": float(r[2]),
            }
            for r in monthly_result.result_rows
        ]

        aggregation = TenderAggregation(
            ueid=ueid,
            total_tenders=int(row[0]),
            total_value=float(row[1]),
            won_tenders=int(row[2]),
            avg_tender_value=float(row[3]),
            currency_breakdown=currency_breakdown,
            monthly_activity=monthly_activity,
        )

        return TenderAggregationResponse(data=aggregation)

    except Exception as e:
        logger.error(f"ClickHouse Query Error для {ueid}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Помилка агрегації тендерних даних: {e}",
        ) from e
    finally:
        client.close()


@router.get(
    "/tenders/top_spenders",
    summary="Топ замовників за обсягом витрат",
)
async def get_top_spenders(
    limit: int = Query(20, ge=1, le=100, description="Кількість результатів"),
    date_from: date | None = Query(None, description="Дата початку"),
    date_to: date | None = Query(None, description="Дата кінця"),
):
    """Повертає ранжований список замовників за обсягом витрат на тендери."""

    client = _get_clickhouse_client()
    if client is None:
        raise HTTPException(status_code=503, detail="ClickHouse недоступний")

    params: dict[str, Any] = {"limit": limit}
    date_filter = ""
    if date_from:
        date_filter += " WHERE date_modified >= {date_from:Date}"
        params["date_from"] = date_from.isoformat()
    if date_to:
        conjunction = " AND" if date_filter else " WHERE"
        date_filter += f"{conjunction} date_modified <= {{date_to:Date}}"
        params["date_to"] = date_to.isoformat()

    query = f"""
    SELECT
        procuring_entity_id,
        procuring_entity_name,
        count() AS tender_count,
        sum(value_amount) AS total_spent,
        avg(value_amount) AS avg_value
    FROM prozorro_tenders
    {date_filter}
    GROUP BY procuring_entity_id, procuring_entity_name
    ORDER BY total_spent DESC
    LIMIT {{limit:UInt32}}
    """

    try:
        result = client.query(query, parameters=params)
        spenders = [
            {
                "procuring_entity_id": str(r[0]),
                "procuring_entity_name": str(r[1]),
                "tender_count": int(r[2]),
                "total_spent": float(r[3]),
                "avg_value": float(r[4]),
            }
            for r in result.result_rows
        ]
        return {"top_spenders": spenders, "source": "clickhouse"}
    except Exception as e:
        logger.error(f"ClickHouse Top Spenders Error: {e}")
        raise HTTPException(status_code=500, detail=f"Помилка агрегації: {e}") from e
    finally:
        client.close()
