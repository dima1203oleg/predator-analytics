from __future__ import annotations

import ast
import logging
import os
from typing import Any, Dict, Optional

from app.libs.core.structured_logger import get_logger
from app.services.llm.service import llm_service


logger = get_logger("service.self_healer")

class SelfHealer:
    """Autonomous Self-Healing Agent.
    Attempts to fix identified issues in the codebase or system.
    """

    async def heal(self, task: dict[str, Any]) -> bool:
        """Attempts to resolve the given task."""
        task_type = task.get("type", "")
        payload = task.get("payload", {})

        logger.info("healer_attempting_task", type=task_type, target=payload.get('title'))

        if task_type == "code_improvement":
            return await self._heal_code(payload)

        return False

    async def _heal_code(self, improvement: dict[str, Any]) -> bool:
        file_path = improvement.get("metrics", {}).get("file")
        issue_type = improvement.get("type")

        if not file_path:
            return False

        full_path = ""
        # Handle relative/absolute paths
        if file_path.startswith("/"):
             full_path = file_path
        else:
             # Assume relative to api-gateway root or project root
             # Try project root first
             full_path = os.path.abspath(file_path)
             if not os.path.exists(full_path):
                 # Try adding /app if in container
                 full_path = f"/app/{file_path}"

        if not os.path.exists(full_path):
            logger.warning(f"File not found for healing: {full_path}")
            return False

        logger.info("refactoring_code", file=full_path, issue=issue_type)

        try:
            with open(full_path, encoding="utf-8") as f:
                code_content = f.read()

            if not code_content.strip():
                return False

            async def attempt_refactor(current_code, error_msg=None):
                # Limit code size to avoid token overflow
                max_code_chars = 12000
                if len(current_code) > max_code_chars:
                    logger.warning(f"Code too large ({len(current_code)} chars), skipping refactor")
                    return None

                error_context = ""
                if error_msg:
                    error_context = f"""
CRITICAL: Your previous output had this syntax error: {error_msg}
Fix this error in your new output. Ensure all parentheses, brackets, and quotes are properly closed.
"""

                prompt = f"""You are an expert Python Refactoring Agent.
Refactor the following Python code to reduce Cyclomatic Complexity and improve readability.

STRICT RULES:
1. Return ONLY valid, executable Python code - no explanations, comments about changes, or markdown.
2. Do NOT use markdown code fences (```) anywhere in your output.
3. Preserve all imports exactly as they are.
4. Preserve the overall structure and class/function names.
5. Ensure all parentheses (), brackets [], and braces {{}} are properly matched.
6. Ensure all string literals and f-strings are properly closed.
7. Every try block MUST have except or finally.
8. Every if/elif/else/for/while/with/def/class MUST have an indented block after the colon.
{error_context}
ORIGINAL CODE TO REFACTOR:
{current_code}

OUTPUT ONLY THE REFACTORED PYTHON CODE:"""

                response = await llm_service.generate_with_routing(
                    prompt=prompt,
                    system="You are a Python code refactoring engine. Output ONLY valid Python code. No markdown. No explanations.",
                    max_tokens=6000,
                    temperature=0.1
                )

                if not response.success:
                    logger.error(f"LLM failed to refactor: {response.error}")
                    return None

                new_code = response.content
                # Robust cleanup
                lines = new_code.strip().split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].strip() == "```":
                    lines = lines[:-1]

                cleaned_code = "\n".join(lines).strip()
                if cleaned_code.startswith("python"):
                    cleaned_code = cleaned_code[6:].strip()

                return cleaned_code

            # First attempt
            new_code = await attempt_refactor(code_content)
            if not new_code:
                return False

            # Validate syntax
            try:
                ast.parse(new_code)
            except SyntaxError as e:
                logger.warning(f"Syntax error in first attempt: {e}. Retrying with error context...")
                # Second attempt with error feedback
                new_code = await attempt_refactor(code_content, error_msg=str(e))
                if not new_code:
                    return False
                try:
                    ast.parse(new_code)
                except SyntaxError as e2:
                    logger.exception(f"Syntax error persistent after retry: {e2}")
                    return False

            # Backup
            backup_path = f"{full_path}.bak"
            with open(backup_path, "w", encoding="utf-8") as f:
                f.write(code_content)

            # Write new code
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_code)

            logger.info("successfully_refactored_file", file=full_path)
            return True

        except Exception as e:
            logger.exception(f"Healer exception: {e}")
            return False

self_healer = SelfHealer()
