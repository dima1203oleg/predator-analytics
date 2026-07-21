from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, List

from app.services.acp_factory import acp_factory
from app.services.research_engine import research_engine
from app.core.security import get_tenant_id, PermissionChecker, Permission

router = APIRouter(prefix="/acp", tags=["Autonomous Connector Platform"])

class GenerateConnectorRequest(BaseModel):
    url: str
    description: str

@router.post("/generate", summary="Генерувати новий OSINT колектор")
async def generate_acp_connector(
    request: GenerateConnectorRequest,
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.CREATE_SCAN]))
):
    """
    Ініціює процес генерації нового колектора для переданого URL 
    за допомогою LLM та ізольованого тестування.
    """
    try:
        result = await acp_factory.generate_connector(request.url, request.description)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate connector: {e}")

@router.post("/deploy", summary="Задеплоїти згенерований колектор")
async def deploy_acp_connector(
    connector_name: str = Body(..., embed=True),
    code: str = Body(..., embed=True),
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.CREATE_SCAN]))
):
    """
    Зберігає код колектора в систему та виконує hot-reload.
    """
    try:
        result = await acp_factory.deploy_connector(connector_name, code)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deploy connector: {e}")

@router.get("/research/insights", summary="Отримати інсайти від Research Engine")
async def get_research_insights(
    tenant_id: str = Depends(get_tenant_id),
    _ = Depends(PermissionChecker([Permission.VIEW_SCAN]))
):
    """
    Повертає список нових інструментів та підходів, знайдених Research Engine 
    на GitHub та ArXiv.
    """
    try:
        insights = await research_engine.fetch_insights()
        return {"status": "success", "insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch insights: {e}")
