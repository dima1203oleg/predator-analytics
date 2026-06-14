"""Claw Code Agent proxy router.
Проксі для взаємодії з мікросервісом claw-code-agent, що відповідає за 
автономний рефакторинг та генерацію датасетів через DeepSeek-R1.
"""

import httpx
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

CLAW_CODE_URL = "http://claw-code-agent:8005"

class AutoRefactorRequest(BaseModel):
    task: str

@router.post("/refactor")
async def trigger_refactoring(req: AutoRefactorRequest):
    """Перенаправляє запит на рефакторинг до claw-code-agent."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{CLAW_CODE_URL}/trigger/refactor",
                json={"task": req.task}
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Помилка з'єднання з claw-code-agent: {e}")

@router.get("/status")
async def get_claw_code_status():
    """Отримує статус claw-code-agent."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{CLAW_CODE_URL}/health")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Помилка з'єднання з claw-code-agent: {e}")
