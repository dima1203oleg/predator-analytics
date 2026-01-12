#!/usr/bin/env python3
"""
PREDATOR v25 - Aider CLI Integration Agent
AI-Powered Code Modification via Aider CLI

This agent uses Aider CLI to make intelligent code changes based on
natural language prompts, integrating with the Orchestrator's task queue.
"""
import asyncio
import subprocess
import logging
import os
import json
from typing import Optional, Dict, Any

logger = logging.getLogger("agents.aider")

class AiderAgent:
    """
    Agent that uses Aider CLI for AI-powered code modifications.
    Supports multiple LLM backends (Gemini, OpenAI, Anthropic, Ollama).
    """

    def __init__(
        self,
        model: str = "gemini/gemini-2.5-pro",
        api_key_env: str = "GEMINI_API_KEY",
        project_root: str = "/app",
        auto_commit: bool = False
    ):
        self.model = model
        self.api_key_env = api_key_env
        self.project_root = project_root
        self.auto_commit = auto_commit
        self.history: list = []

    def _get_aider_command(
        self,
        prompt: str,
        files: list[str],
        read_only_files: Optional[list[str]] = None
    ) -> list[str]:
        """Build the Aider CLI command."""
        cmd = [
            "aider",
            "--model", self.model,
            "--yes",  # Auto-accept changes
            "--no-stream",  # Non-interactive
            "--no-git" if not self.auto_commit else "--auto-commits",
        ]

        # Add files to edit
        for f in files:
            cmd.extend(["--file", f])

        # Add read-only context files
        if read_only_files:
            for rf in read_only_files:
                cmd.extend(["--read", rf])

        # Add the message/prompt
        cmd.extend(["--message", prompt])

        return cmd

    async def execute_task(
        self,
        prompt: str,
        target_files: list[str],
        context_files: Optional[list[str]] = None,
        timeout: int = 300
    ) -> Dict[str, Any]:
        """
        Execute an Aider task to modify code.

        Args:
            prompt: Natural language description of what to do
            target_files: Files that can be edited
            context_files: Read-only files for context
            timeout: Max execution time in seconds

        Returns:
            Dict with status, output, and changes made
        """
        logger.info(f"🤖 Aider executing: {prompt[:100]}...")

        cmd = self._get_aider_command(prompt, target_files, context_files)

        try:
            result = await asyncio.wait_for(
                asyncio.create_subprocess_exec(
                    *cmd,
                    cwd=self.project_root,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env={
                        **os.environ,
                        self.api_key_env: os.getenv(self.api_key_env, ""),
                    }
                ),
                timeout=timeout
            )

            stdout, stderr = await result.communicate()

            response = {
                "status": "success" if result.returncode == 0 else "failed",
                "return_code": result.returncode,
                "stdout": stdout.decode("utf-8"),
                "stderr": stderr.decode("utf-8"),
                "files_modified": target_files,
                "prompt": prompt
            }

            self.history.append(response)

            if result.returncode == 0:
                logger.info(f"✅ Aider completed successfully")
            else:
                logger.error(f"❌ Aider failed: {stderr.decode()[:500]}")

            return response

        except asyncio.TimeoutError:
            logger.error(f"⏰ Aider timed out after {timeout}s")
            return {
                "status": "timeout",
                "error": f"Execution timed out after {timeout} seconds"
            }
        except FileNotFoundError:
            logger.error("❌ Aider CLI not found. Install with: pip install aider-chat")
            return {
                "status": "error",
                "error": "Aider CLI not installed"
            }
        except Exception as e:
            logger.error(f"❌ Aider execution error: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    async def fix_lint_errors(self, file_path: str) -> Dict[str, Any]:
        """Use Aider to fix lint errors in a file."""
        prompt = f"""
        Fix all linting errors and type hints in this file.
        Follow best practices for Python/TypeScript.
        Do not change the logic, only fix style and type issues.
        """
        return await self.execute_task(prompt, [file_path])

    async def add_feature(
        self,
        description: str,
        target_file: str,
        context_files: Optional[list[str]] = None
    ) -> Dict[str, Any]:
        """Add a new feature to a file."""
        prompt = f"""
        Add the following feature to the code:

        {description}

        Ensure:
        - Code follows existing patterns and style
        - Proper error handling is included
        - Type hints are used where applicable
        - The feature integrates cleanly with existing code
        """
        return await self.execute_task(prompt, [target_file], context_files)

    async def refactor(
        self,
        description: str,
        files: list[str]
    ) -> Dict[str, Any]:
        """Refactor code across multiple files."""
        prompt = f"""
        Perform the following refactoring:

        {description}

        Guidelines:
        - Maintain backward compatibility where possible
        - Preserve existing tests
        - Update imports if file locations change
        - Add comments explaining the refactoring rationale
        """
        return await self.execute_task(prompt, files)

    async def generate_tests(
        self,
        source_file: str,
        test_file: str
    ) -> Dict[str, Any]:
        """Generate unit tests for a source file."""
        prompt = f"""
        Generate comprehensive unit tests for {source_file}.

        Requirements:
        - Use pytest framework
        - Include positive and negative test cases
        - Mock external dependencies
        - Aim for high code coverage
        - Use descriptive test names
        """
        return await self.execute_task(
            prompt,
            [test_file],
            context_files=[source_file]
        )


class AiderOrchestration:
    """
    Orchestrates multiple Aider agents for complex tasks.
    """

    def __init__(self, project_root: str = "/app"):
        self.agents = {
            "gemini": AiderAgent(
                model="gemini/gemini-2.5-pro",
                api_key_env="GEMINI_API_KEY",
                project_root=project_root
            ),
            "claude": AiderAgent(
                model="claude-3-5-sonnet-20241022",
                api_key_env="ANTHROPIC_API_KEY",
                project_root=project_root
            ),
            "ollama": AiderAgent(
                model="ollama/qwen2.5-coder:32b",
                api_key_env="OLLAMA_API_KEY",  # Not needed for local
                project_root=project_root
            ),
        }
        self.default_agent = "gemini"

    async def execute_with_fallback(
        self,
        prompt: str,
        files: list[str],
        preferred_agents: list[str] = None
    ) -> Dict[str, Any]:
        """
        Execute task with fallback to other agents if primary fails.
        """
        agents_to_try = preferred_agents or ["gemini", "ollama", "claude"]

        for agent_name in agents_to_try:
            if agent_name not in self.agents:
                continue

            logger.info(f"🔄 Trying agent: {agent_name}")
            agent = self.agents[agent_name]

            result = await agent.execute_task(prompt, files)

            if result.get("status") == "success":
                result["agent_used"] = agent_name
                return result

            logger.warning(f"⚠️ Agent {agent_name} failed, trying next...")

        return {
            "status": "failed",
            "error": "All agents failed to complete the task",
            "agents_tried": agents_to_try
        }


# CLI entrypoint for standalone usage
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Aider AI Agent CLI")
    parser.add_argument("prompt", help="Task description")
    parser.add_argument("--files", nargs="+", required=True, help="Files to edit")
    parser.add_argument("--model", default="gemini/gemini-2.5-pro", help="LLM model")
    parser.add_argument("--context", nargs="*", help="Read-only context files")

    args = parser.parse_args()

    agent = AiderAgent(model=args.model)
    result = asyncio.run(agent.execute_task(
        args.prompt,
        args.files,
        args.context
    ))

    print(json.dumps(result, indent=2))
