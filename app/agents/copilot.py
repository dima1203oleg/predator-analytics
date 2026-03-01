from __future__ import annotations

from pathlib import Path
from typing import Any


try:
    import google.generativeai as genai
except ModuleNotFoundError:
    genai = None
import asyncio

from pydantic import BaseModel


class ToolResult(BaseModel):
    tool_name: str
    output: str
    is_error: bool = False


class CopilotAgent:
    """Predator v45 | Neural AnalyticsCopilot Agent (Gemini-powered).

    Capabilities:
    1. Read/Write files (within scoped workspace).
    2. Execute safe shell commands (git, ls, grep).
    3. Analyze codebase for self-improvement loop.
    """

    def __init__(self, api_key: str, workspace_root: str = "/opt/predator"):
        self.workspace_root = Path(workspace_root)
        if genai is None:
            raise Exception("Gemini client library not installed")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-pro")  # Using latest capable model

        self.system_prompt = f"""
        You are the Predator v45 | Neural AnalyticsSystem Copilot.
        Your role is to assist in maintaining, debugging, and improving the codebase.
        You have access to the file system at {self.workspace_root}.

        Guidelines:
        - Prioritize safety. Do not delete files unless explicitly instructed.
        - When writing code, follow the existing patterns (FastAPI, Async, Pydantic).
        - Use tool calls to interact with the system.
        """

    async def chat(self, user_message: str, history: list[dict[str, str]] | None = None) -> str:
        # Simplified chat interface for now
        # In a real implementation, this would handle multi-turn history and tool calling loops

        prompt = f"{self.system_prompt}\n\nUser: {user_message}"

        # NOTE: This is a simplified generation. In v45 full spec,
        # this would involve function calling definitions for tools.
        response = await self.model.generate_content_async(prompt)
        return response.text

    # --- Tool Implementations ---

    async def list_files(self, directory: str = ".") -> ToolResult:
        """Lists files in a directory relative to workspace root."""
        target_path = (self.workspace_root / directory).resolve()

        if not str(target_path).startswith(str(self.workspace_root)):
            return ToolResult(tool_name="list_files", output="Access Denied: Path outside workspace", is_error=True)

        try:
            # Simple wrapper around ls -F
            proc = await asyncio.create_subprocess_exec(
                "ls", "-F", str(target_path), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                return ToolResult(tool_name="list_files", output=stderr.decode(), is_error=True)

            return ToolResult(tool_name="list_files", output=stdout.decode())
        except Exception as e:
            return ToolResult(tool_name="list_files", output=str(e), is_error=True)

    async def read_file(self, file_path: str) -> ToolResult:
        """Reads a file content."""
        target_path = (self.workspace_root / file_path).resolve()

        if not str(target_path).startswith(str(self.workspace_root)):
            return ToolResult(tool_name="read_file", output="Access Denied: Path outside workspace", is_error=True)

        try:
            if not target_path.exists():
                return ToolResult(tool_name="read_file", output="File not found", is_error=True)

            content = target_path.read_text(encoding="utf-8")
            return ToolResult(tool_name="read_file", output=content)
        except Exception as e:
            return ToolResult(tool_name="read_file", output=str(e), is_error=True)

    async def write_file(self, file_path: str, content: str) -> ToolResult:
        """Writes content to a file (overwrites)."""
        target_path = (self.workspace_root / file_path).resolve()

        if not str(target_path).startswith(str(self.workspace_root)):
            return ToolResult(tool_name="write_file", output="Access Denied: Path outside workspace", is_error=True)

        try:
            # Ensure parent directories exist
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content, encoding="utf-8")
            return ToolResult(tool_name="write_file", output=f"Successfully wrote {len(content)} bytes to {file_path}")
        except Exception as e:
            return ToolResult(tool_name="write_file", output=str(e), is_error=True)

    async def run_shell(self, command: str) -> ToolResult:
        """Runs a shell command.
        SECURITY WARNING: This is a critical capability.
        In production, strict allowlisting of commands is required.
        """
        # Minimum safety check
        forbidden = ["rm -rf /", ":(){ :|:& };:", "wget", "curl"]
        if any(f in command for f in forbidden):
            return ToolResult(tool_name="run_shell", output="Command blocked by safety policy", is_error=True)

        try:
            proc = await asyncio.create_subprocess_shell(
                command, cwd=str(self.workspace_root), stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            output = f"STDOUT:\n{stdout.decode()}\nSTDERR:\n{stderr.decode()}"
            return ToolResult(tool_name="run_shell", output=output, is_error=proc.returncode != 0)
        except Exception as e:
            return ToolResult(tool_name="run_shell", output=str(e), is_error=True)

    def get_agent_definition(self) -> dict[str, Any]:
        """Returns the blueprint for the self-improvement loop registry."""
        return {
            "name": "GeminiCopilot",
            "type": "system_maintenance",
            "model": "gemini-1.5-pro",
            "capabilities": ["fs_read", "fs_write", "shell_exec"],
            "version": "1.0.0",
        }
