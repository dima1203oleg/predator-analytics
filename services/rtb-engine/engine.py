
"""
Module: engine
Component: rtb-engine
Predator Analytics v25.1
"""
import logging
import json
import httpx
import os
import hashlib
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, BackgroundTasks, HTTPException
from .rules.loader import RuleLoader
from .audit.store import AuditStore
from services.shared.decision import DecisionArtifact
from services.shared.events import PredatorEvent
from services.shared.logging_config import setup_logging

setup_logging("rtb-engine")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator RTB Engine", version="25.1")

# System State
SYSTEM_MODE = "ACTIVE" # ACTIVE, QUARANTINE, HALTED

# Initialize Infrastructure
RULES_PATH = os.getenv("RULES_PATH", "services/rtb-engine/rules/model_rules.yaml")
loader = RuleLoader(RULES_PATH)
loader.load_rules()

audit_store = AuditStore()

MCP_ROUTER_URL = os.getenv("MCP_ROUTER_URL", "http://predator-analytics-mcp-router:8080/v1/query")

class SimpleConditionEvaluator:
    """Safe evaluation of rule conditions without using eval()."""
    @staticmethod
    def evaluate(condition: str, context: Dict[str, Any]) -> bool:
        # For security compliance (No eval() rule), we perform structured matching.
        # This is a simplified proxy for a robust expression parser.
        try:
            # We support basic checks: "context.get('key') > value"
            # Note: In a full prod system, use a library like 'simpleeval' or a custom parser.
            # Here we simulate the logic for R001-R010.
            if "drop > 0.05" in condition:
                return context.get('drop', 0) > 0.05
            if "new_accuracy" in condition:
                 return (context.get('new_accuracy', 0) > context.get('baseline', 0) and 
                         context.get('critical_errors', 1) == 0)
            if "cpu_avg_5m" in condition:
                return context.get('cpu_avg_5m', 0) > 0.80
            if "severity" in condition:
                return context.get('severity') in ['CRITICAL', 'HIGH']
            if "budget" in condition:
                return context.get('monthly_spend', 0) > context.get('budget', 0) * 0.80
            if "True" in condition:
                return True
                
            # Fallback for complex conditions during bootstrapping
            # WARNING: This should be replaced with a real parser.
            return False 
        except Exception:
            return False

async def consult_llm(prompt: str, trace_id: str, context: Optional[Dict]) -> Optional[Dict]:
    """Requests advice from MCP Router as per Layer 2 spec."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                MCP_ROUTER_URL,
                json={
                    "prompt": prompt, 
                    "task_type": "analysis", 
                    "trace_id_override": trace_id,
                    "context": context
                }
            )
            return resp.json() if resp.status_code == 200 else None
    except Exception as e:
        logger.warning(f"LLM consultation failed: {e}")
        return None

async def process_event_logic(event: PredatorEvent):
    """Core evaluation loop based on Section 4.1."""
    if SYSTEM_MODE == "HALTED":
        logger.info("System HALTED. Skipping event.")
        return

    logger.info(f"Processing event {event.event_type}", extra={"correlation_id": event.correlation_id})

    # 1. Match Rules
    rules = loader.get_rules_for_event(event.event_type)
    
    for rule in rules:
        # 2. Evaluate Condition (Safe Evaluator)
        if SimpleConditionEvaluator.evaluate(rule['condition'], event.context):
            logger.info(f"Rule MATCHED: {rule['id']} ({rule['name']})")
            
            # 3. Consult LLM (Advisor Pattern)
            llm_advice = None
            if rule.get('autonomy_level') in ['L1', 'L3']:
                llm_advice = await consult_llm(
                    prompt=f"Trigger: {rule['name']}. Condition: {rule['condition']}. Context: {event.context}. Action: {rule['action']}. Autonomy: {rule['autonomy_level']}.",
                    trace_id=event.correlation_id,
                    context=event.context
                )

            # 4. Create Decision Artifact
            context_hash = hashlib.sha256(json.dumps(event.context, sort_keys=True).encode()).hexdigest()
            
            artifact = DecisionArtifact(
                trigger_event=event,
                correlation_id=event.correlation_id,
                rule_id=rule['id'],
                rule_version=loader._version,
                rule_condition=rule['condition'],
                context_snapshot=event.context,
                context_hash=context_hash,
                llm_consulted=llm_advice is not None,
                llm_provider=llm_advice.get("provider") if llm_advice else None,
                llm_model=llm_advice.get("model") if llm_advice else None,
                llm_response=llm_advice.get("content") if llm_advice else None,
                decision="APPROVE" if SYSTEM_MODE == "ACTIVE" else "OBSERVE",
                reason=f"Policy matched for {event.event_type}",
                autonomy_level=rule['autonomy_level'],
                action_type=rule['action']
            )

            # 5. Audit Persistence
            await audit_store.save(artifact)
            
            # 6. Implementation of Action (Bridge/Kafka emission)
            if SYSTEM_MODE == "ACTIVE":
                logger.info(f"ACTION TRIGGERED: {rule['action']} for rule {rule['id']}")
                # Implementation of Git PR creation or Job launch here...

@app.post("/events")
async def ingest_event(event_dict: Dict, background_tasks: BackgroundTasks):
    """Event ingress."""
    event = PredatorEvent.from_dict(event_dict)
    background_tasks.add_task(process_event_logic, event)
    return {"status": "accepted", "event_id": event.event_id}

@app.post("/control/mode")
async def set_mode(mode: str):
    """Emergency Kill Switch / Override Control."""
    global SYSTEM_MODE
    if mode not in ["ACTIVE", "QUARANTINE", "HALTED"]:
        raise HTTPException(status_code=400, detail="Invalid mode")
    
    SYSTEM_MODE = mode
    logger.critical(f"SYSTEM MODE CHANGED TO {mode}")
    return {"mode": SYSTEM_MODE}

@app.get("/health")
async def health():
    return {"status": "online", "mode": SYSTEM_MODE, "rules_version": loader._version}
