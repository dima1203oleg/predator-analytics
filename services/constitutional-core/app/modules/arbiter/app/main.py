from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import Dict, Any, Optional
from .engine import ConstitutionEngine
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("arbiter-api")

app = FastAPI(title="Predator Arbiter", version="26.0.0")

# Initialize Engine
# In production, path would be mounted volume
engine = ConstitutionEngine(constitution_path="../../../infrastructure/constitution")

class DecisionRequest(BaseModel):
    request_id: str
    type: str # e.g. 'schedule_job', 'ingest_data'
    context: Dict[str, Any]
    sender: str

class DecisionResponse(BaseModel):
    request_id: str
    allowed: bool
    reason: str
    signature: Optional[str] = None

@app.get("/health")
def health_check():
    return {"status": "healthy", "constitution_loaded": len(engine.laws) > 0}

@app.post("/decide", response_model=DecisionResponse)
def make_decision(request: DecisionRequest):
    logger.info(f"Processing decision for {request.request_id} from {request.sender}")

    decision = engine.evaluate(request.type, request.context)

    if not decision.allowed:
        logger.warning(f"Request {request.request_id} DENIED: {decision.reason}")
        return DecisionResponse(
            request_id=request.request_id,
            allowed=False,
            reason=f"{decision.reason}: {', '.join(decision.violates_axioms)}"
        )

    # In a real system, we would sign the approval here using a private key
    # signature = sign_decision(request)
    signature = "valid_arbiter_signature_mock"

    logger.info(f"Request {request.request_id} APPROVED")
    return DecisionResponse(
        request_id=request.request_id,
        allowed=True,
        reason=decision.reason,
        signature=signature
    )
