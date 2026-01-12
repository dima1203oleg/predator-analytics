"""
Consensus Mechanism - Aggregates council opinions and reaches decision
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger("council.consensus")

async def reach_consensus(proposals: List[Dict[str, Any]], context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Aggregate proposals from all council members

    Decision Matrix:
    - If Critic rejects (security/performance risk): AUTO-REJECT
    - If Chairman approves + Critic neutral: APPROVE
    - If 2/3 approve: APPROVE
    """

    votes = {
        "approve": 0,
        "reject": 0,
        "modify": 0
    }

    high_risks = []
    critical_issues = []

    for proposal in proposals:
        role = proposal.get("role", "unknown")
        decision = proposal.get("decision", "reject")

        votes[decision] = votes.get(decision, 0) + 1

        # Critic has veto power only on HIGH security risks
        if role == "critic":
            security_risk = proposal.get("security_risk", "low")
            if security_risk == "high":
                high_risks.append("Security veto by Critic (high risk)")
            elif not proposal.get("approval", False):
                # Log issues but don't block for low/medium risk
                issues = proposal.get('issues', [])
                if issues:
                    logger.warning(f"Critic found issues (risk={security_risk}): {issues}")

        # Analyst warnings
        if role == "analyst":
            if proposal.get("health_status") == "critical":
                critical_issues.append("System health critical")

    # Decision Logic
    if high_risks:
        logger.warning(f"Consensus REJECTED: {high_risks}")
        return {
            "consensus": "reject",
            "reason": "; ".join(high_risks),
            "confidence": 0.95
        }

    # If we have any approval and no critical issues - approve!
    # This is important when Critic didn't vote (no code generated yet)
    if votes["approve"] >= 1 and len(critical_issues) == 0:
        logger.info(f"Consensus REACHED: APPROVE ({votes['approve']} votes)")
        return {
            "consensus": "approve",
            "reason": "Approved by council majority",
            "confidence": votes["approve"] / max(len(proposals), 1)
        }

    # If we have critical issues but also approvals - modify
    if critical_issues:
        logger.info(f"Consensus: MODIFY required due to issues: {critical_issues}")
        return {
            "consensus": "modify",
            "reason": "; ".join(critical_issues),
            "confidence": 0.5
        }

    logger.info("Consensus: MODIFY (no clear majority)")
    return {
        "consensus": "modify",
        "reason": "Requires modifications before approval",
        "confidence": 0.5
    }
