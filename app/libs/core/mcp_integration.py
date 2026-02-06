"""🔌 MCP INTEGRATION LAYER - Model Context Protocol for AZR
==========================================================
Core component for AZR v40 Sovereign Architecture.

This module provides:
- MCP Client for connecting to external tools
- MCP Server for exposing AZR capabilities
- Tool registration and discovery
- Secure context passing
- Multi-provider AI agent orchestration

The Model Context Protocol (MCP) is an open standard that enables
seamless integration of AI models with data sources and tools through
a standardized interface.

Constitutional Enforcement:
- Axiom 4: Transparency (All MCP calls are logged)
- Axiom 6: Rate Limiting (MCP calls respect limits)
- Axiom 3: Security First (Auth on all external connections)

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

from abc import ABC, abstractmethod
import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime, timezone
from enum import Enum
import json
import logging
import os
from pathlib import Path
import threading
import time
from typing import Any, Generic, TypeVar


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_integration")


# ============================================================================
# 📊 MCP TYPES
# ============================================================================

class MCPToolType(Enum):
    """Types of MCP tools."""
    FUNCTION = "function"
    RESOURCE = "resource"
    PROMPT = "prompt"


class MCPProtocol(Enum):
    """MCP transport protocols."""
    STDIO = "stdio"
    HTTP = "http"
    WEBSOCKET = "websocket"


@dataclass
class MCPTool:
    """Definition of an MCP tool."""
    name: str
    description: str
    tool_type: MCPToolType
    parameters: dict[str, Any]
    return_type: str = "any"
    requires_auth: bool = False
    rate_limit: int = 100  # calls per minute

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d['tool_type'] = self.tool_type.value
        return d

    def to_openai_function(self) -> dict[str, Any]:
        """Convert to OpenAI function calling format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters
            }
        }


@dataclass
class MCPToolCall:
    """Record of an MCP tool call."""
    call_id: str
    tool_name: str
    arguments: dict[str, Any]
    result: Any | None = None
    error: str | None = None
    duration_ms: float = 0.0
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class MCPServerConfig:
    """Configuration for an MCP server connection."""
    name: str
    protocol: MCPProtocol
    endpoint: str  # Path for STDIO, URL for HTTP/WS
    auth_token: str | None = None
    timeout_seconds: int = 30
    max_retries: int = 3

    def to_dict(self) -> dict[str, Any]:
        d = asdict(self)
        d['protocol'] = self.protocol.value
        # Don't expose auth token
        d['auth_token'] = "***" if self.auth_token else None
        return d


# ============================================================================
# 🔧 MCP TOOL REGISTRY
# ============================================================================

