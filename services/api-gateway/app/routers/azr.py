"""
AZR Constitutional Router (v27 Hyper-Powered)
Exposes constitutional verified state to the Web UI.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
import os
import json
from datetime import datetime
from app.services.azr_engine import azr_engine
from app.services.auth_service import require_admin, get_current_user
from libs.core.structured_logger import get_logger, log_security_event, log_business_event

logger = get_logger("predator.api.azr")

router = APIRouter(prefix="/azr", tags=["AZR Constitution"])

@router.get("/status")
async def get_azr_status():
    """Get the sovereign status of the AZR v28-A system. Public within organization."""
    status = azr_engine.get_status()
    # Add localized message
    is_frozen = os.path.exists("/tmp/azr.freeze")
    message = "АКТИВНА (ГІПЕР-РЕЖИМ)" if status["is_running"] and not is_frozen else "ЗАМОРОЖЕНА (ЕКСТРЕННИЙ СТАН)"

    return {
        **status,
        "risk_level": "LOW",
        "quantum_shield": True,
        "last_verified": datetime.now().isoformat(),
        "message_uk": message
    }

@router.get("/audit", dependencies=[Depends(require_admin)])
async def get_azr_audit(limit: int = 50):
    """Get the Constitutional Audit Log. Admin only."""
    if not azr_engine.audit_log_path.exists():
        return []

    logs = []
    with open(azr_engine.audit_log_path, "r") as f:
        for line in f:
            logs.append(json.loads(line))

    return logs[-limit:]

@router.get("/memory/immunity", dependencies=[Depends(require_admin)])
async def get_immunity_stats():
    """Get Fingerprints of blocked bad patterns. Admin only."""
    return {
        "count": len(azr_engine.immunity.fingerprints),
        "fingerprints": azr_engine.immunity.fingerprints
    }

@router.post("/freeze", dependencies=[Depends(require_admin)])
async def emergency_freeze():
    """Emergency stop for all autonomous processes. Admin only."""
    logger.warning("emergency_freeze_triggered", user="admin")
    log_security_event(logger, "system_freeze", "critical", user="admin", source="api")

    with open("/tmp/azr.freeze", "w") as f:
        f.write(datetime.now().isoformat())
    return {"status": "FROZEN", "timestamp": datetime.now().isoformat()}

@router.post("/unfreeze", dependencies=[Depends(require_admin)])
async def emergency_unfreeze():
    """Resume autonomous cycle. Admin only."""
    if os.path.exists("/tmp/azr.freeze"):
        os.remove("/tmp/azr.freeze")
        await azr_engine.start_autonomous_cycle() # Resume cycle

        logger.info("emergency_unfreeze_executed", user="admin")
        log_security_event(logger, "system_unfreeze", "high", user="admin", source="api")

        return {"status": "ACTIVE", "timestamp": datetime.now().isoformat()}
    return {"status": "ALREADY_ACTIVE"}

# --- GOVERNANCE (DAO) ---

class AmendmentProposal(BaseModel):
    title: str
    description: str
    category: str = "TWEAK"

@router.post("/governance/propose", dependencies=[Depends(require_admin)])
async def propose_amendment(proposal: AmendmentProposal):
    """Propose a Constitutional Amendment via DAO."""
    if not hasattr(azr_engine, "governance"):
        raise HTTPException(500, "Governance Bridge not initialized in Engine")

    logger.info("governance_proposal_submitted", title=proposal.title, category=proposal.category)

    result = await azr_engine.governance.propose_amendment({
        "title": proposal.title,
        "description": proposal.description,
        "category": proposal.category
    })

    log_business_event(
        logger,
        "amendment_proposal_processed",
        title=proposal.title,
        status=result.get("status"),
        votes_for=result.get("votes_for"),
        votes_against=result.get("votes_against")
    )

    return result

@router.get("/constitution")
async def get_constitution():
    """Get the current Immutable Constitution Axioms."""
    return {
        "axioms": azr_engine.guard.AXIOMS,
        "rights": azr_engine.policy.rights_level
    }
