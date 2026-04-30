"""Тести для Decision Engine та Orchestrator."""

import pytest

from mcp.meta_controller.orchestrator import Orchestrator, WorkflowTask
from mcp.meta_controller.reasoning_engine import Decision, ReasoningEngine


# Mock LLMClient
class MockLLMClient:
    """Mock для LLMClient."""
    async def analyze_code(self, code: str, language: str = "python"):
        return {"issues": [], "score": 95}


class TestReasoningEngine:
    """Тести ReasoningEngine."""

    @pytest.fixture
    def reasoning_engine(self):
        """Фікстура ReasoningEngine."""
        llm_client = MockLLMClient()
        return ReasoningEngine(llm_client)

    def test_init(self, reasoning_engine):
        """Тест ініціалізації."""
        assert reasoning_engine.llm_client is not None
        assert isinstance(reasoning_engine.decision_history, list)

    @pytest.mark.asyncio
    async def test_analyze_code_quality_good(self, reasoning_engine):
        """Тест аналізу якісного коду."""
        file_metrics = {
            "file_path": "good_file.py",
            "maintainability_index": 85,
            "cyclomatic_complexity": 3,
            "documented_percentage": 80,
            "lines_of_code": 100,
        }

        decision = await reasoning_engine.analyze_code_quality(file_metrics)

        assert isinstance(decision, Decision)
        assert decision.confidence >= 0.7
        assert len(reasoning_engine.decision_history) == 1

    @pytest.mark.asyncio
    async def test_analyze_code_quality_poor(self, reasoning_engine):
        """Тест аналізу поганого коду."""
        file_metrics = {
            "file_path": "bad_file.py",
            "maintainability_index": 35,
            "cyclomatic_complexity": 15,
            "documented_percentage": 10,
            "lines_of_code": 500,
        }

        decision = await reasoning_engine.analyze_code_quality(file_metrics)

        assert isinstance(decision, Decision)
        assert decision.priority == 1  # Найвищий
        assert "Критичний" in decision.action

    @pytest.mark.asyncio
    async def test_analyze_security_issues(self, reasoning_engine):
        """Тест аналізу безпеки."""
        code_analysis = {
            "imports": ["os", "sys"],
            "functions": ["check_input"],
        }

        decision = await reasoning_engine.analyze_security_issues(code_analysis)

        assert isinstance(decision, Decision)
        assert decision.action == "Провести аудит безпеки"
        assert decision.priority == 1

    @pytest.mark.asyncio
    async def test_suggest_refactoring_with_cycles(self, reasoning_engine):
        """Тест пропозиції рефакторингу з циклами."""
        dependencies = {
            "nodes": {"a": {}, "b": {}, "c": {}},
            "cycles": [["a", "b", "c", "a"]],
        }

        decision = await reasoning_engine.suggest_refactoring(dependencies)

        assert isinstance(decision, Decision)
        assert "Рефакторинг архітектури" in decision.action

    def test_get_decision_history(self, reasoning_engine):
        """Тест отримання історії рішень."""
        assert len(reasoning_engine.decision_history) == 0
        reasoning_engine.decision_history.append(
            Decision(
                id="dec_1",
                action="Test",
                confidence=0.9,
                reasoning="Test reasoning",
                priority=1,
                estimated_impact="Test",
                risks=[],
            )
        )
        assert len(reasoning_engine.decision_history) == 1

    def test_clear_history(self, reasoning_engine):
        """Тест очищення історії."""
        reasoning_engine.decision_history.append(
            Decision(
                id="dec_1",
                action="Test",
                confidence=0.9,
                reasoning="Test",
                priority=1,
                estimated_impact="Test",
                risks=[],
            )
        )
        reasoning_engine.clear_history()
        assert len(reasoning_engine.decision_history) == 0


class TestOrchestrator:
    """Тести Orchestrator."""

    @pytest.fixture
    def orchestrator(self):
        """Фікстура Orchestrator."""
        return Orchestrator()

    def test_init(self, orchestrator):
        """Тест ініціалізації."""
        assert orchestrator.bus is not None
        assert orchestrator.store is not None
        assert len(orchestrator.workflows) == 0

    @pytest.mark.asyncio
    async def test_execute_workflow(self, orchestrator):
        """Тест виконання workflow'у."""
        tasks = [
            WorkflowTask(
                id="task_1",
                name="Analyze Code",
                module="code_analysis",
                params={"file": "test.py"},
            ),
            WorkflowTask(
                id="task_2",
                name="Store Results",
                module="memory",
                params={"analysis": "results"},
            ),
        ]

        result = await orchestrator.execute_workflow("test_workflow", tasks)

        assert "workflow_id" in result
        assert result["status"] == "completed"
        assert result["completed"] == 2
        assert result["failed"] == 0

    @pytest.mark.asyncio
    async def test_execute_task(self, orchestrator):
        """Тест виконання завдання."""
        task = WorkflowTask(
            id="task_1",
            name="Test Task",
            module="code_analysis",
            params={"test": "value"},
        )

        result = await orchestrator._execute_task(task)

        assert result is not None
        assert result["module"] == "code_analysis"

    def test_get_statistics(self, orchestrator):
        """Тест отримання статистики."""
        stats = orchestrator.get_statistics()

        assert "total_workflows" in stats
        assert "completed_tasks" in stats
        assert "failed_tasks" in stats
        assert "success_rate" in stats
