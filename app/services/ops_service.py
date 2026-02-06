from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.libs.agents.tools.registry import registry


logger = logging.getLogger("services.ops")

class OpsService:
    """Operations Service that executes specialized CLI tools.
    Used by TrinityCore for context enrichment and automated fixes.
    """

    async def diagnose_system(self, query: str) -> str:
        """Run comprehensive system diagnostics."""
        logger.info(f"Running diagnostics for query: {query}")
        return await registry.execute("system_doctor", {})

    async def execute_tool(self, tool_name: str, args: dict[str, Any]) -> Any:
        """Direct tool execution."""
        return await registry.execute(tool_name, args)

    async def apply_fixes(self, issues: list[str]) -> list[str]:
        """Apply a sequence of automated fixes."""
        results = []
        for issue in issues:
            res = await registry.execute("fix_issue", {"issue_type": issue})
            results.append(res)
        return results

ops_service = OpsService()