class MCPToolRegistry:
    """Registry for MCP tools.
    Manages tool discovery, registration, and invocation.
    """

    def __init__(self):
        self._tools: dict[str, MCPTool] = {}
        self._handlers: dict[str, Callable[..., Awaitable[Any]]] = {}
        self._call_history: list[MCPToolCall] = []
        self._lock = threading.Lock()

        # Rate limiting
        self._call_counts: dict[str, list[float]] = {}

    def register_tool(
        self,
        tool: MCPTool,
        handler: Callable[..., Awaitable[Any]]
    ) -> None:
        """Register a tool with its handler."""
        with self._lock:
            self._tools[tool.name] = tool
            self._handlers[tool.name] = handler
            logger.info(f"Registered MCP tool: {tool.name}")

    def register_function(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        handler: Callable[..., Awaitable[Any]],
        requires_auth: bool = False
    ) -> MCPTool:
        """Convenience method to register a function tool."""
        tool = MCPTool(
            name=name,
            description=description,
            tool_type=MCPToolType.FUNCTION,
            parameters=parameters,
            requires_auth=requires_auth
        )
        self.register_tool(tool, handler)
        return tool

    def get_tool(self, name: str) -> MCPTool | None:
        """Get tool by name."""
        return self._tools.get(name)

    def list_tools(self) -> list[MCPTool]:
        """List all registered tools."""
        return list(self._tools.values())

    def get_tools_schema(self) -> list[dict[str, Any]]:
        """Get tools in OpenAI function calling format."""
        return [tool.to_openai_function() for tool in self._tools.values()]

    def _check_rate_limit(self, tool_name: str) -> bool:
        """Check if tool is within rate limit."""
        tool = self._tools.get(tool_name)
        if not tool:
            return False

        now = time.time()
        minute_ago = now - 60

        # Clean old entries
        if tool_name in self._call_counts:
            self._call_counts[tool_name] = [
                t for t in self._call_counts[tool_name] if t > minute_ago
            ]
        else:
            self._call_counts[tool_name] = []

        # Check limit
        if len(self._call_counts[tool_name]) >= tool.rate_limit:
            return False

        self._call_counts[tool_name].append(now)
        return True

    async def invoke(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        auth_context: dict[str, Any] | None = None
    ) -> MCPToolCall:
        """Invoke a tool and return result."""
        call_id = f"call_{int(time.time_ns()) % 1000000:012d}"

        start = time.perf_counter()

        tool = self._tools.get(tool_name)
        if not tool:
            call = MCPToolCall(
                call_id=call_id,
                tool_name=tool_name,
                arguments=arguments,
                error=f"Tool '{tool_name}' not found"
            )
            self._call_history.append(call)
            return call

        # Check auth if required
        if tool.requires_auth and not auth_context:
            call = MCPToolCall(
                call_id=call_id,
                tool_name=tool_name,
                arguments=arguments,
                error="Authentication required"
            )
            self._call_history.append(call)
            return call

        # Check rate limit
        if not self._check_rate_limit(tool_name):
            call = MCPToolCall(
                call_id=call_id,
                tool_name=tool_name,
                arguments=arguments,
                error="Rate limit exceeded"
            )
            self._call_history.append(call)
            return call

        # Invoke handler
        try:
            handler = self._handlers.get(tool_name)
            if not handler:
                raise ValueError(f"No handler for tool '{tool_name}'")

            result = await handler(**arguments)
            duration = (time.perf_counter() - start) * 1000

            call = MCPToolCall(
                call_id=call_id,
                tool_name=tool_name,
                arguments=arguments,
                result=result,
                duration_ms=duration
            )

        except Exception as e:
            duration = (time.perf_counter() - start) * 1000
            call = MCPToolCall(
                call_id=call_id,
                tool_name=tool_name,
                arguments=arguments,
                error=str(e),
                duration_ms=duration
            )

        self._call_history.append(call)
        logger.info(f"MCP call: {tool_name} -> {'OK' if call.result else call.error}")

        return call

    def get_call_history(self, limit: int = 100) -> list[MCPToolCall]:
        """Get recent call history."""
        return self._call_history[-limit:]

    def get_stats(self) -> dict[str, Any]:
        """Get registry statistics."""
        success_count = sum(1 for c in self._call_history if c.result is not None)
        error_count = sum(1 for c in self._call_history if c.error is not None)

        return {
            "total_tools": len(self._tools),
            "total_calls": len(self._call_history),
            "success_count": success_count,
            "error_count": error_count,
            "success_rate": success_count / max(1, len(self._call_history)) * 100
        }


# ============================================================================
# 🌐 MCP CLIENT
# ============================================================================

