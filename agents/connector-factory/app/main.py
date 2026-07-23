from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.graph import create_factory_graph
import uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Autonomous Connector Factory",
    description="PREDATOR AI GitOps Software Factory Agent",
    version="v57.0"
)

# In-memory store for run states (should use Redis/Postgres in production)
RUN_STORE = {}

class StartRunRequest(BaseModel):
    url: str
    auth_required: bool = False

def execute_factory_pipeline(run_id: str, request: StartRunRequest):
    logger.info(f"Starting factory run {run_id} for {request.url}")
    graph = create_factory_graph()
    
    initial_state = {
        "source": {
            "url": request.url,
            "source_type": "unknown",
            "auth_required": request.auth_required,
            "metadata": {}
        },
        "status": "init"
    }
    
    # Run the graph
    # LangGraph returns a generator or we can just invoke it
    try:
        final_state = graph.invoke(initial_state)
        RUN_STORE[run_id] = final_state
        logger.info(f"Run {run_id} completed with status: {final_state.get('status')}")
    except Exception as e:
        logger.error(f"Run {run_id} failed: {e}")
        RUN_STORE[run_id] = {"status": "failed", "error_message": str(e)}

@app.post("/api/v1/factory/run")
async def start_factory_run(request: StartRunRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())
    RUN_STORE[run_id] = {"status": "starting", "source": {"url": request.url}}
    
    background_tasks.add_task(execute_factory_pipeline, run_id, request)
    
    return {"run_id": run_id, "message": "Factory pipeline started in background"}

@app.get("/api/v1/factory/run/{run_id}")
async def get_run_status(run_id: str):
    if run_id not in RUN_STORE:
        raise HTTPException(status_code=404, detail="Run not found")
    return RUN_STORE[run_id]

@app.get("/health/live")
async def liveness():
    return {"status": "ok"}

@app.get("/health/ready")
async def readiness():
    return {"status": "ok"}

@app.get("/health/startup")
async def startup():
    return {"status": "ok"}
