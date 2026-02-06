from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class SecurityStage(Enum):
    RND = "rnd"
    STAGING = "staging"
    PRODUCTION = "production"

class WinSURFDecision(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    RESTRICTED = "restricted"

class ArchitecturalDecisionRecord:
    def __init__(self, title: str, status: WinSURFDecision, context: str, decision: str, consequences: str):
        self.id = str(uuid.uuid4())[:8]
        self.date = datetime.utcnow().isoformat()
        self.title = title
        self.status = status.value
        self.context = context
        self.decision = decision
        self.consequences = consequences

    def to_dict(self):
        return self.__dict__

class WinSURFArchitect:
    """Автоматизована реалізація WinSURF Framework (v2).
    Generates ADRs and enforces Stability/Complexity matrices.
    """

    def __init__(self, stage: SecurityStage = SecurityStage.RND, ai_client=None):
        self.stage = stage
        self.ai_client = ai_client # Gemini/Mistral client for reasoning
        # "Rationalization" list
        self.forbidden_tech = ["pulsar", "cassandra", "jenkins", "terraform", "ansible"]
        self.approved_tech = ["rabbitmq", "postgresql", "argocd", "kubernetes", "helm", "docker", "crossplane"]

    async def evaluate_proposal(self, action: str, technology: str, description: str) -> dict:
        """AI-driven evaluation of a proposal."""
        # 1. Rationalization Check
        if technology and technology.lower() in self.forbidden_tech:
            return self._create_verdict(
                WinSURFDecision.REJECTED,
                f"Технологія '{technology}' заборонена політикою Rationalization. Використовуйте затверджений стек (RabbitMQ, Postgres, ArgoCD).",
                description
            )

        # 2. AI Impact Analysis (LLM Scoring)
        impact = await self._analyze_impact_with_ai(action, technology, description)

        # 3. Matrix Decision Logic
        verdict = self._apply_matrix(impact)

        # 4. Generate ADR
        adr = ArchitecturalDecisionRecord(
            title=f"WinSURF Eval: {action} ({technology})",
            status=verdict["decision"],
            context=description,
            decision=verdict["reason"],
            consequences=f"Complexity: {impact['complexity']}/10, Autonomy: {impact['autonomy']}/10"
        )

        # В реальності тут ми б зберегли ADR в Git репозиторій "docs/adr/"
        logger.info(f"Generated ADR-{adr.id}: {json.dumps(adr.to_dict())}")

        return {
            "decision": verdict["decision"],
            "reason": verdict["reason"],
            "adr": adr.to_dict(),
            "impact": impact
        }

    async def _analyze_impact_with_ai(self, action: str, tech: str, desc: str) -> dict:
        """Uses AI (or heuristic fallback) to score Stability vs Complexity."""
        # TODO: Implement actual LLM call here.
        # For now, using deterministic heuristics for speed/stability in this demo.

        complexity = 5
        autonomy = 5
        security_risk = "low"

        if "deploy" in action and self.stage == SecurityStage.PRODUCTION:
            complexity = 8
            security_risk = "medium"

        if "fix" in action:
            autonomy = 9

        if tech and tech.lower() not in self.approved_tech and tech != "standard":
             complexity = 9 # Unknown tech is complex

        return {
            "complexity": complexity,
            "autonomy": autonomy,
            "security_risk": security_risk
        }

    def _apply_matrix(self, impact: dict) -> dict:
        # Rule 1: Complexity must be justified by Autonomy
        if impact["complexity"] > 6 and impact["autonomy"] < 4:
            return {
                "decision": WinSURFDecision.REJECTED,
                "reason": "WinSURF Stability: Висока складність без значного приросту автономності. Спростіть рішення."
            }

        # Rule 2: Security Stages
        if self.stage == SecurityStage.PRODUCTION and impact["security_risk"] in ["high", "critical"]:
             return {
                "decision": WinSURFDecision.REJECTED,
                "reason": "WinSURF Security: Критичний ризик неприпустимий на стадії PRODUCTION."
             }

        return {
            "decision": WinSURFDecision.APPROVED,
            "reason": "Схвалено. Відповідає метрикам WinSURF."
        }

    def _create_verdict(self, decision: WinSURFDecision, reason: str, context: str) -> dict:
         return {
            "decision": decision,
            "reason": reason,
            "adr": ArchitecturalDecisionRecord("Rationalization Check", decision, context, reason, "Заблоковано на ранньому етапі").to_dict(),
            "impact": {}
        }

    def validate_code_action(self, code: str) -> bool:
        """Fast static analysis check."""
        if self.stage == SecurityStage.PRODUCTION:
            # Block hardcoded secrets
            if "API_KEY=" in code or "PASSWORD=" in code:
                return False
            # Block destructive commands
            if "rm -rf" in code or "DROP TABLE" in code:
                return False
        return True
