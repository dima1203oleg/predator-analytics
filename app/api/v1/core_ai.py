from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.core_ai import (
    AgentMemory, get_agent_memory,
    PromptRegistry, get_prompt_registry
)

router = APIRouter(prefix="/core-ai", tags=["Core AI Infrastructure"])

class MemoryStoreRequest(BaseModel):
    session_id: str
    context: Dict[str, Any]

@router.post("/memory/store")
async def store_agent_memory(
    data: MemoryStoreRequest,
    memory: AgentMemory = Depends(get_agent_memory)
) -> Dict[str, Any]:
    """
    Stores session context into agent memory (COMP-206).
    """
    return memory.store_context(data.session_id, data.context)

@router.get("/memory/retrieve")
async def retrieve_agent_memory(
    session_id: str,
    memory: AgentMemory = Depends(get_agent_memory)
) -> List[Dict[str, Any]]:
    """
    Retrieves history for an agent session (COMP-206).
    """
    return memory.retrieve_memory(session_id)

@router.get("/prompts/{name}")
async def get_system_prompt(
    name: str,
    version: str = "latest",
    registry: PromptRegistry = Depends(get_prompt_registry)
) -> Dict[str, Any]:
    """
    Retrieves a versioned prompt template (COMP-207).
    """
    content = registry.get_prompt(name, version)
    if not content:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"name": name, "version": version, "content": content}
