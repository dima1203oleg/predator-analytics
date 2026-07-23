import logging
import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.core.scheduler import RegistryScheduler
from app.etl.pipelines.prozorro_pipeline import ProzorroPipeline
from app.etl.pipelines.spending_pipeline import SpendingPipeline
from app.etl.pipelines.nazk_pipeline import NazkPipeline
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

router = APIRouter()
scheduler = RegistryScheduler()

async def run_pipeline_task(source: str):
    """Run pipeline task in background"""
    scheduler.status[source]["status"] = "running"
    try:
        if source == "prozorro":
            await ProzorroPipeline().run_incremental_sync(max_items=100)
        elif source == "spending":
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            await SpendingPipeline().run_sync_for_date(target_date=yesterday, max_items=100)
        elif source == "nazk":
            six_hours_ago = (datetime.now() - timedelta(hours=6)).isoformat()
            await NazkPipeline().run_incremental_sync(date_from=six_hours_ago, max_items=100)
        elif source == "sanctions":
            # Simulation
            await asyncio.sleep(2)
        else:
            raise ValueError(f"Unknown source: {source}")
        scheduler.status[source]["error"] = None
    except Exception as e:
        logger.error(f"Manual {source} task failed: {e}")
        scheduler.status[source]["error"] = str(e)
    finally:
        scheduler.status[source]["status"] = "idle"
        scheduler.status[source]["last_run"] = datetime.now().isoformat()


@router.post("/{source}/sync", summary="Trigger manual ETL sync")
async def trigger_sync(source: str, background_tasks: BackgroundTasks):
    """
    Trigger manual sync for a specific source.
    Allowed sources: prozorro, spending, nazk, sanctions.
    """
    if source not in scheduler.status:
        raise HTTPException(status_code=404, detail="Source not found")
        
    if scheduler.status[source]["status"] == "running":
        raise HTTPException(status_code=409, detail="Sync already running")
        
    background_tasks.add_task(run_pipeline_task, source)
    return {"status": "accepted", "source": source, "message": f"Sync started for {source}"}


@router.get("/status", summary="Get ETL Pipeline Statuses")
async def get_etl_status():
    """
    Returns the execution status of all ETL pipelines.
    """
    return {"pipelines": scheduler.status}
