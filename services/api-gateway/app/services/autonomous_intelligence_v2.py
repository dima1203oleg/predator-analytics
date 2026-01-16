"""
Predator Autonomous Intelligence v2.0
Повністю автономна система з проактивним прийняттям рішень

Features:
- Predictive Analytics - передбачення проблем до їх виникнення
- Self-Learning - автоматичне покращення стратегій
- Autonomous Decision Making - прийняття рішень без людини
- Dynamic Resource Allocation - автоматичне масштабування
- Continuous Optimization - безперервне самовдосконалення
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import deque
import numpy as np
from sqlalchemy import select, text
import uuid

from libs.core.database import get_db_ctx
from libs.core.models import MLJob, DataSource
from libs.core.structured_logger import get_logger, log_business_event, log_performance

logger = get_logger("predator.autonomous_intelligence_v2")


@dataclass
class PredictiveMetrics:
    """Метрики для передбачення проблем"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    error_rate: float
    response_time: float
    throughput: float

    def to_vector(self) -> np.ndarray:
        """Конвертація в вектор для ML"""
        return np.array([
            self.cpu_usage,
            self.memory_usage,
            self.error_rate,
            self.response_time,
            self.throughput
        ])


@dataclass
class AutonomousDecision:
    """Автономне рішення системи"""
    decision_id: str
    decision_type: str  # scale_up, scale_down, optimize, restart, migrate
    confidence: float  # 0.0 - 1.0
    reasoning: str
    actions: List[Dict[str, Any]]
    expected_impact: Dict[str, float]
    timestamp: datetime = field(default_factory=datetime.utcnow)
    executed: bool = False
    success: Optional[bool] = None
    actual_impact: Optional[Dict[str, float]] = None


@dataclass
class LearningRecord:
    """Запис для самонавчання"""
    decision_id: str
    context: Dict[str, Any]
    action_taken: str
    expected_outcome: float
    actual_outcome: float
    success: bool
    timestamp: datetime = field(default_factory=datetime.utcnow)


class PredictiveAnalyzer:
    """
    Передбачає проблеми до їх виникнення
    Використовує часові ряди та аномалії
    """

    def __init__(self, history_size: int = 1000):
        self.metrics_history = deque(maxlen=history_size)
        self.anomaly_threshold = 2.5  # стандартних відхилень

    def add_metrics(self, metrics: PredictiveMetrics):
        """Додати нові метрики"""
        self.metrics_history.append(metrics)

    def predict_issues(self) -> List[Dict[str, Any]]:
        """Передбачити потенційні проблеми"""
        if len(self.metrics_history) < 10:
            return []

        predictions = []

        # Аналіз трендів
        recent = list(self.metrics_history)[-100:]

        # CPU trend
        cpu_values = [m.cpu_usage for m in recent]
        cpu_trend = self._calculate_trend(cpu_values)
        if cpu_trend > 0.1 and cpu_values[-1] > 70:  # Lowered trend threshold for better sensitivity
            predictions.append({
                "type": "cpu_overload",
                "severity": "high",
                "eta_minutes": self._estimate_time_to_threshold(cpu_values, 90),
                "current_value": cpu_values[-1],
                "threshold": 90,
                "trend": cpu_trend
            })

        # Memory trend
        mem_values = [m.memory_usage for m in recent]
        mem_trend = self._calculate_trend(mem_values)
        if mem_trend > 0.1 and mem_values[-1] > 75:  # Lowered trend threshold
            predictions.append({
                "type": "memory_leak",
                "severity": "critical",
                "eta_minutes": self._estimate_time_to_threshold(mem_values, 95),
                "current_value": mem_values[-1],
                "threshold": 95,
                "trend": mem_trend
            })

        # Error rate spike
        error_values = [m.error_rate for m in recent]
        if self._detect_anomaly(error_values):
            predictions.append({
                "type": "error_spike",
                "severity": "high",
                "current_value": error_values[-1],
                "baseline": np.mean(error_values[:-10]),
                "deviation": self._calculate_deviation(error_values)
            })

        # Response time degradation
        rt_values = [m.response_time for m in recent]
        rt_trend = self._calculate_trend(rt_values)
        if rt_trend > 0.4 and rt_values[-1] > 1000:  # >1s
            predictions.append({
                "type": "performance_degradation",
                "severity": "medium",
                "current_value": rt_values[-1],
                "baseline": np.mean(rt_values[:50]),
                "trend": rt_trend
            })

        return predictions

    def _calculate_trend(self, values: List[float]) -> float:
        """Розрахувати тренд (лінійна регресія)"""
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        y = np.array(values)
        slope = np.polyfit(x, y, 1)[0]
        # Нормалізувати slope до діапазону -1..1
        return np.tanh(slope / np.std(y) if np.std(y) > 0 else 0)

    def _detect_anomaly(self, values: List[float]) -> bool:
        """Виявити аномалію"""
        if len(values) < 10:
            return False
        baseline = values[:-5]
        recent = values[-5:]
        mean = np.mean(baseline)
        std = np.std(baseline)
        if std == 0:
            return False
        z_score = (np.mean(recent) - mean) / std
        return abs(z_score) > self.anomaly_threshold

    def _calculate_deviation(self, values: List[float]) -> float:
        """Розрахувати відхилення від базової лінії"""
        if len(values) < 10:
            return 0.0
        baseline = np.mean(values[:-10])
        current = values[-1]
        return (current - baseline) / baseline if baseline > 0 else 0.0

    def _estimate_time_to_threshold(self, values: List[float], threshold: float) -> Optional[int]:
        """Оцінити час до досягнення порогу (в хвилинах)"""
        if len(values) < 2:
            return None
        trend = self._calculate_trend(values)
        if trend <= 0:
            return None
        current = values[-1]
        if current >= threshold:
            return 0
        # Проста лінійна екстраполяція
        rate = trend * np.std(values)
        if rate <= 0:
            return None
        minutes = (threshold - current) / rate
        return int(max(1, minutes))


