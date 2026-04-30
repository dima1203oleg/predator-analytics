from __future__ import annotations

import asyncio
from datetime import datetime
import json
import logging
import os
import subprocess
import tempfile
from typing import Any

from agents.contract import AgentContext, AZRAgentContract

logger = logging.getLogger("agent.azr")


class PredatorAZRAgent(AZRAgentContract):
    """Autonomous Zone Recovery (AZR) Agent.
    Implements Self-Healing and Improvement Loops strictly via CLI.
    """

    name = "predator_azr_v1"
    version = "1.0.0"
    required_permissions = ["system:read", "azr:propose", "db:read_metrics"]

    def __init__(self):
        self.running = False
        self.health_score = 100.0

    async def run(self, context: AgentContext) -> dict[str, Any]:
        """Main Agent Loop: OODA (Observe, Orient, Decide, Act)."""
        self.running = True
        logger.info(f"🤖 AZR Agent {self.name} started with execution ID {context.execution_id}")

        cycles = 0
        amendments = []

        try:
            while self.running and cycles < 5:
                cycles += 1
                logger.info(f"🔄 AZR Cycle {cycles} starting...")

                # 1. OBSERVE: Get Comprehensive Verification
                verification = self._cli_command(context, ["verify", "--output", "json"])

                # 2. ORIENT: Deep Analysis of Constitutional Integrity
                issues = []
                const_status = verification.get("constitution", {}).get("status")

                if const_status == "VIOLATED":
                    issues.append("Axiom Integrity Violation detected in core document")
                elif const_status == "MISSING":
                    issues.append("Constitution file is MISSING")

                # 3. DECIDE: Integrated Analysis with System Status
                status = self._cli_command(context, ["system", "status", "--output", "json"])
                if status.get("overall") != "HEALTHY":
                    issues.append(f"System status is {status.get('overall')}")

                # 4. ACT: If issues found, propose amendments
                if issues:
                    logger.warning(f"⚠️ Issues detected: {issues}")
                    # In a real system, we'd have a catalog of fix scripts/templates
                    proposal = f"""
                    title: Automatic Constitutional Recovery
                    scope: security
                    actions:
                      - type: GITOPS_SYNC
                        target: docs/v45_CONSTITUTION.md
                        reason: {issues[0]}
                    """
                    res = await self.propose_amendment(context, proposal)
                    amendments.append(res)
                else:
                    logger.info("✅ System state verified as CONSTITUTIONAL.")

                # Sleep before next cycle
                await asyncio.sleep(15)

        except Exception as e:
            logger.exception(f"AZR Crash: {e}")
            return {"status": "CRASHED", "error": str(e)}

        return {"status": "COMPLETED", "cycles": cycles, "amendments": amendments}

    async def health_check(self) -> bool:
        return True

    async def propose_amendment(self, context: AgentContext, proposal_yaml: str) -> str:
        """Submit proposal via predatorctl azr propose."""
        import os

        # Write proposal to a temp file for CLI consumption
        with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as f:
            f.write(proposal_yaml)
            tmp_path = f.name

        try:
            logger.info("📝 Submitting amendment proposal...")
            # Command: predatorctl azr propose <path>
            res = self._cli_command(context, ["azr", "propose", "amendment", tmp_path])
            proposal_id = res.get("proposal_id", "unknown_id")
            logger.info(f"✅ Amendment proposed successfully: {proposal_id}")
            return proposal_id
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    def _cli_command(self, context: AgentContext, args: list[str]) -> dict:
        """Execute CLI command safely and return JSON."""
        cmd = [context.cli_path, *args]
        try:
            env = os.environ.copy()
            # Ensure PYTHONPATH is set so libs are found
            if context.workspace_root not in env.get("PYTHONPATH", ""):
                env["PYTHONPATH"] = f"{context.workspace_root}:{env.get('PYTHONPATH', '')}"

            result = subprocess.run(
                cmd,
                check=False,
                capture_output=True,
                text=True,
                env=env,
                cwd=context.workspace_root,
            )

            if result.returncode != 0:
                logger.error(f"CLI Error: {result.stderr}")
                return {"status": "ERROR", "error": result.stderr}

            # Try to parse as JSON if output is intended for it
            if "--output" in args and "json" in args:
                try:
                    return json.loads(result.stdout)
                except json.JSONDecodeError:
                    return {"status": "RAW", "output": result.stdout}

            return {"status": "OK", "output": result.stdout}
        except Exception as e:
            logger.exception(f"Failed to execute CLI command {cmd}")
            return {"status": "EXCEPTION", "error": str(e)}

    def _generate_fix_proposal(self, analysis: dict) -> str:
        """Generate a machine-readable fix proposal."""
        return f"""
# PREDATOR V45 AMENDMENT PROPOSAL
type: AUTO_RECOVERY
timestamp: {datetime.now().isoformat()}
agent: {self.name}
issues:
{json.dumps(analysis.get("issues", []), indent=2)}
proposed_actions:
  - action: verify_all_nodes
  - action: re_sync_ledger_from_consensus
  - action: restart_orphaned_etls
safety_valve: READY
"""