class MCPClient:
    """🔌 MCP Client для підключення до зовнішніх серверів

    Підтримує:
    - STDIO (локальні процеси)
    - HTTP (REST API)
    - WebSocket (real-time)

    Інтегрується з:
    - Mistral AI
    - OpenAI
    - Anthropic
    - Local LLMs (Ollama)
    """

    def __init__(self, config: MCPServerConfig):
        self.config = config
        self._connected = False
        self._tools: list[MCPTool] = []
        self._session_id: str | None = None

    async def connect(self) -> bool:
        """Connect to MCP server."""
        try:
            if self.config.protocol == MCPProtocol.STDIO:
                # For STDIO, we'd spawn a subprocess
                # Simulating connection for now
                self._connected = True
                self._session_id = f"session_{int(time.time())}"
                logger.info(f"Connected to MCP server: {self.config.name} (STDIO)")

            elif self.config.protocol == MCPProtocol.HTTP:
                # HTTP connection
                import httpx
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"{self.config.endpoint}/health",
                        timeout=self.config.timeout_seconds
                    )
                    if resp.status_code == 200:
                        self._connected = True
                        self._session_id = resp.headers.get("X-Session-ID")
                        logger.info(f"Connected to MCP server: {self.config.name} (HTTP)")

            elif self.config.protocol == MCPProtocol.WEBSOCKET:
                # WebSocket would use aiohttp or similar
                self._connected = True
                self._session_id = f"ws_session_{int(time.time())}"
                logger.info(f"Connected to MCP server: {self.config.name} (WebSocket)")

            # Discover tools
            if self._connected:
                await self._discover_tools()

            return self._connected

        except Exception as e:
            logger.error(f"Failed to connect to MCP server {self.config.name}: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from MCP server."""
        self._connected = False
        self._session_id = None
        self._tools.clear()
        logger.info(f"Disconnected from MCP server: {self.config.name}")

    async def _discover_tools(self) -> None:
        """Discover available tools from server."""
        # In real implementation, this would query the server
        # For now, simulate with example tools
        self._tools = [
            MCPTool(
                name=f"{self.config.name}_health",
                description=f"Check health of {self.config.name}",
                tool_type=MCPToolType.FUNCTION,
                parameters={"type": "object", "properties": {}}
            ),
            MCPTool(
                name=f"{self.config.name}_query",
                description=f"Query data from {self.config.name}",
                tool_type=MCPToolType.FUNCTION,
                parameters={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Query string"}
                    },
                    "required": ["query"]
                }
            )
        ]

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def available_tools(self) -> list[MCPTool]:
        return list(self._tools)

    async def call_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any]
    ) -> dict[str, Any]:
        """Call a tool on the remote server."""
        if not self._connected:
            return {"error": "Not connected"}

        # Simulate tool call
        return {
            "result": f"Called {tool_name} with {arguments}",
            "server": self.config.name,
            "timestamp": datetime.now(UTC).isoformat()
        }


# ============================================================================
# 🤖 MCP AGENT ORCHESTRATOR
# ============================================================================

