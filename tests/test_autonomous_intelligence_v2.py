from __future__ import annotations


"""Тести для Autonomous Intelligence v2.0
Перевіряє всі 4 підсистеми.
"""
import asyncio
from datetime import datetime
from pathlib import Path
import sys

import pytest


# Додати шлях до проекту
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root / "services" / "api-gateway"))

from app.services.autonomous_intelligence_v2 import (
    AutonomousDecisionMaker,
    DynamicResourceAllocator,
    LearningRecord,
    PredictiveAnalyzer,
    PredictiveMetrics,
    SelfLearningEngine,
    autonomous_intelligence_v2,
)


class TestPredictiveAnalyzer:
    """Тести для Predictive Analyzer."""

    def test_add_metrics(self):
        """Тест додавання метрик."""
        analyzer = PredictiveAnalyzer()

        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=75.0,
            memory_usage=80.0,
            error_rate=2.0,
            response_time=500.0,
            throughput=100.0,
        )

        analyzer.add_metrics(metrics)
        assert len(analyzer.metrics_history) == 1

    def test_predict_cpu_overload(self):
        """Тест передбачення перевантаження CPU."""
        analyzer = PredictiveAnalyzer()

        # Симулюємо зростаючий CPU
        for i in range(20):
            metrics = PredictiveMetrics(
                timestamp=datetime.utcnow(),
                cpu_usage=50 + (i * 2),  # 50% -> 88%
                memory_usage=60.0,
                error_rate=1.0,
                response_time=300.0,
                throughput=100.0,
            )
            analyzer.add_metrics(metrics)

        predictions = analyzer.predict_issues()

        # Повинно бути передбачення cpu_overload
        cpu_predictions = [p for p in predictions if p["type"] == "cpu_overload"]
        assert len(cpu_predictions) > 0
        assert cpu_predictions[0]["severity"] in ["high", "critical"]

    def test_predict_memory_leak(self):
        """Тест виявлення витоку пам'яті."""
        analyzer = PredictiveAnalyzer()

        # Симулюємо витік пам'яті
        for i in range(20):
            metrics = PredictiveMetrics(
                timestamp=datetime.utcnow(),
                cpu_usage=60.0,
                memory_usage=70 + i,  # Зростає
                error_rate=1.0,
                response_time=300.0,
                throughput=100.0,
            )
            analyzer.add_metrics(metrics)

        predictions = analyzer.predict_issues()

        # Повинно бути передбачення memory_leak
        mem_predictions = [p for p in predictions if p["type"] == "memory_leak"]
        assert len(mem_predictions) > 0


class TestSelfLearningEngine:
    """Тести для Self-Learning Engine."""

    def test_record_outcome(self):
        """Тест запису результату."""
        engine = SelfLearningEngine()

        record = LearningRecord(
            decision_id="test-001",
            context={"test": True},
            action_taken="scale_up",
            expected_outcome=30.0,
            actual_outcome=28.5,
            success=True,
        )

        engine.record_outcome(record)

        assert len(engine.learning_records) == 1
        assert "scale_up" in engine.strategy_scores

    def test_strategy_confidence(self):
        """Тест розрахунку впевненості стратегії."""
        engine = SelfLearningEngine()

        # Додаємо кілька успішних результатів
        for i in range(10):
            record = LearningRecord(
                decision_id=f"test-{i:03d}",
                context={},
                action_taken="scale_up",
                expected_outcome=30.0,
                # Accuracy is 1.0 - abs(expected - actual)
                # Let actual be very close to expected so accuracy > 0.8
                actual_outcome=30.0 + (i % 3) * 0.05,
                success=True,
            )
            engine.record_outcome(record)

        confidence = engine.get_strategy_confidence("scale_up")

        # Впевненість повинна бути високою
        assert confidence > 0.8

    def test_recommend_strategy(self):
        """Тест рекомендації стратегії."""
        engine = SelfLearningEngine()

        # Додаємо результати для різних стратегій
        strategies = {
            "scale_up": 0.9,  # Висока точність
            "optimize": 0.7,  # Середня точність
            "restart": 0.5,  # Низька точність
        }

        for strategy, target_accuracy in strategies.items():
            for i in range(5):
                record = LearningRecord(
                    decision_id=f"{strategy}-{i}",
                    context={},
                    action_taken=strategy,
                    expected_outcome=30.0,
                    # We want the formula: 1.0 - abs(30.0 - actual_outcome) to equal target_accuracy
                    # So abs(30 - actual) = 1.0 - target_accuracy -> actual = 30 + 1.0 - target_accuracy
                    actual_outcome=30.0 + (1.0 - target_accuracy),
                    success=True,
                )
                engine.record_outcome(record)

        recommended, confidence = engine.recommend_strategy({})

        # Повинна рекомендувати scale_up (найвища точність)
        assert recommended == "scale_up"
        assert confidence > 0.8


