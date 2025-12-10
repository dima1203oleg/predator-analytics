from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from enum import Enum
import uuid
from typing import Any, Dict

app = FastAPI(title="Predator Policy Engine (stub)", version="0.1")

class Decision(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    REVIEW = "review"

class Signal(BaseModel):
    name: str
    value: Any
    metadata: Dict[str, Any] = {}

class Context(BaseModel):
    tenant_id: str
    resource: str
    extra: Dict[str, Any] = {}

class PolicyRequest(BaseModel):
    signal: Signal
    context: Context

class PolicyResponse(BaseModel):
    id: str
    decision: Decision
    plan: Dict[str, Any]

@app.post("/decide", response_model=PolicyResponse)
async def decide(req: PolicyRequest):
    # very simple policy stub for demo
    signal = req.signal.name.lower()
    val = req.signal.value
    tenant = req.context.tenant_id

    if signal == "kubecost_spike" and val.get("percentage", 0) > 80:
        return PolicyResponse(id=str(uuid.uuid4()), decision=Decision.REVIEW, plan={"action": "scale_down", "reason": "cost spike"})
    if signal == "ndcg_drop" and val.get("delta", 0) < -3:
        return PolicyResponse(id=str(uuid.uuid4()), decision=Decision.ALLOW, plan={"action": "start_diagnose_and_augment", "reason": "NDCG drop"})
    # default: allow simple non-critical signals
    return PolicyResponse(id=str(uuid.uuid4()), decision=Decision.ALLOW, plan={"action": "noop"})
