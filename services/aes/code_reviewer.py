"""Module: code_reviewer
Component: aes
Predator Analytics v45.1.
"""

import logging

import httpx

from services.shared.logging_config import setup_logging


setup_logging("aes-reviewer")
logger = logging.getLogger(__name__)

MCP_ROUTER_URL = "http://predator-analytics-mcp-router:8080/v1/query"


class CodeReviewer:
    """AI Code Reviewer for Pull Requests.
    Uses MCP Router to analyze diffs.
    """

    async def review_diff(self, diff_content: str) -> dict:
        """Sends git diff to LLM for analysis."""
        prompt = f"""
        You are a Senior Python Engineer. Review this git diff for:
        1. Security vulnerabilities
        2. Performance issues
        3. Python 3.12 best practices

        DIFF:
        {diff_content[:4000]}  # Truncate for now
        """

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    MCP_ROUTER_URL, json={"prompt": prompt, "task_type": "code_review", "trace_id": "review-job-1"}
                )
                return resp.json()
        except Exception as e:
            logger.exception(f"Review failed: {e}")
            return {"error": str(e)}


if __name__ == "__main__":
    # Test execution
    import asyncio

    reviewer = CodeReviewer()
    # Dummy diff
    loop = asyncio.new_event_loop()
    loop.run_until_complete(reviewer.review_diff("def foo(): pass"))
