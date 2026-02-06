
"""
Module: engine
Component: rtb-engine
Predator Analytics v25.1
"""
import logging
import json
import httpx
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, BackgroundTasks
from .rules.loader import RuleLoader
from .audit.artifact import DecisionArtifact
from services.shared.events import PredatorEvent
from services.shared.logging_config import setup_logging

setup_logging("rtb-engine")
logger = logging.getLogger(__name__)

app = FastAPI(title="Predator RTB Engine", version="25.1")

# Initialize Rules
loader = RuleLoader("services/rtb-engine/rules/model_rules.yaml")
loader.load_rules()

MCP_ROUTER_URL = "http://predator-analytics-mcp-router:8080/v1/query"

async def consult_llm(prompt: str, trace_id: str) -> Optional[Dict]:
    """Requests advice from MCP Router."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                MCP_ROUTER_URL,
                json={"prompt": prompt, "task_type": "analysis", "trace_id": trace_id}
            )
            return resp.json() if resp.status_code == 200 else None
    except Exception as e:
        logger.warning(f"LLM consultation failed: {e}")
        return None

async def process_event_logic(event: PredatorEvent):
    """Core evaluation loop."""
    logger.info(f"Processing event {event.event_type}", extra={"correlation_id": event.correlation_id})

    # 1. Match Rules
    rules = loader.get_rules_for_event(event.event_type)
    if not rules:
        logger.info(f"No rules matched for {event.event_type}")
        return

    for rule in rules:
        # 2. Evaluate Condition (Simple eval for now, logic can be hardened)
        # Security Note: Conditions are internal YAML, but we should use a safer evaluator in production.
        try:
            # We use local context for eval
            context = event.context
            if eval(rule['condition'], {"context": context}):
                logger.info(f"Rule MATCHED: {rule['id']} ({rule['name']})")
                
                # 3. Consult LLM (Optional Advisor Pattern)
                llm_advice = await consult_llm(
                    prompt=f"Event {event.event_type} occurred. Condition {rule['condition']} matched. Advice on {rule['action']}?",
                    trace_id=event.correlation_id
                )

                # 4. Create Decision Artifact
                artifact = DecisionArtifact(
                    trigger_event_id=event.event_id,
                    event_type=event.event_type,
                    correlation_id=event.correlation_id,
                    rule_id=rule['id'],
                    rule_condition=rule['condition'],
                    decision="APPROVE",
                    reason=f"Condition matched: {rule['condition']}",
                    autonomy_level=rule['autonomy_level'],
                    llm_consulted=llm_advice is not None,
                    llm_trace_id=event.correlation_id,
                    llm_response=llm_advice.get("content") if llm_advice else None,
                    action_type=rule['action']
                )

                # 5. Persistence (Placeholder for DB write)
                logger.info("DECISION RECORDED", extra=artifact.to_dict())
                
                # 6. Trigger Action (Event emission or Job start)
                # ... action logic ...

        except Exception as e:
            logger.error(f"Error evaluating rule {rule['id']}: {e}")

@app.post("/events")
async def ingest_event(event_dict: Dict, background_tasks: BackgroundTasks):
    """Endpoint for Kafka/Bridge to push events."""
    event = PredatorEvent.from_dict(event_dict)
    background_tasks.add_task(process_event_logic, event)
    return {"status": "accepted", "event_id": event.event_id}

@app.get("/health")
async def health():
    return {"status": "active", "rules_version": loader._version}