class SelfLearningEngine:
    """
    Двигун самонавчання
    Покращує стратегії на основі історичних результатів
    """

    def __init__(self):
        self.learning_records: List[LearningRecord] = []
        self.strategy_scores: Dict[str, List[float]] = {}

    def record_outcome(self, record: LearningRecord):
        """Записати результат рішення"""
        self.learning_records.append(record)

        # Оновити оцінку стратегії
        if record.action_taken not in self.strategy_scores:
            self.strategy_scores[record.action_taken] = []

        # Оцінка: наскільки близько до очікуваного результату (відносна точність)
        if abs(record.expected_outcome) > 0.001:
            diff_ratio = abs(record.expected_outcome - record.actual_outcome) / abs(record.expected_outcome)
            accuracy = max(0.0, 1.0 - diff_ratio)
        else:
            accuracy = 1.0 if abs(record.actual_outcome) < 0.001 else 0.0

        self.strategy_scores[record.action_taken].append(accuracy)

        # Зберігати останні 100 записів для кожної стратегії
        if len(self.strategy_scores[record.action_taken]) > 100:
            self.strategy_scores[record.action_taken] = \
                self.strategy_scores[record.action_taken][-100:]

    def get_strategy_confidence(self, strategy: str) -> float:
        """Отримати впевненість у стратегії"""
        if strategy not in self.strategy_scores:
            return 0.5  # Нейтральна впевненість для нових стратегій
        scores = self.strategy_scores[strategy]
        if not scores:
            return 0.5
        # Середня точність з вагою на останні результати
        weights = np.exp(np.linspace(-1, 0, len(scores)))
        weights /= weights.sum()
        return float(np.average(scores, weights=weights))

    def recommend_strategy(self, context: Dict[str, Any]) -> Tuple[str, float]:
        """Рекомендувати найкращу стратегію для контексту"""
        # Проста евристика: вибрати стратегію з найвищою впевненістю
        if not self.strategy_scores:
            return "default", 0.5

        best_strategy = max(
            self.strategy_scores.keys(),
            key=lambda s: self.get_strategy_confidence(s)
        )
        confidence = self.get_strategy_confidence(best_strategy)

        return best_strategy, confidence

    def get_learning_stats(self) -> Dict[str, Any]:
        """Отримати статистику навчання"""
        return {
            "total_records": len(self.learning_records),
            "strategies_learned": len(self.strategy_scores),
            "average_accuracy": np.mean([
                np.mean(scores) for scores in self.strategy_scores.values()
            ]) if self.strategy_scores else 0.0,
            "best_strategy": max(
                self.strategy_scores.keys(),
                key=lambda s: self.get_strategy_confidence(s)
            ) if self.strategy_scores else None
        }


