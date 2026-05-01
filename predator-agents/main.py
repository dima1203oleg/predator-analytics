"""
Predator Agents OS — Entry Point
Цей файл ініціалізує API-сервер для керування автономними агентами.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

# Завантаження оточення
load_dotenv()

app = FastAPI(
    title="Predator Agents OS API",
    description="API для керування автономними агентами PREDATOR Analytics",
    version="1.0.0"
)

class AgentRequest(BaseModel):
    task: str
    context: Optional[Dict[str, Any]] = None
    priority: str = "normal"

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "Predator Agents OS",
        "version": "1.0.0",
        "engine": "LangGraph"
    }

from core.orchestrator import run_orchestrator

@app.post("/api/v1/execute")
async def execute_task(request: AgentRequest):
    """
    Ендпоїнт для запуску завдання через Orchestrator.
    """
    try:
        result = await run_orchestrator(request.task)
        return {
            "task_id": "real-time-id",
            "response": result["messages"][-1].content,
            "status": "completed"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("AGENTS_PORT", 8010))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
