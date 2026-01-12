import asyncio
import logging
import os
from typing import Any, Dict

logger = logging.getLogger(__name__)

class AiderAgent:
    """
    Aider CLI Agent for Code Review and Fixing.
    Aligns with Level 3 of Mixed Top CLI Stack.
    """
    def __init__(self):
        # Aider is installed at ~/.local/bin/aider on the server
        self.aider_path = "/home/dima/.local/bin/aider"
        if not os.path.exists(self.aider_path):
            self.aider_path = "aider" # Fallback to PATH

    async def review_and_fix(self, file_path: str, context: str) -> Dict[str, Any]:
        """
        Runs Aider to review and automatically fix code based on context.
        """
        logger.info(f"🛡️ Aider Review started for {file_path}...")

        if not os.path.exists(file_path):
            return {"status": "error", "message": f"File {file_path} not found"}

        # Construct Aider command
        # --yes: auto-accept changes
        # --message: instructions
        cmd = [
            self.aider_path,
            "--yes",
            "--message",
            f"Review this code compared to requirement: '{context}'. Fix bugs, add type hints, ensure PEP8.",
            file_path
        ]

        try:
            # Run Aider
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                logger.info("✅ Aider review completed successfully.")
                return {
                    "status": "success",
                    "output": stdout.decode(),
                    "approved": True
                }
            else:
                logger.warning(f"⚠️ Aider finished with return code {process.returncode}")
                return {
                    "status": "warning",
                    "output": stdout.decode(),
                    "error": stderr.decode(),
                    "approved": False
                }

        except Exception as e:
            logger.error(f"❌ Aider execution failed: {e}")
            return {
                "status": "error",
                "message": str(e),
                "approved": False
            }

    async def security_review(self, context_prompt: str) -> Dict[str, Any]:
        """
        Legacy compatibility: performs a quick security check.
        Can be upgraded to use Aider's analysis capabilities.
        """
        risk_level = "low"
        if "rm -rf" in context_prompt: risk_level = "critical"

        return {
            "risk_level": risk_level,
            "approved": risk_level in ["low", "medium"],
            "security_assessment": f"Aider-monitored Risk Level: {risk_level}"
        }