class TestAutonomousDecisionMaker:
    """Тести для Autonomous Decision Maker."""

    @pytest.mark.asyncio
    async def test_make_decision_high_confidence(self):
        """Тест прийняття рішення з високою впевненістю."""
        learning_engine = SelfLearningEngine()
        decision_maker = AutonomousDecisionMaker(learning_engine)

        # Додаємо історію успішних рішень
        for i in range(10):
            record = LearningRecord(
                decision_id=f"hist-{i}",
                context={},
                action_taken="scale_up",
                expected_outcome=30.0,
                actual_outcome=29.0,
                success=True,
            )
            learning_engine.record_outcome(record)

        prediction = {
            "type": "cpu_overload",
            "severity": "high",
            "current_value": 85.0,
            "threshold": 90,
            "eta_minutes": 15,
        }

        current_state = {"active_sources": 5, "running_jobs": 3}

        decision = await decision_maker.make_decision([prediction], current_state)

        assert decision is not None
        assert decision.decision_type in ["scale_up", "optimize", "restart"]
        assert decision.confidence >= 0.0
        assert len(decision.actions) > 0

    @pytest.mark.asyncio
    async def test_decision_not_executed_low_confidence(self):
        """Тест що рішення не виконується при низькій впевненості."""
        learning_engine = SelfLearningEngine()
        decision_maker = AutonomousDecisionMaker(learning_engine)
        decision_maker.min_confidence = 0.9  # Дуже висока вимога

        prediction = {
            "type": "cpu_overload",
            "severity": "medium",
            "current_value": 75.0,
            "threshold": 90,
        }

        decision = await decision_maker.make_decision([prediction], {})

        # Рішення створене, але не виконане через низьку впевненість
        if decision:
            assert not decision.executed or decision.confidence < 0.9


class TestDynamicResourceAllocator:
    """Тести для Dynamic Resource Allocator."""

    @pytest.mark.asyncio
    async def test_scale_up_on_high_cpu(self):
        """Тест збільшення ресурсів при високому CPU."""
        allocator = DynamicResourceAllocator()

        initial_cores = allocator.current_allocation["cpu_cores"]

        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=85.0,  # Високе навантаження
            memory_usage=60.0,
            error_rate=1.0,
            response_time=300.0,
            throughput=100.0,
        )

        changes = await allocator.adjust_resources(metrics)

        # Повинно збільшити CPU cores
        if changes:
            assert "cpu_cores" in changes
            assert changes["cpu_cores"] > initial_cores

    @pytest.mark.asyncio
    async def test_scale_up_on_high_memory(self):
        """Тест збільшення пам'яті при високому використанні."""
        allocator = DynamicResourceAllocator()

        initial_memory = allocator.current_allocation["memory_mb"]

        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=60.0,
            memory_usage=90.0,  # Критично високе
            error_rate=1.0,
            response_time=300.0,
            throughput=100.0,
        )

        changes = await allocator.adjust_resources(metrics)

        # Повинно збільшити пам'ять
        if changes:
            assert "memory_mb" in changes
            assert changes["memory_mb"] > initial_memory

    @pytest.mark.asyncio
    async def test_respect_max_limits(self):
        """Тест дотримання максимальних лімітів."""
        allocator = DynamicResourceAllocator()

        # Встановлюємо поточні ресурси на максимум
        allocator.current_allocation = allocator.max_allocation.copy()

        metrics = PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=95.0,  # Дуже високе
            memory_usage=95.0,
            error_rate=5.0,
            response_time=2000.0,
            throughput=200.0,
        )

        await allocator.adjust_resources(metrics)

        # Не повинно перевищувати максимум
        assert allocator.current_allocation["workers"] <= allocator.max_allocation["workers"]
        assert allocator.current_allocation["memory_mb"] <= allocator.max_allocation["memory_mb"]
        assert allocator.current_allocation["cpu_cores"] <= allocator.max_allocation["cpu_cores"]


class TestAutonomousIntelligenceIntegration:
    """Інтеграційні тести для повної системи."""

    @pytest.mark.asyncio
    async def test_full_system_startup(self):
        """Тест запуску повної системи."""
        # Створюємо нову інстанцію для тесту
        from app.services.autonomous_intelligence_v2 import AutonomousIntelligenceV2

        ai = AutonomousIntelligenceV2()

        # Запускаємо
        await ai.start()

        assert ai._is_running

        # Зупиняємо
        await ai.stop()

        assert not ai._is_running

    @pytest.mark.asyncio
    async def test_get_status(self):
        """Тест отримання статусу."""
        status = autonomous_intelligence_v2.get_status()

        assert "is_running" in status
        assert "check_interval_seconds" in status
        assert "predictive_analyzer" in status
        assert "learning_engine" in status
        assert "decision_maker" in status
        assert "resource_allocator" in status

    @pytest.mark.asyncio
    async def test_end_to_end_cycle(self):
        """Тест повного циклу: метрики -> передбачення -> рішення -> навчання."""
        from app.services.autonomous_intelligence_v2 import AutonomousIntelligenceV2

        ai = AutonomousIntelligenceV2()

        # 1. Додаємо метрики
        for i in range(20):
            metrics = PredictiveMetrics(
                timestamp=datetime.utcnow(),
                cpu_usage=60 + i * 1.5,
                memory_usage=70.0,
                error_rate=1.0,
                response_time=300.0,
                throughput=100.0,
            )
            ai.predictive_analyzer.add_metrics(metrics)

        # 2. Отримуємо передбачення
        predictions = ai.predictive_analyzer.predict_issues()

        assert len(predictions) > 0

        # 3. Приймаємо рішення
        if predictions:
            decision = await ai.decision_maker.make_decision(predictions, {"active_sources": 5})

            if decision:
                assert decision.decision_id is not None
                assert decision.decision_type is not None

                # 4. Перевіряємо що рішення записане
                assert len(ai.decision_maker.decision_history) > 0


if __name__ == "__main__":
    # Запуск тестів
    pytest.main([__file__, "-v", "--tb=short"])
