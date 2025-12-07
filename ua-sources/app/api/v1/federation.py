from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import time
from app.services.auth_service import require_admin

router = APIRouter(tags=["federation"])

# In-memory registry (simulated database for now)
edge_nodes = {}
task_queue: Dict[str, List[Dict]] = {} # {node_id: [tasks]}

class EdgeNodeRegistration(BaseModel):
    node_id: str
    hostname: str
    os: str
    capabilities: List[str] # ["scanner", "inference", "voice"]
    resources: Dict[str, float] # {"cpu": 0.5, "ram": 16.0}

class TaskRequest(BaseModel):
    target_node_id: Optional[str] = None
    type: str
    payload: Dict

class TaskResult(BaseModel):
    task_id: str
    node_id: str
    result: Dict
    status: str

@router.post("/federation/register", dependencies=[Depends(require_admin)])
async def register_node(node: EdgeNodeRegistration):
    """
    Register a new Edge Node in the Federation.
    """
    edge_nodes[node.node_id] = {
        "info": node.dict(),
        "last_seen": time.time(),
        "status": "online",
        "tasks_completed": 0
    }
    print(f"🌍 [Federation] New Node Joined: {node.hostname} ({node.node_id})")
    return {"status": "registered", "master_node": "Predator-Core-Prime", "time": time.time()}

@router.post("/federation/dispatch", dependencies=[Depends(require_admin)])
async def dispatch_task(task: TaskRequest):
    """
    Queue a task for an Edge Node.
    """
    task_id = f"task-{int(time.time())}"
    task_data = {
        "task_id": task_id,
        "type": task.type,
        "payload": task.payload,
        "created_at": time.time()
    }
    
    # Strategy: Assign to specific node OR first available online node
    target = task.target_node_id
    if not target:
        for nid, data in edge_nodes.items():
            # Simple check, in real world check capabilities too
            if data.get("status") == "online": 
                target = nid
                break
    
    if target:
        if target not in task_queue:
            task_queue[target] = []
        task_queue[target].append(task_data)
        print(f"⚡ [Federation] Task {task_id} DISPATCHED to {target}")
        return {"status": "queued", "task_id": task_id, "node_id": target}
    
    raise HTTPException(status_code=503, detail="No active edge nodes available for task")

@router.post("/federation/heartbeat/{node_id}")
async def heartbeat(node_id: str, load: float = 0.0):
    """
    Periodic heartbeat from Edge Nodes. Returns pending tasks.
    """
    if node_id not in edge_nodes:
        # Auto-register logic could go here, but strict for now
        raise HTTPException(status_code=404, detail="Node not registered")
    
    edge_nodes[node_id]["last_seen"] = time.time()
    edge_nodes[node_id]["status"] = "online"
    edge_nodes[node_id]["load"] = load
    
    # Retrieve tasks for this node
    tasks = []
    if node_id in task_queue and task_queue[node_id]:
        tasks = task_queue[node_id]
        task_queue[node_id] = [] # Clear queue (assume delivery confirms later in real system)
        print(f"📦 [Federation] Offloading {len(tasks)} tasks to {node_id}")
    
    return {"status": "ok", "tasks": tasks}

@router.get("/federation/nodes", dependencies=[Depends(require_admin)])
async def list_nodes():
    """
    List all known Federation Nodes and their status.
    """
    now = time.time()
    results = []
    for nid, data in edge_nodes.items():
        is_alive = (now - data["last_seen"]) < 30
        data["status"] = "online" if is_alive else "offline"
        results.append(data)
            
    return results

@router.post("/federation/submit_result")
async def submit_result(result: TaskResult):
    """
    Receive task results from Edge Nodes.
    """
    if result.node_id in edge_nodes:
        edge_nodes[result.node_id]["tasks_completed"] += 1
    
    print(f"✅ [Federation] Task {result.task_id} completed by {result.node_id}")
    return {"status": "accepted"}
