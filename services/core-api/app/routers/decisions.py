from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db
from app.models.decision import Decision
from app.schemas.decision import DecisionCreate, DecisionRead
from app.schemas.user import UserRead

router = APIRouter(prefix="/decisions", tags=["decisions"])

@router.get("/", response_model=list[DecisionRead])
async def get_decisions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Отримати список усіх рішень (WORM-журнал)."""
    query = select(Decision).order_by(Decision.timestamp.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=DecisionRead, status_code=201)
async def create_decision(
    decision_in: DecisionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
):
    """Створити нове рішення. Після створення воно стає незмінним (WORM)."""
    new_decision = Decision(
        **decision_in.model_dump(),
        analyst_id=current_user.id,
        timestamp=datetime.now(UTC),
        immutable=True
    )
    db.add(new_decision)
    await db.commit()
    await db.refresh(new_decision)
    return new_decision

@router.get("/{decision_id}", response_model=DecisionRead)
async def get_decision(
    decision_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
):
    """Отримати деталі конкретного рішення."""
    query = select(Decision).where(Decision.id == decision_id)
    result = await db.execute(query)
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Рішення не знайдено")
    return decision

# HR-16: UPDATE/DELETE = ERROR
@router.put("/{decision_id}")
@router.patch("/{decision_id}")
async def update_decision():
    """ЗАБОРОНЕНО: Рішення в PREDATOR є незмінними (HR-16)."""
    raise HTTPException(
        status_code=403,
        detail="CRITICAL_ERROR: Редагування WORM-записів заборонено протоколом безпеки (HR-16)."
    )

@router.delete("/{decision_id}")
async def delete_decision():
    """ЗАБОРОНЕНО: Видалення аудит-логів заборонено (HR-16)."""
    raise HTTPException(
        status_code=403,
        detail="CRITICAL_ERROR: Видалення WORM-записів заборонено протоколом безпеки (HR-16)."
    )
