from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

class CopilotAgent:
    """Security & Code Review Agent.
    Виконує роль "System 2" перевірки.
    """
    def __init__(self):
        pass

    async def security_review(self, context_prompt: str) -> dict[str, Any]:
        """Проводить аудит безпеки запропонованих дій."""
        logger.info("Copilot Security Review started...")

        # 1. Евристичний аналіз (швидкий)
        risk_level = "low"
        warnings = []

        if "rm -rf" in context_prompt:
            risk_level = "critical"
            warnings.append("Detected destructive command 'rm -rf'")

        if "chmod 777" in context_prompt:
             risk_level = "high"
             warnings.append("Detected insecurity permission change 'chmod 777'")

        if "deploy" in context_prompt.lower():
            risk_level = "medium" # Deploy always carries risk

        # 2. LLM-based analysis (якщо потрібно глибше)
        # Тут можна було б викликати 'gh copilot explain' через subprocess

        return {
            "risk_level": risk_level,
            "approved": risk_level in ["low", "medium"],
            "security_assessment": f"Risk Level: {risk_level}. Warnings: {warnings}",
            "recommendations": warnings
        }

    async def create_pr(self, title: str, description: str, code: str) -> str:
        """Створює Pull Request (Mock)."""
        logger.info(f"Creating PR: {title}")
        return "https://github.com/predator-analytics/repo/pull/123"
