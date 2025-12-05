"""ETL Endpoints"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/pipelines")
async def list_pipelines():
    """List ETL pipelines"""
    return ["prozorro", "edr", "nbu", "customs"]