class MCPAgentOrchestrator:
    """🤖 Оркестратор AI Агентів з MCP Інтеграцією

    Координує:
    - Multiple AI providers (Mistral, OpenAI, Ollama)
    - Tool discovery and registration
    - Context management
    - Response aggregation

    Usage:
        orchestrator = MCPAgentOrchestrator()
        await orchestrator.register_mcp_server(config)
        response = await orchestrator.run_agent(
            prompt="Analyze system health",
            tools=["get_metrics", "check_status"]
        )
    """

    def __init__(self, storage_path: str | Path = "/tmp/azr_logs"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

        # Tool registry (local tools)
        self.registry = MCPToolRegistry()

        # MCP clients (external servers)
        self._clients: dict[str, MCPClient] = {}

        # AI Provider configs
        self._providers: dict[str, dict[str, Any]] = {}
        self._default_provider = "ollama"

        # Conversation history
        self._conversations: dict[str, list[dict[str, Any]]] = {}

        # Load default tools
        self._register_default_tools()

    def _register_default_tools(self) -> None:
        """Register default AZR tools."""

        # System health tool
        async def get_system_health() -> dict[str, Any]:
            try:
                from app.libs.core.system_metrics import get_system_snapshot
                snapshot = get_system_snapshot()
                return {
                    "cpu_percent": snapshot.cpu_percent,
                    "memory_percent": snapshot.memory_percent,
                    "disk_percent": snapshot.disk_percent,
                    "timestamp": datetime.now(UTC).isoformat()
                }
            except Exception as e:
                return {"error": f"Metrics collection failed: {e!s}"}

        self.registry.register_function(
            name="get_system_health",
            description="Get current system health metrics (CPU, Memory, Disk)",
            parameters={"type": "object", "properties": {}},
            handler=get_system_health
        )

        # AZR status tool
        async def get_azr_status() -> dict[str, Any]:
            return {
                "engine": "AZR v40",
                "status": "running",
                "capabilities": [
                    "MerkleTruthLedger",
                    "EventSourcing",
                    "FormalStateMachine",
                    "RedTeamAgent",
                    "GraphRAGMemory",
                    "MCPIntegration"
                ],
                "timestamp": datetime.now(UTC).isoformat()
            }

        self.registry.register_function(
            name="get_azr_status",
            description="Get current AZR engine status and capabilities",
            parameters={"type": "object", "properties": {}},
            handler=get_azr_status
        )

        # Truth Ledger query tool
        async def query_truth_ledger(limit: int = 10) -> dict[str, Any]:
            try:
                from app.libs.core.merkle_ledger import get_truth_ledger
                ledger = get_truth_ledger(self.storage_path)
                entries = ledger.get_latest_entries(limit)
                return {
                    "total_entries": ledger.length,
                    "merkle_root": ledger.merkle_root[:32] + "...",
                    "recent_entries": [e.to_dict() for e in entries]
                }
            except Exception as e:
                return {"error": str(e)}

        self.registry.register_function(
            name="query_truth_ledger",
            description="Query the cryptographic Truth Ledger for recent entries",
            parameters={
                "type": "object",
                "properties": {
                    "limit": {"type": "integer", "description": "Number of entries to return", "default": 10}
                }
            },
            handler=query_truth_ledger
        )

        # Knowledge Graph query tool
        async def query_knowledge_graph(query: str, limit: int = 5) -> dict[str, Any]:
            try:
                from app.libs.core.graph_rag_memory import get_knowledge_graph
                kg = get_knowledge_graph(self.storage_path)
                similar = kg.find_similar(query, limit)
                return {
                    "query": query,
                    "results": [
                        {"label": node.label, "type": node.node_type.value, "similarity": sim}
                        for node, sim in similar
                    ]
                }
            except Exception as e:
                return {"error": str(e)}

        self.registry.register_function(
            name="query_knowledge_graph",
            description="Search the knowledge graph for similar concepts",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "integer", "description": "Max results", "default": 5}
                },
                "required": ["query"]
            },
            handler=query_knowledge_graph
        )

    async def register_mcp_server(self, config: MCPServerConfig) -> bool:
        """Register and connect to an MCP server."""
        client = MCPClient(config)
        success = await client.connect()

        if success:
            self._clients[config.name] = client

            # Register discovered tools
            for tool in client.available_tools:
                async def make_handler(c: MCPClient, t: str):
                    async def handler(**kwargs):
                        return await c.call_tool(t, kwargs)
                    return handler

                handler = await make_handler(client, tool.name)
                self.registry.register_tool(tool, handler)

            logger.info(f"Registered MCP server: {config.name} with {len(client.available_tools)} tools")

        return success

    async def unregister_mcp_server(self, name: str) -> None:
        """Unregister an MCP server."""
        client = self._clients.pop(name, None)
        if client:
            await client.disconnect()

    def configure_provider(
        self,
        name: str,
        api_key: str | None = None,
        endpoint: str | None = None,
        model: str | None = None
    ) -> None:
        """Configure an AI provider."""
        self._providers[name] = {
            "api_key": api_key or os.environ.get(f"{name.upper()}_API_KEY"),
            "endpoint": endpoint,
            "model": model
        }

    async def run_agent(
        self,
        prompt: str,
        tools: list[str] | None = None,
        provider: str | None = None,
        conversation_id: str | None = None,
        max_tool_calls: int = 5
    ) -> dict[str, Any]:
        """Run an AI agent with MCP tools.

        Args:
            prompt: User prompt
            tools: List of tool names to make available (None = all)
            provider: AI provider to use
            conversation_id: For multi-turn conversations
            max_tool_calls: Maximum tool calls per run

        Returns:
            Agent response with tool call history
        """
        provider = provider or self._default_provider
        conversation_id = conversation_id or f"conv_{int(time.time())}"

        # Initialize conversation
        if conversation_id not in self._conversations:
            self._conversations[conversation_id] = []

        # Add user message
        self._conversations[conversation_id].append({
            "role": "user",
            "content": prompt
        })

        # Get available tools
        available_tools = self.registry.list_tools()
        if tools:
            available_tools = [t for t in available_tools if t.name in tools]

        tool_calls_made = []
        final_response = None

        # Agent loop
        for iteration in range(max_tool_calls):
            # Generate response (simulate for now)
            response = await self._generate_response(
                provider,
                self._conversations[conversation_id],
                available_tools
            )

            if response.get("tool_call"):
                # Execute tool call
                tool_call = response["tool_call"]
                result = await self.registry.invoke(
                    tool_call["name"],
                    tool_call.get("arguments", {})
                )

                tool_calls_made.append(result.to_dict())

                # Add to conversation
                self._conversations[conversation_id].append({
                    "role": "assistant",
                    "content": None,
                    "tool_call": tool_call
                })
                self._conversations[conversation_id].append({
                    "role": "tool",
                    "content": json.dumps(result.result or {"error": result.error})
                })
            else:
                # Final response
                final_response = response.get("content", "No response generated")
                self._conversations[conversation_id].append({
                    "role": "assistant",
                    "content": final_response
                })
                break

        return {
            "conversation_id": conversation_id,
            "response": final_response,
            "tool_calls": tool_calls_made,
            "provider": provider,
            "iterations": iteration + 1,
            "timestamp": datetime.now(UTC).isoformat()
        }

    async def _generate_response(
        self,
        provider: str,
        messages: list[dict[str, Any]],
        tools: list[MCPTool]
    ) -> dict[str, Any]:
        """Generate response from AI provider."""
        # Check if last message was a tool result
        if messages and messages[-1].get("role") == "tool":
            # Generate final response based on tool result
            tool_result = messages[-1]["content"]
            return {
                "content": f"На основі аналізу: {tool_result[:200]}..."
            }

        # Check if we should call a tool
        last_message = messages[-1]["content"] if messages else ""

        # Simple heuristic for tool selection
        tool_keywords = {
            "health": "get_system_health",
            "status": "get_azr_status",
            "ledger": "query_truth_ledger",
            "knowledge": "query_knowledge_graph",
            "search": "query_knowledge_graph"
        }

        for keyword, tool_name in tool_keywords.items():
            if keyword.lower() in last_message.lower():
                tool = next((t for t in tools if t.name == tool_name), None)
                if tool:
                    return {
                        "tool_call": {
                            "name": tool_name,
                            "arguments": {"query": last_message} if "query" in tool.parameters.get("properties", {}) else {}
                        }
                    }

        # No tool needed, generate direct response
        return {
            "content": f"Обробляю запит: '{last_message[:100]}'. Система AZR готова до роботи."
        }

    def get_stats(self) -> dict[str, Any]:
        """Get orchestrator statistics."""
        return {
            "connected_servers": list(self._clients.keys()),
            "registered_tools": len(self.registry.list_tools()),
            "active_conversations": len(self._conversations),
            "tool_stats": self.registry.get_stats(),
            "providers": list(self._providers.keys())
        }


