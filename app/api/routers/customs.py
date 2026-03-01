from __future__ import annotations

import asyncio
import logging
import os
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.customs_service import customs_service


logger = logging.getLogger("api.customs")
router = APIRouter(prefix="/customs", tags=["Customs Intelligence"])


@router.get("/registry")
async def get_registry(query: str = "", limit: int = 50):
    """Fetch the customs registry with tactical filtering."""
    try:
        data = await customs_service.get_registry_data(query, limit)
        return {"status": "success", "count": len(data), "data": data}
    except Exception as e:
        logger.exception(f"Failed to fetch registry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dossier/synthesize")
async def synthesize_dossier(request: dict[str, Any]):
    """Trigger the 'Kompromat' dossier synthesis engine."""
    company_name = request.get("company_name")
    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required")

    try:
        result = await customs_service.synthesize_dossier(company_name)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Synthesis failed"))
        return result
    except Exception as e:
        logger.exception(f"Dossier synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/modeling")
async def get_modeling(persona: str = "TITAN", mode: str = "presets"):
    """Fetch tactical modeling data for visualizations."""
    try:
        data = await customs_service.get_modeling_data(persona, mode)
        return {"status": "success", "data": data}
    except Exception as e:
        logger.exception(f"Modeling data fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def get_anomalies():
    """Fetch live customs anomalies."""
    try:
        data = await customs_service.get_anomalies()
        return {"status": "success", "data": data}
    except Exception as e:
        logger.exception(f"Anomalies fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- FAIL-SAFE LOCAL IMPORT ENDPOINT ---
@router.post("/import-local", response_model=dict[str, Any])
async def import_local_file(file_path: str = Query(..., description="Path relative to /app directory")):
    """Trigger import for a file that already exists in the container.
    Safe implementation with local imports.
    """
    try:
        # Dynamic imports to prevent boot loops
        from app.services.customs_service import customs_service
        from app.tasks.customs_parser import CustomsExcelParser
    except ImportError as e:
        return JSONResponse(status_code=500, content={"error": f"Import dependency missing: {e}"})

    # Expected path in container: /app/app/data_staging/FILENAME
    full_path = f"/app/app/{file_path}"

    if not os.path.exists(full_path):
        return JSONResponse(status_code=404, content={"error": f"File not found in container: {full_path}"})

    try:
        logger.info(f"🚀 Starting Magic Import for: {full_path}")

        # 1. Parse
        parser = CustomsExcelParser(full_path)
        stats = await asyncio.to_thread(parser.load_and_parse)

        if stats["success"] > 0:
            # 2. Ingest
            await customs_service.ingest_bulk_data(parser.valid_records)

            # 3. Trigger Async Analysis (Safe import)
            try:
                pass
                # Using a dummy ID or adapting the task later.
                # For now, let's skip the celery trigger to ensure stable HTTP return
                # We can trigger it manually via another endpoint if needed.
            except Exception:
                pass

            return {"success": True, "message": "Import completed successfully (Synchronous)", "stats": stats}
        return {"success": False, "message": "Parsing failed", "stats": stats}

    except Exception as e:
        logger.exception(f"Import process failed: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})
