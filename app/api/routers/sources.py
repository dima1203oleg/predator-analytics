from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from app.libs.core.database import get_db_ctx
from app.libs.core.models.entities import DataSource as DataSourceEntity
from app.libs.core.models.entities import MLDataset, MLJob
from app.services.auth_service import get_current_user


router = APIRouter(prefix="/sources", tags=["Sources"])
logger = logging.getLogger("api.sources")


class DataSource(BaseModel):
    id: str
    name: str
    type: str  # OFFICIAL, INTERNAL, UPLOADED
    status: str  # ONLINE, SYNCING
    records_count: int
    size_mb: float
    last_update: str
    table_name: str
    ml_status: str | None = None


@router.get("/", response_model=list[DataSource])
async def get_data_sources(user: dict = Depends(get_current_user)):
    """Get all available data sources from the Canonical Registry (Gold Schema)."""
    try:
        async with get_db_ctx() as sess:
            stmt = select(DataSourceEntity).order_by(DataSourceEntity.created_at.desc())
            result = await sess.execute(stmt)
            entities = result.scalars().all()

            sources = []
            for e in entities:
                # Map Entity to API Model
                # calculate size or records if possible, or take from config

                config = e.config or {}
                table_name = config.get("table_name", "")

                # If status is indexed, implies it's ready
                # status mapping: parsing -> SYNCING, indexed -> ONLINE, error -> ERROR
                status_map = {"draft": "OFFLINE", "parsing": "SYNCING", "indexed": "ONLINE", "error": "ERROR"}

                # Resolve ML Status
                ml_status = "IDLE"
                if table_name:
                    stmt_ds = select(MLDataset).where(MLDataset.dvc_path == f"pg://{table_name}")
                    ds = (await sess.execute(stmt_ds)).scalars().first()
                    if ds:
                        stmt_job = select(MLJob).where(MLJob.dataset_id == ds.id).order_by(MLJob.created_at.desc())
                        job = (await sess.execute(stmt_job)).scalars().first()
                        if job:
                            ml_status = job.status.upper()

                sources.append({
                    "id": str(e.id),
                    "name": e.name,
                    "type": "UPLOADED" if e.connector == "upload" else "OFFICIAL",
                    "status": status_map.get(e.status, "OFFLINE"),
                    "records_count": config.get("last_count", 0),
                    "size_mb": 0.0,  # Placeholder
                    "last_update": e.updated_at.isoformat() if e.updated_at else "N/A",
                    "table_name": table_name,
                    "ml_status": ml_status,
                })

            return sources

    except Exception as e:
        logger.exception(f"Failed to fetch sources: {e}")
        raise HTTPException(status_code=500, detail=str(e))
