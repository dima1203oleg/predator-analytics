import yaml
import os
from typing import Dict, List, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger("arbiter-engine")

@dataclass
class Decision:
    allowed: bool
    reason: str
    violates_axioms: List[str]

class ConstitutionEngine:
    def __init__(self, constitution_path: str = "/app/infrastructure/constitution"):
        self.constitution_path = constitution_path
        self.laws = self._load_laws()

    def _load_laws(self) -> Dict:
        laws = {}
        laws_path = os.path.join(self.constitution_path, "laws")
        if not os.path.exists(laws_path):
            logger.warning(f"Constitution path {laws_path} not found. Running in anarchy mode (not recommended).")
            return {}

        for filename in os.listdir(laws_path):
            if filename.endswith(".yaml"):
                with open(os.path.join(laws_path, filename), 'r') as f:
                    law_def = yaml.safe_load(f)
                    laws[law_def.get('axiom', filename)] = law_def
        return laws

    def evaluate(self, request_type: str, context: Dict) -> Decision:
        """
        Evaluates a request against all loaded constitutional laws.
        """
        violations = []

        # 1. GPU First Law Check
        if request_type == "schedule_job":
            if self._check_gpu_violation(context):
                violations.append("axiom_5 (GPU First Law)")

        # 2. Data Sovereignty Check
        if request_type == "ingest_data":
            if not self._check_lineage(context):
                violations.append("axiom_data_sovereignty")

        # 3. Human Intervention Check
        if request_type == "manual_override":
            if not self._check_human_intervention(context):
                violations.append("axiom_human_intervention")


        # 4. Sovereign Execution Check (New)
        if request_type == "execute_task":
             # Orchestrator asking permission to execute code
             proposal_summary = context.get("proposal_summary", "")
             # If code touches critical paths without 'hotfix' context, trigger review?
             # For now, enforce that we MUST have a request type
             if not context.get("task_type"):
                  violations.append("axiom_sovereign_execution (No Task Type)")

             # Example: Block execution of 'rm -rf' equivalent
             if "delete" in proposal_summary.lower() and "prod" in proposal_summary.lower():
                  violations.append("axiom_sovereign_execution (Unsafe Deletion)")

        # 5. Reality-Bound Verifications (v27.0)
        if request_type == "execute_proposal":
            # Check Reality Context Coherence (CRC)
            if not context.get("reality_coherence_verified"):
                violations.append("axiom_crc (Reality Coherence Missing)")

            # Check Physical Consequences Verification (VPC)
            if not context.get("vpc_verified") or context.get("witness_count", 0) < 2:
                violations.append("axiom_vpc (Insufficient Physical Verification)")

            # Red-Team Update: Axiom Irreversibility
            if context.get("irreversible") and context.get("alternative_count", 1) > 0:
                violations.append("axiom_irreversibility (Alternatives must be 0 for irreversible actions)")

            # Red-Team Update: Axiom Ignorance
            if context.get("ignorance_declared"):
                violations.append("axiom_ignorance (Inaction preferred when ignorance is declared)")

        # 6. Cincinnatus Mode Actions Filter
        if request_type == "emergency_action":
            category = context.get("category", "unknown")
            forbidden = ["preemptive_lethal", "mass_rights_suspension"]
            if category in forbidden:
                 violations.append(f"cincinnatus_restriction (Category {category} forbidden in Emergency Mode)")

        if violations:
            return Decision(allowed=False, reason="Constitutional Violation", violates_axioms=violations)

        return Decision(allowed=True, reason="Compliant with all Axioms", violates_axioms=[])

    def _check_gpu_violation(self, context: Dict) -> bool:
        """Returns True if violated."""
        # Simple heuristic implementation
        if context.get("compute_intensity") == "high" and context.get("target_node_type") != "gpu":
            return True
        return False

    def _check_lineage(self, context: Dict) -> bool:
        """Returns True if compliant."""
        metadata = context.get("metadata", {})
        required = ["source_system", "owner"]
        return all(k in metadata for k in required)

    def _check_human_intervention(self, context: Dict) -> bool:
        """Returns True if allowed."""
        risk = context.get("risk_score", 100)
        return risk < 20
