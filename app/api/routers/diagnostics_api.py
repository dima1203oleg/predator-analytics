from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.diagnostics_service import DiagnosticsService


router = APIRouter(tags=["System Diagnostics"])

@router.post("/system/diagnostics/run")
async def run_diagnostics():
    """Triggers a full system diagnostic check.
    Returns the results immediately (synchronous for simplicity in V1,
    but can be backgrounded if slow).
    """
    try:
        service = DiagnosticsService()
        results = await service.run_full_diagnostics()
        report = service.generate_report()

        return {
            "status": "success",
            "results": results,
            "report_markdown": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/diagnostics/report")
async def get_report():
    """Get the last diagnostic report (cached).
    For now, just runs it again as we don't have persistence in V1.
    """
    return await run_diagnostics()
