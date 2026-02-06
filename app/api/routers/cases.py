from __future__ import annotations


"""Cases API Router - Кейси (центральна цінність PREDATOR)
Кейс = виявлена ситуація + аналіз + висновок AI.
"""
from datetime import datetime
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.libs.core.database import get_db_ctx


logger = logging.getLogger("router.cases")

router = APIRouter(prefix="/cases", tags=["Кейси"])


# ============================================================================
# Pydantic Models
# ============================================================================

class Evidence(BaseModel):
    id: str
    type: str  # REGISTRY, TRANSACTION, TENDER, COURT, OSINT
    source: str
    summary: str
    riskLevel: int
    timestamp: str


class CaseCreate(BaseModel):
    title: str
    situation: str
    conclusion: str | None = None
    status: str = "УВАГА"  # КРИТИЧНО, УВАГА, БЕЗПЕЧНО, АРХІВ
    riskScore: int = 50
    sector: str = "BIZ"  # GOV, BIZ, MED, SCI
    entityId: str | None = None
    aiInsight: str | None = None


class CaseUpdate(BaseModel):
    title: str | None = None
    situation: str | None = None
    conclusion: str | None = None
    status: str | None = None
    riskScore: int | None = None
    aiInsight: str | None = None


class CaseResponse(BaseModel):
    id: str
    title: str
    situation: str
    conclusion: str
    status: str
    riskScore: int
    sector: str
    createdAt: str
    updatedAt: str
    entityId: str | None = None
    evidence: list[Evidence] = []
    aiInsight: str | None = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_cases(
    status: str | None = Query(None, description="Фільтр за статусом"),
    sector: str | None = Query(None, description="Фільтр за сектором"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Отримати список кейсів.

    Кейси сортуються за:
    1. Статус (критичні першими)
    2. Рівень ризику (високий першим)
    3. Дата створення (новіші перші)
    """
    try:
        async with get_db_ctx() as db:
            # Перевіряємо чи є таблиця cases
            result = await db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'gold' AND table_name = 'cases'
                )
            """))
            table_exists = result.scalar()

            if not table_exists:
                # Повертаємо демо-кейси якщо таблиці ще немає
                return get_demo_cases()

            # Якщо таблиця є - запитуємо реальні дані
            query = """
                SELECT * FROM gold.cases
                WHERE 1=1
            """
            params = {}

            if status:
                query += " AND status = :status"
                params["status"] = status

            if sector:
                query += " AND sector = :sector"
                params["sector"] = sector

            query += """
                ORDER BY
                    CASE status
                        WHEN 'КРИТИЧНО' THEN 0
                        WHEN 'УВАГА' THEN 1
                        WHEN 'БЕЗПЕЧНО' THEN 2
                        WHEN 'АРХІВ' THEN 3
                    END,
                    risk_score DESC,
                    created_at DESC
                LIMIT :limit OFFSET :offset
            """
            params["limit"] = limit
            params["offset"] = offset

            result = await db.execute(query, params)
            rows = result.fetchall()

            return [row_to_case(row) for row in rows]

    except Exception as e:
        logger.warning(f"Cases query failed, returning demo data: {e}")
        return get_demo_cases()


