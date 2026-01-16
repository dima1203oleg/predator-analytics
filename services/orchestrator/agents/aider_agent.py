#!/usr/bin/env python3.12
"""
PREDATOR v25 - Aider CLI Integration Agent
AI-Powered Code Modification via Aider CLI

This agent uses Aider CLI to make intelligent code changes based on
natural language prompts, integrating with the Orchestrator's task queue.
"""
import asyncio
import subprocess
import json
import os
from typing import Optional, Dict, Any, List

from libs.core.governance import OperationalPolicy, SecurityStage
from libs.core.structured_logger import get_logger, RequestLogger, log_security_event

logger = get_logger("agents.aider")

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
        files: List[str],
        read_only_files: Optional[List[str]] = None
    ) -> List[str]:
        """Build the Aider CLI command."""
        # Sovereign Mode Auto-Config
        is_sovereign = os.getenv("SOVEREIGN_AUTO_APPROVE", "false").lower() == "true"
        auto_commit_flag = "--auto-commits" if (self.auto_commit or is_sovereign) else "--no-git"

        cmd = [
            "aider",
            "--model", self.model,
            "--yes",  # Auto-accept changes
            "--no-stream",  # Non-interactive
            auto_commit_flag,
            "--no-suggest-shell-commands",
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
        target_files: List[str],
        context_files: Optional[List[str]] = None,
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

        with RequestLogger(logger, "aider_execution", prompt_preview=prompt[:50]) as req_logger:
            req_logger.info("aider_executing", prompt=prompt)

            cmd = self._get_aider_command(prompt, target_files, context_files)

            # Validation via OperationalPolicy
            stage = SecurityStage.PRODUCTION if os.getenv("ENVIRONMENT") == "production" else SecurityStage.RND
            validation = OperationalPolicy.validate_command(" ".join(cmd), stage=stage)

            if not validation["approved"]:
                log_security_event(
                    req_logger,
                    "command_blocked",
                    severity="high",
                    reason=validation["reason"],
                    command=" ".join(cmd)
                )
                return {
                    "status": "security_violation",
                    "error": validation["reason"],
                    "command": " ".join(cmd)
                }

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
                            "OLLAMA_API_BASE": os.getenv("OLLAMA_BASE_URL", "http://ollama:11434"),
                        }
                    ),
                    timeout=timeout
                )

                stdout, stderr = await result.communicate()
                stdout_str = stdout.decode("utf-8")
                stderr_str = stderr.decode("utf-8")

                response = {
                    "status": "success" if result.returncode == 0 else "failed",
                    "return_code": result.returncode,
                    "stdout": stdout_str,
                    "stderr": stderr_str,
                    "files_modified": target_files,
                    "prompt": prompt
                }

                self.history.append(response)

                if result.returncode == 0:
                    req_logger.info("aider_completed_successfully", return_code=0)
                else:
                    req_logger.error(
                        "aider_failed",
                        return_code=result.returncode,
                        stderr=stderr_str[:500]
                    )

                return response

            except asyncio.TimeoutError:
                req_logger.error("aider_timeout", timeout=timeout)
                return {
                    "status": "timeout",
                    "error": f"Execution timed out after {timeout} seconds"
                }
            except FileNotFoundError:
                req_logger.warning("aider_cli_not_found", detail="Using API fallback")
                return await self._execute_via_api(prompt, target_files)
            except Exception as e:
                req_logger.exception("aider_execution_error", error=str(e))
                return await self._execute_via_api(prompt, target_files)

    async def _execute_via_api(self, prompt: str, target_files: List[str]) -> Dict[str, Any]:
        logger.info("api_fallback_started", prompt_preview=prompt[:50])
        try:
            import httpx

            # Визначаємо провайдера з моделі
            if self.model.startswith("gemini"):
                api_key = os.getenv("GEMINI_API_KEY")
                if api_key:
                    # Використовуємо Gemini API
                    for attempt in range(3):
                        async with httpx.AsyncClient(timeout=60) as client:
                            response = await client.post(
                                "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
                                headers={"Content-Type": "application/json"},
                                params={"key": api_key},
                                json={
                                    "contents": [{"parts": [{"text": f"Ти AI-асистент для програмування. {prompt}"}]}],
                                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2000}
                                }
                            )
                            if response.status_code == 200:
                                result = response.json()
                                output = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                                return {
                                    "status": "success",
                                    "output": output,
                                    "files_modified": target_files,
                                    "method": "gemini_api"
                                }
                            elif response.status_code == 429:
                                logger.warning(f"⚠️ Gemini 429 on attempt {attempt+1}. Sleeping 5s...")
                                await asyncio.sleep(5)
                                continue
                            else:
                                break


            elif self.model.startswith("mistral") or self.model.startswith("codestral"):
                 api_key = os.getenv("MISTRAL_API_KEY") or os.getenv("CODESTRAL_API_KEY")
                 if api_key:
                     async with httpx.AsyncClient(timeout=120) as client:
                         response = await client.post(
                             "https://api.mistral.ai/v1/chat/completions",
                             headers={"Authorization": f"Bearer {api_key}"},
                             json={
                                 "model": "mistral-small-latest",
                                 "messages": [{"role": "user", "content": prompt}]
                             }
                         )
                         if response.status_code == 200:
                             result = response.json()
                             return {
                                 "status": "success",
                                 "output": result['choices'][0]['message']['content'],
                                 "files_modified": target_files,
                                 "method": "mistral_api"
                             }

            elif self.model.startswith("ollama"):

                # Використовуємо локальний Ollama з пошуком хоста
                hosts = ["http://ollama:11434", "http://host.docker.internal:11434", "http://localhost:11434"]
                base_url = None

                async with httpx.AsyncClient(timeout=5.0) as client:
                    for h in hosts:
                        try:
                            logger.info("ollama_host_testing", host=h)
                            resp = await client.get(f"{h}/api/tags")
                            if resp.status_code == 200:
                                logger.info("ollama_host_found", host=h)
                                base_url = h
                                break
                        except Exception as e:
                            logger.debug("ollama_host_failed", host=h, error=str(e))
                            continue

                if not base_url:
                     return {"status": "error", "error": "Ollama service unreachable across all hosts"}

                model_name = self.model.replace("ollama/", "")
                async with httpx.AsyncClient(timeout=120) as client:
                    response = await client.post(
                        f"{base_url}/api/generate",
                        json={"model": model_name, "prompt": prompt, "stream": False}
                    )
                    if response.status_code == 200:
                        result = response.json()
                        return {
                            "status": "success",
                            "output": result.get("response", ""),
                            "files_modified": target_files,
                            "method": "ollama_api"
                        }

            # Fallback на будь-який успішний результат
            return {
                "status": "error",
                "output": "Не вдалося отримати відповідь від жодного LLM провайдера (Gemini/Ollama).",
                "files_modified": [],
                "method": "failed"
            }


        except Exception as e:
            logger.error("api_fallback_failed", error=str(e))
            return {
                "status": "error",
                "error": str(e),
                "files_modified": target_files
            }

    async def fix_lint_errors(self, file_path: str) -> Dict[str, Any]:
        prompt = "Fix all linting errors and type hints in this file. Follow best practices for Python/TypeScript. Do not change the logic, only fix style and type issues."
        return await self.execute_task(prompt, [file_path])

    async def add_feature(
        self,
        description: str,
        target_file: str,
        context_files: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        prompt = f"Add the following feature to the code:\\n\\n{description}\\n\\nEnsure:\\n- Code follows existing patterns and style\\n- Proper error handling is included\\n- Type hints are used where applicable\\n- The feature integrates cleanly with existing code"
        return await self.execute_task(prompt, [target_file], context_files)


    async def refactor(
        self,
        description: str,
        files: List[str]
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
            "mistral": AiderAgent(
                model="mistral/mistral-large-latest",
                api_key_env="MISTRAL_API_KEY",
                project_root=project_root
            ),
            "vibe": AiderAgent(
                model="gemini/gemini-2.0-flash-exp", # Використовуємо найшвидшу модель для Vibe
                api_key_env="GEMINI_API_KEY",
                project_root=project_root
            ),
        }
        self.default_agent = "gemini"

    async def execute_with_fallback(
        self,
        prompt: str,
        files: List[str],
        preferred_agents: List[str] = None
    ) -> Dict[str, Any]:
        """
        Execute task with fallback to other agents if primary fails.
        """
        agents_to_try = preferred_agents or ["gemini", "ollama", "claude"]

        for agent_name in agents_to_try:
            if agent_name not in self.agents:
                continue

            logger.info("trying_agent_fallback", agent=agent_name)
            agent = self.agents[agent_name]

            result = await agent.execute_task(prompt, files)

            if result.get("status") == "success":
                result["agent_used"] = agent_name
                return result

            logger.warning("agent_task_failed", agent=agent_name, detail="Trying next agent")

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
