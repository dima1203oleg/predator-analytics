"""Тести для AI та Memory Layer."""

import pytest
from mcp.ai_layer.llm_client import LLMClient
from mcp.ai_layer.prompt_templates import get_prompt, SYSTEM_PROMPTS
from mcp.memory_layer.neo4j_adapter import Neo4jAdapter
from mcp.memory_layer.qdrant_adapter import QdrantAdapter
from mcp.memory_layer.memory_manager import MemoryManager


class TestLLMClient:
    """Тести LLMClient."""

    @pytest.fixture
    def llm_client(self):
        """Фікстура LLMClient."""
        return LLMClient(model="ollama/mistral", base_url="http://localhost:11434/v1")

    def test_init(self, llm_client):
        """Тест ініціалізації."""
        assert llm_client.model == "ollama/mistral"
        assert llm_client.base_url == "http://localhost:11434/v1"
        assert isinstance(llm_client.conversation_history, list)

    def test_clear_history(self, llm_client):
        """Тест очищення історії."""
        llm_client.conversation_history = [{"role": "user", "content": "test"}]
        llm_client.clear_history()
        assert len(llm_client.conversation_history) == 0

    @pytest.mark.asyncio
    async def test_get_model_info(self, llm_client):
        """Тест отримання інформації про модель."""
        info = await llm_client.get_model_info()
        assert isinstance(info, dict)

    @pytest.mark.asyncio
    async def test_complete_structure(self, llm_client):
        """Тест структури методу complete."""
        assert hasattr(llm_client, "complete")
        assert callable(llm_client.complete)

    @pytest.mark.asyncio
    async def test_analyze_code_structure(self, llm_client):
        """Тест структури методу analyze_code."""
        assert hasattr(llm_client, "analyze_code")
        assert callable(llm_client.analyze_code)

    @pytest.mark.asyncio
    async def test_generate_documentation_structure(self, llm_client):
        """Тест структури методу generate_documentation."""
        assert hasattr(llm_client, "generate_documentation")
        assert callable(llm_client.generate_documentation)

    @pytest.mark.asyncio
    async def test_refactor_code_structure(self, llm_client):
        """Тест структури методу refactor_code."""
        assert hasattr(llm_client, "refactor_code")
        assert callable(llm_client.refactor_code)


class TestPromptTemplates:
    """Тести PromptTemplates."""

    def test_system_prompts_exist(self):
        """Тест наявності системних промптів."""
        required_prompts = [
            "default",
            "code_analysis",
            "documentation",
            "code_refactoring",
            "education",
            "brainstorming",
            "code_security",
        ]
        for prompt_name in required_prompts:
            assert prompt_name in SYSTEM_PROMPTS
            assert isinstance(SYSTEM_PROMPTS[prompt_name], str)
            assert len(SYSTEM_PROMPTS[prompt_name]) > 0

    def test_get_prompt_code_analysis(self):
        """Тест отриманняPrompty для аналізу коду."""
        prompt = get_prompt("code_analysis")
        assert isinstance(prompt, str)
        assert "Python" in prompt or "аналізу" in prompt

    def test_get_prompt_documentation(self):
        """Тест отримання Prompty для документації."""
        prompt = get_prompt("documentation")
        assert isinstance(prompt, str)
        assert len(prompt) > 0


class TestNeo4jAdapter:
    """Тести Neo4jAdapter."""

    @pytest.fixture
    def neo4j_adapter(self):
        """Фікстура Neo4jAdapter."""
        return Neo4jAdapter(uri="bolt://localhost:7687", auth=("neo4j", "password"))

    def test_init(self, neo4j_adapter):
        """Тест ініціалізації."""
        assert neo4j_adapter.uri == "bolt://localhost:7687"
        assert neo4j_adapter.auth == ("neo4j", "password")

    @pytest.mark.asyncio
    async def test_connect_structure(self, neo4j_adapter):
        """Тест наявності методу connect."""
        assert hasattr(neo4j_adapter, "connect")
        assert callable(neo4j_adapter.connect)


class TestQdrantAdapter:
    """Тести QdrantAdapter."""

    @pytest.fixture
    def qdrant_adapter(self):
        """Фікстура QdrantAdapter."""
        return QdrantAdapter(url="http://localhost:6333")

    def test_init(self, qdrant_adapter):
        """Тест ініціалізації."""
        assert qdrant_adapter.url == "http://localhost:6333"

    @pytest.mark.asyncio
    async def test_connect_structure(self, qdrant_adapter):
        """Тест наявності методу connect."""
        assert hasattr(qdrant_adapter, "connect")
        assert callable(qdrant_adapter.connect)


class TestMemoryManager:
    """Тести MemoryManager."""

    @pytest.fixture
    def memory_manager(self):
        """Фікстура MemoryManager."""
        return MemoryManager(
            neo4j_uri="bolt://localhost:7687",
            neo4j_auth=("neo4j", "password"),
            qdrant_url="http://localhost:6333",
        )

    def test_init_has_adapters(self, memory_manager):
        """Тест ініціалізації має адаптери."""
        assert hasattr(memory_manager, "neo4j")
        assert hasattr(memory_manager, "qdrant")

    @pytest.mark.asyncio
    async def test_has_store_dependency_graph_method(self, memory_manager):
        """Тест наявності методу store_dependency_graph."""
        assert hasattr(memory_manager, "store_dependency_graph")
        assert callable(memory_manager.store_dependency_graph)

    @pytest.mark.asyncio
    async def test_has_search_context_method(self, memory_manager):
        """Тест наявності методу search_context."""
        assert hasattr(memory_manager, "search_context")
        assert callable(memory_manager.search_context)

    @pytest.mark.asyncio
    async def test_has_clear_memory_method(self, memory_manager):
        """Тест наявності методу clear_memory."""
        assert hasattr(memory_manager, "clear_memory")
        assert callable(memory_manager.clear_memory)

    @pytest.mark.asyncio
    async def test_has_get_memory_stats_method(self, memory_manager):
        """Тест наявності методу get_memory_stats."""
        assert hasattr(memory_manager, "get_memory_stats")
        assert callable(memory_manager.get_memory_stats)