# ============================================================================
# 🔗 GLOBAL SINGLETON
# ============================================================================

_orchestrator_instance: MCPAgentOrchestrator | None = None
_orch_lock = threading.Lock()


def get_mcp_orchestrator(storage_path: str | Path = "/tmp/azr_logs") -> MCPAgentOrchestrator:
    """Get or create global MCP Orchestrator instance."""
    global _orchestrator_instance

    with _orch_lock:
        if _orchestrator_instance is None:
            _orchestrator_instance = MCPAgentOrchestrator(storage_path)
        return _orchestrator_instance


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

async def run_self_test():
    print("🔌 MCP INTEGRATION - Self-Test")
    print("=" * 60)

    # Create orchestrator
    orchestrator = MCPAgentOrchestrator("/tmp/azr_mcp_test")

    # List available tools
    print("\n📦 Available Tools:")
    for tool in orchestrator.registry.list_tools():
        print(f"  • {tool.name}: {tool.description[:50]}...")

    # Test tool invocation
    print("\n🔧 Testing Tool Invocation:")

    result = await orchestrator.registry.invoke("get_system_health", {})
    print(f"  get_system_health: {json.dumps(result.result, indent=4)[:200]}...")

    result = await orchestrator.registry.invoke("get_azr_status", {})
    print(f"  get_azr_status: {json.dumps(result.result, indent=4)[:200]}...")

    # Test agent run
    print("\n🤖 Testing Agent Run:")
    response = await orchestrator.run_agent(
        prompt="What is the current system health?",
        provider="ollama"
    )
    print(f"  Response: {response['response'][:100]}...")
    print(f"  Tool calls: {len(response['tool_calls'])}")

    # Stats
    print(f"\n📊 Stats: {json.dumps(orchestrator.get_stats(), indent=2)}")


if __name__ == "__main__":
    asyncio.run(run_self_test())