@router.get("/stats")
async def get_case_stats():
    """Отримати статистику кейсів."""
    try:
        async with get_db_ctx() as db:
            result = await db.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'gold' AND table_name = 'cases'
                )
            """))
            if not result.scalar():
                # Demo stats
                return {
                    "total": 5,
                    "critical": 2,
                    "attention": 2,
                    "safe": 1,
                    "archived": 0,
                    "avgRiskScore": 62,
                    "isDemo": True
                }

            stats = await db.execute(text("""
                SELECT
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'КРИТИЧНО') as critical,
                    COUNT(*) FILTER (WHERE status = 'УВАГА') as attention,
                    COUNT(*) FILTER (WHERE status = 'БЕЗПЕЧНО') as safe,
                    COUNT(*) FILTER (WHERE status = 'АРХІВ') as archived,
                    COALESCE(AVG(risk_score), 0) as avg_risk
                FROM gold.cases
            """))
            row = stats.fetchone()

            return {
                "total": row.total or 0,
                "critical": row.critical or 0,
                "attention": row.attention or 0,
                "safe": row.safe or 0,
                "archived": row.archived or 0,
                "avgRiskScore": round(row.avg_risk or 0, 1),
                "isDemo": False
            }
    except Exception as e:
        logger.exception(f"Case stats failed: {e}")
        return {"total": 0, "critical": 0, "attention": 0, "safe": 0, "archived": 0, "avgRiskScore": 0, "error": str(e)}


@router.get("/{case_id}")
async def get_case(case_id: str):
    """Отримати деталі кейсу."""
    try:
        async with get_db_ctx() as db:
            result = await db.execute(
                text("SELECT * FROM gold.cases WHERE id = :id"),
                {"id": case_id}
            )
            row = result.fetchone()

            if not row:
                # Check demo cases
                demo = get_demo_cases()
                for c in demo:
                    if c["id"] == case_id:
                        return c
                raise HTTPException(status_code=404, detail="Кейс не знайдено")

            return row_to_case(row)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Get case failed: {e}")
        # Fallback to demo
        demo = get_demo_cases()
        for c in demo:
            if c["id"] == case_id:
                return c
        raise HTTPException(status_code=404, detail="Кейс не знайдено")


@router.post("/")
async def create_case(case: CaseCreate):
    """Створити новий кейс."""
    try:
        async with get_db_ctx() as db:
            result = await db.execute(text("""
                INSERT INTO gold.cases (title, situation, conclusion, status, risk_score, sector, entity_id, ai_insight)
                VALUES (:title, :situation, :conclusion, :status, :risk_score, :sector, :entity_id, :ai_insight)
                RETURNING id
            """), {
                "title": case.title,
                "situation": case.situation,
                "conclusion": case.conclusion or "",
                "status": case.status,
                "risk_score": case.riskScore,
                "sector": case.sector,
                "entity_id": case.entityId,
                "ai_insight": case.aiInsight
            })
            await db.commit()
            new_id = result.scalar()

            return {"id": str(new_id), "status": "created"}
    except Exception as e:
        logger.exception(f"Create case failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{case_id}")
async def update_case(case_id: str, update: CaseUpdate):
    """Оновити кейс."""
    try:
        async with get_db_ctx() as db:
            updates = []
            params = {"id": case_id}

            if update.title is not None:
                updates.append("title = :title")
                params["title"] = update.title
            if update.situation is not None:
                updates.append("situation = :situation")
                params["situation"] = update.situation
            if update.conclusion is not None:
                updates.append("conclusion = :conclusion")
                params["conclusion"] = update.conclusion
            if update.status is not None:
                updates.append("status = :status")
                params["status"] = update.status
            if update.riskScore is not None:
                updates.append("risk_score = :risk_score")
                params["risk_score"] = update.riskScore
            if update.aiInsight is not None:
                updates.append("ai_insight = :ai_insight")
                params["ai_insight"] = update.aiInsight

            if updates:
                updates.append("updated_at = NOW()")
                query = f"UPDATE gold.cases SET {', '.join(updates)} WHERE id = :id"
                await db.execute(query, params)
                await db.commit()

            return {"id": case_id, "status": "updated"}
    except Exception as e:
        logger.exception(f"Update case failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/archive")
async def archive_case(case_id: str):
    """Архівувати кейс."""
    try:
        async with get_db_ctx() as db:
            await db.execute(
                text("UPDATE gold.cases SET status = 'АРХІВ', updated_at = NOW() WHERE id = :id"),
                {"id": case_id}
            )
            await db.commit()
            return {"id": case_id, "status": "archived"}
    except Exception as e:
        logger.exception(f"Archive case failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{case_id}/escalate")
async def escalate_case(case_id: str):
    """Ескалювати кейс (підвищити пріоритет)."""
    try:
        async with get_db_ctx() as db:
            await db.execute(
                text("UPDATE gold.cases SET status = 'КРИТИЧНО', updated_at = NOW() WHERE id = :id"),
                {"id": case_id}
            )
            await db.commit()
            return {"id": case_id, "status": "escalated"}
    except Exception as e:
        logger.exception(f"Escalate case failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Helper Functions
# ============================================================================

def row_to_case(row) -> dict:
    """Конвертувати рядок БД в CaseResponse."""
    return {
        "id": str(row.id),
        "title": row.title,
        "situation": row.situation,
        "conclusion": row.conclusion or "",
        "status": row.status,
        "riskScore": row.risk_score,
        "sector": row.sector,
        "createdAt": row.created_at.isoformat() if row.created_at else "",
        "updatedAt": row.updated_at.isoformat() if row.updated_at else "",
        "entityId": row.entity_id,
        "evidence": [],  # TODO: Load from evidence table
        "aiInsight": row.ai_insight
    }


def get_demo_cases() -> list[dict]:
    """Демо-кейси для показу коли БД ще пуста."""
    now = datetime.now()
    return [
        {
            "id": "case-001",
            "title": 'ТОВ "Буд-Імперія"',
            "situation": "Виявлено офшорні транзакції на загальну суму $1.2M через Panama Bank. Операції мають ознаки фіктивності.",
            "conclusion": "Рекурсивні паттерни офшорної маршрутизації вказують на схему привласнення коштів державного тендеру.",
            "status": "КРИТИЧНО",
            "riskScore": 87,
            "sector": "BIZ",
            "createdAt": (now.isoformat()),
            "updatedAt": (now.isoformat()),
            "evidence": [],
            "aiInsight": "Рекомендую терміново перевірити пов'язані контракти #4821 та #4823."
        },
        {
            "id": "case-002",
            "title": "Департамент ЖКГ м. Київ",
            "situation": "Завищення цін на тендері з ремонту доріг на 34% відносно ринкових.",
            "conclusion": "Потенційний конфлікт інтересів — директор переможця є родичем заступника голови департаменту.",
            "status": "УВАГА",
            "riskScore": 62,
            "sector": "GOV",
            "createdAt": (now.isoformat()),
            "updatedAt": (now.isoformat()),
            "evidence": []
        },
        {
            "id": "case-003",
            "title": "ФОП Ковальчук О.О.",
            "situation": "Планова перевірка фінансової діяльності. Відхилень не виявлено.",
            "conclusion": "Стандартна операційна діяльність без ознак порушень.",
            "status": "БЕЗПЕЧНО",
            "riskScore": 12,
            "sector": "BIZ",
            "createdAt": (now.isoformat()),
            "updatedAt": (now.isoformat()),
            "evidence": []
        },
        {
            "id": "case-004",
            "title": 'КНП "Міська Лікарня №5"',
            "situation": "Аномалії у закупівлі медикаментів: ціни на 45% вищі за середньоринкові.",
            "conclusion": 'Можлива участь "прокладки" у ланцюгу постачання.',
            "status": "УВАГА",
            "riskScore": 58,
            "sector": "MED",
            "createdAt": (now.isoformat()),
            "updatedAt": (now.isoformat()),
            "evidence": []
        },
        {
            "id": "case-005",
            "title": "НДІ Екології Полісся",
            "situation": "Виявлено невідповідність звітних даних моніторингу якості води.",
            "conclusion": "Маніпуляція екологічними показниками для приховування забруднення.",
            "status": "КРИТИЧНО",
            "riskScore": 91,
            "sector": "SCI",
            "createdAt": (now.isoformat()),
            "updatedAt": (now.isoformat()),
            "evidence": [],
            "aiInsight": "Критично: виявлено зв'язок з промисловим комплексом \"ХімПром\"."
        }
    ]
