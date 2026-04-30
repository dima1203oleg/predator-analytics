from __future__ import annotations

import inspect
import logging
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

if TYPE_CHECKING:
    from collections.abc import Callable

logger = logging.getLogger("tools.registry")


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]
    func: Callable

    class Config:
        arbitrary_types_allowed = True


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, name: str | None = None, description: str | None = None):
        """Decorator to register a tool."""

        def decorator(func: Callable):
            tool_name = name or func.__name__
            tool_desc = description or func.__doc__ or "No description provided."

            # Extract basic parameter info
            # Ideally use docstrings or Pydantic models for robust schema
            sig = inspect.signature(func)
            params = {}
            for param_name, param in sig.parameters.items():
                if param_name in ["self", "args", "kwargs"]:
                    continue

                # Simple type mapping
                param_type = "string"
                if param.annotation == int:
                    param_type = "integer"
                elif param.annotation == bool:
                    param_type = "boolean"
                elif param.annotation == float:
                    param_type = "number"
                elif param.annotation == list:
                    param_type = "array"
                elif param.annotation == dict:
                    param_type = "object"

                params[param_name] = {"type": param_type, "description": f"Parameter {param_name}"}

            self._tools[tool_name] = ToolDefinition(
                name=tool_name, description=tool_desc.strip(), parameters=params, func=func
            )
            logger.info(f"🔧 Registered tool: {tool_name}")
            return func

        return decorator

    def get_tool(self, name: str) -> ToolDefinition | None:
        return self._tools.get(name)

    def get_tools_list(self) -> list[ToolDefinition]:
        return list(self._tools.values())

    def get_schema_for_llm(self) -> list[dict]:
        """Format tools for LLM Function Calling (OpenAI format)."""
        schemas = []
        for tool in self._tools.values():
            schemas.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": {
                            "type": "object",
                            "properties": tool.parameters,
                            "required": list(tool.parameters.keys()),
                        },
                    },
                }
            )
        return schemas

    async def execute(self, tool_name: str, args: dict[str, Any]) -> Any:
        """Execute a tool by name."""
        tool = self.get_tool(tool_name)
        if not tool:
            raise ValueError(f"Tool {tool_name} not found")

        try:
            if inspect.iscoroutinefunction(tool.func):
                return await tool.func(**args)
            return tool.func(**args)
        except Exception as e:
            logger.exception(f"Tool execution failed: {e}")
            return f"Error: {e!s}"


# Global Registry
registry = ToolRegistry()