class AutonomousDecisionMaker:
    """
    Приймає автономні рішення без людського втручання
    """

    def __init__(self, learning_engine: SelfLearningEngine):
        self.learning_engine = learning_engine
        self.min_confidence = 0.0  # FULL AUTONOMY: Always approve
        self.decision_history: List[AutonomousDecision] = []

    async def make_decision(
        self,
        predictions: List[Dict[str, Any]],
        current_state: Dict[str, Any]
    ) -> Optional[AutonomousDecision]:
        """Прийняти автономне рішення"""

        if not predictions:
            return None

        # Сортувати за серйозністю
        severity_order = {"critical": 3, "high": 2, "medium": 1, "low": 0}
        predictions.sort(
            key=lambda p: severity_order.get(p.get("severity", "low"), 0),
            reverse=True
        )

        top_prediction = predictions[0]

        # Визначити тип рішення
        decision_type = self._map_prediction_to_decision(top_prediction)

        # Отримати рекомендовану стратегію
        strategy, confidence = self.learning_engine.recommend_strategy({
            "prediction": top_prediction,
            "state": current_state
        })

        # Створити рішення
        decision = AutonomousDecision(
            decision_id=str(uuid.uuid4()),
            decision_type=decision_type,
            confidence=confidence,
            reasoning=self._generate_reasoning(top_prediction, strategy),
            actions=self._generate_actions(decision_type, top_prediction),
            expected_impact=self._estimate_impact(decision_type, top_prediction)
        )

        self.decision_history.append(decision)

        # Автоматично виконати, якщо впевненість достатня
        if confidence >= self.min_confidence:
            logger.info(
                f"🤖 AUTONOMOUS DECISION: {decision_type} "
                f"(confidence: {confidence:.2%})"
            )
            await self._execute_decision(decision)
        else:
            logger.warning(
                f"⚠️ Decision confidence too low ({confidence:.2%}), "
                f"requires manual approval"
            )

        return decision

    def _map_prediction_to_decision(self, prediction: Dict[str, Any]) -> str:
        """Відобразити передбачення на тип рішення"""
        pred_type = prediction.get("type", "")

        mapping = {
            "cpu_overload": "scale_up",
            "memory_leak": "restart",
            "error_spike": "optimize",
            "performance_degradation": "optimize"
        }

        return mapping.get(pred_type, "monitor")

    def _generate_reasoning(
        self,
        prediction: Dict[str, Any],
        strategy: str
    ) -> str:
        """Згенерувати пояснення рішення"""
        pred_type = prediction.get("type", "unknown")
        severity = prediction.get("severity", "unknown")

        return (
            f"Detected {pred_type} with {severity} severity. "
            f"Applying {strategy} strategy based on historical performance. "
            f"Current value: {prediction.get('current_value', 'N/A')}, "
            f"Threshold: {prediction.get('threshold', 'N/A')}"
        )

    def _generate_actions(
        self,
        decision_type: str,
        prediction: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Згенерувати список дій"""
        actions = []

        if decision_type == "scale_up":
            actions.append({
                "type": "increase_workers",
                "params": {"count": 2}
            })
            actions.append({
                "type": "increase_memory_limit",
                "params": {"percent": 20}
            })

        elif decision_type == "restart":
            actions.append({
                "type": "graceful_restart",
                "params": {"service": "backend"}
            })
            actions.append({
                "type": "clear_cache",
                "params": {}
            })

        elif decision_type == "optimize":
            actions.append({
                "type": "trigger_optimization",
                "params": {"level": 3}
            })
            actions.append({
                "type": "rebuild_indexes",
                "params": {}
            })

        return actions

    def _estimate_impact(
        self,
        decision_type: str,
        prediction: Dict[str, Any]
    ) -> Dict[str, float]:
        """Оцінити очікуваний вплив"""
        # Базові оцінки впливу
        impact_estimates = {
            "scale_up": {
                "cpu_reduction": 30.0,
                "response_time_improvement": 40.0,
                "cost_increase": 25.0
            },
            "restart": {
                "memory_freed": 60.0,
                "downtime_seconds": 5.0,
                "error_rate_reduction": 80.0
            },
            "optimize": {
                "performance_improvement": 25.0,
                "cpu_reduction": 15.0,
                "duration_minutes": 10.0
            }
        }

        return impact_estimates.get(decision_type, {})

    async def _execute_decision(self, decision: AutonomousDecision):
        """Виконати рішення"""
        decision.executed = True

        log_business_event(
            logger,
            "autonomous_decision_executed",
            decision_id=decision.decision_id,
            decision_type=decision.decision_type,
            confidence=decision.confidence
        )

        # Виконати кожну дію
        for action in decision.actions:
            try:
                await self._execute_action(action)
            except Exception as e:
                logger.error(f"Action execution failed: {e}")
                decision.success = False
                return

        decision.success = True

    async def _execute_action(self, action: Dict[str, Any]):
        """Виконати окрему дію"""
        action_type = action.get("type")
        params = action.get("params", {})

        logger.info(f"Executing action: {action_type} with params: {params}")

        # Тут буде реальна логіка виконання
        # Поки що симулюємо
        await asyncio.sleep(0.5)


class DynamicResourceAllocator:
    """
    Автоматичне масштабування ресурсів
    """

    def __init__(self):
        self.current_allocation = {
            "workers": 4,
            "memory_mb": 2048,
            "cpu_cores": 2
        }
        self.min_allocation = {
            "workers": 2,
            "memory_mb": 1024,
            "cpu_cores": 1
        }
        self.max_allocation = {
            "workers": 16,
            "memory_mb": 8192,
            "cpu_cores": 8
        }

    async def adjust_resources(
        self,
        metrics: PredictiveMetrics,
        prediction: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Автоматично налаштувати ресурси"""

        changes = {}

        # CPU-based scaling
        if metrics.cpu_usage > 80:
            new_cores = min(
                self.current_allocation["cpu_cores"] + 1,
                self.max_allocation["cpu_cores"]
            )
            if new_cores != self.current_allocation["cpu_cores"]:
                changes["cpu_cores"] = new_cores
                self.current_allocation["cpu_cores"] = new_cores

        elif metrics.cpu_usage < 30:
            new_cores = max(
                self.current_allocation["cpu_cores"] - 1,
                self.min_allocation["cpu_cores"]
            )
            if new_cores != self.current_allocation["cpu_cores"]:
                changes["cpu_cores"] = new_cores
                self.current_allocation["cpu_cores"] = new_cores

        # Memory-based scaling
        if metrics.memory_usage > 85:
            new_memory = min(
                int(self.current_allocation["memory_mb"] * 1.5),
                self.max_allocation["memory_mb"]
            )
            if new_memory != self.current_allocation["memory_mb"]:
                changes["memory_mb"] = new_memory
                self.current_allocation["memory_mb"] = new_memory

        # Worker scaling based on throughput
        if metrics.throughput > 100 and metrics.response_time > 1000:
            new_workers = min(
                self.current_allocation["workers"] + 2,
                self.max_allocation["workers"]
            )
            if new_workers != self.current_allocation["workers"]:
                changes["workers"] = new_workers
                self.current_allocation["workers"] = new_workers

        if changes:
            logger.info(f"🔧 Resource allocation adjusted: {changes}")
            log_business_event(
                logger,
                "resource_allocation_changed",
                changes=changes,
                reason="automatic_scaling"
            )

        return changes

    def get_allocation_status(self) -> Dict[str, Any]:
        """Отримати поточний статус розподілу"""
        return {
            "current": self.current_allocation.copy(),
            "min": self.min_allocation.copy(),
            "max": self.max_allocation.copy(),
            "utilization": {
                "workers": self.current_allocation["workers"] / self.max_allocation["workers"],
                "memory": self.current_allocation["memory_mb"] / self.max_allocation["memory_mb"],
                "cpu": self.current_allocation["cpu_cores"] / self.max_allocation["cpu_cores"]
            }
        }


class AutonomousIntelligenceV2:
    """
    Головний клас автономного інтелекту v2.0
    Координує всі підсистеми
    """

    def __init__(self):
        self.predictive_analyzer = PredictiveAnalyzer()
        self.learning_engine = SelfLearningEngine()
        self.decision_maker = AutonomousDecisionMaker(self.learning_engine)
        self.resource_allocator = DynamicResourceAllocator()

        self._is_running = False
        self._check_interval = 30  # секунд

    async def start(self):
        """Запустити автономну систему"""
        if self._is_running:
            return

        self._is_running = True
        logger.info("🧠 Autonomous Intelligence v2.0 STARTED")

        asyncio.create_task(self._main_loop())

    async def stop(self):
        """Зупинити автономну систему"""
        self._is_running = False
        logger.info("🛑 Autonomous Intelligence v2.0 STOPPED")

    async def _main_loop(self):
        """Головний цикл автономної системи"""
        while self._is_running:
            try:
                # 1. Збір метрик
                metrics = await self._collect_metrics()
                self.predictive_analyzer.add_metrics(metrics)

                # 2. Передбачення проблем
                predictions = self.predictive_analyzer.predict_issues()

                if predictions:
                    logger.info(f"🔮 Predicted {len(predictions)} potential issues")

                    # 3. Прийняття рішення
                    current_state = await self._get_current_state()
                    decision = await self.decision_maker.make_decision(
                        predictions,
                        current_state
                    )

                    # 4. Запис результату для навчання
                    if decision and decision.executed:
                        await self._record_decision_outcome(decision)

                # 5. Динамічне масштабування
                resource_changes = await self.resource_allocator.adjust_resources(
                    metrics,
                    predictions[0] if predictions else None
                )

                if resource_changes:
                    logger.info(f"📊 Resources adjusted: {resource_changes}")

            except Exception as e:
                logger.error(f"Autonomous Intelligence loop error: {e}")

            await asyncio.sleep(self._check_interval)

    async def _collect_metrics(self) -> PredictiveMetrics:
        """Зібрати поточні метрики системи"""
        # Тут буде реальний збір метрик
        # Поки що повертаємо тестові дані
        import random

        return PredictiveMetrics(
            timestamp=datetime.utcnow(),
            cpu_usage=random.uniform(40, 85),
            memory_usage=random.uniform(50, 80),
            error_rate=random.uniform(0, 5),
            response_time=random.uniform(200, 1500),
            throughput=random.uniform(50, 150)
        )

    async def _get_current_state(self) -> Dict[str, Any]:
        """Отримати поточний стан системи"""
        async with get_db_ctx() as db:
            # Кількість активних джерел
            sources_result = await db.execute(
                select(DataSource).where(DataSource.status == 'indexed')
            )
            active_sources = len(sources_result.scalars().all())

            # Кількість запущених завдань
            jobs_result = await db.execute(
                select(MLJob).where(MLJob.status == 'running')
            )
            running_jobs = len(jobs_result.scalars().all())

        return {
            "active_sources": active_sources,
            "running_jobs": running_jobs,
            "resource_allocation": self.resource_allocator.get_allocation_status()
        }

    async def _record_decision_outcome(self, decision: AutonomousDecision):
        """Записати результат рішення для навчання"""
        # Симулюємо оцінку результату
        # В реальності тут буде порівняння метрик до/після
        import random

        expected = decision.expected_impact.get("cpu_reduction", 0)
        actual = expected * random.uniform(0.7, 1.3)  # ±30% від очікуваного

        record = LearningRecord(
            decision_id=decision.decision_id,
            context={"type": decision.decision_type},
            action_taken=decision.decision_type,
            expected_outcome=expected,
            actual_outcome=actual,
            success=decision.success or False
        )

        self.learning_engine.record_outcome(record)

    def get_status(self) -> Dict[str, Any]:
        """Отримати повний статус автономної системи"""
        return {
            "is_running": self._is_running,
            "check_interval_seconds": self._check_interval,
            "predictive_analyzer": {
                "metrics_collected": len(self.predictive_analyzer.metrics_history),
                "anomaly_threshold": self.predictive_analyzer.anomaly_threshold
            },
            "learning_engine": self.learning_engine.get_learning_stats(),
            "decision_maker": {
                "total_decisions": len(self.decision_maker.decision_history),
                "min_confidence": self.decision_maker.min_confidence,
                "recent_decisions": [
                    {
                        "id": d.decision_id,
                        "type": d.decision_type,
                        "confidence": d.confidence,
                        "executed": d.executed,
                        "success": d.success
                    }
                    for d in self.decision_maker.decision_history[-5:]
                ]
            },
            "resource_allocator": self.resource_allocator.get_allocation_status()
        }


# Глобальний екземпляр
autonomous_intelligence_v2 = AutonomousIntelligenceV2()
