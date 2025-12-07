from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from app.services.auth_service import require_admin
from app.services.federation_service import get_federation_service

router = APIRouter(tags=["federation"])

class EdgeNodeRegistration(BaseModel):
    node_id: str
    hostname: str
    os: str
    capabilities: List[str]
    resources: Dict[str, float]

class TaskRequest(BaseModel):
    target_node_id: Optional[str] = None
    type: str # "scan_csv"
    payload: Dict

class TaskResult(BaseModel):
    task_id: str
    node_id: str
    result: Dict[str, Any]
    status: str

@router.post("/federation/register", dependencies=[Depends(require_admin)])
async def register_node(node: EdgeNodeRegistration):
    service = get_federation_service()
    return service.register_node(node.dict())

@router.post("/federation/heartbeat/{node_id}")
async def heartbeat(node_id: str, load: float = 0.0):
    service = get_federation_service()
    # Heartbeat logic implicitly handles status updates
    tasks = service.heartbeat(node_id, load)
    if tasks is None:
        raise HTTPException(status_code=404, detail="Node needs registration")
    
    return {"status": "ok", "tasks": tasks}

@router.get("/federation/nodes", dependencies=[Depends(require_admin)])
async def list_nodes():
    service = get_federation_service()
    return service.get_active_nodes()

@router.post("/federation/dispatch", dependencies=[Depends(require_admin)])
async def dispatch_task(task: TaskRequest):
    service = get_federation_service()
    try:
        task_id = service.dispatch_task(task.type, task.payload, task.target_node_id)
        return {"status": "queued", "task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/federation/submit_result")
async def submit_result(result: TaskResult):
    service = get_federation_service()
    service.submit_result(result.task_id, result.node_id, result.result, result.status)
    return {"status": "accepted"}
