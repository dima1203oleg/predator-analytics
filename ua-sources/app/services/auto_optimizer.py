"""
AutoOptimizer Service - Автономне самовдосконалення платформи

Забезпечує:
- Самозцілення: виявлення та виправлення помилок
- Автоматичний fine-tuning моделей
- Оптимізацію ресурсів (витрат, латентності)
- Еволюційне покращення точності
- Автогенерацію датасетів на основі метрик
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger("service.auto_optimizer")


class MetricsAnalyzer:
    """
    Аналізує метрики з Prometheus/Grafana та визначає потребу в оптимізації.
    """
    
    # Quality gates - мінімальні пороги якості
    QUALITY_GATES = {
        "ndcg_at_10": 0.75,       # Precision для пошуку
        "avg_latency_ms": 500,     # Максимальна латентність
        "error_rate": 0.01,        # Максимум 1% помилок
        "cost_per_1k_requests": 0.50,  # Бюджет на 1К запитів
        "user_satisfaction": 4.0,  # NPS мінімум 4/5
    }
    
    def __init__(self):
        self.metrics_history: Dict[str, List[float]] = {}
        self.anomaly_threshold = 2.0  # 2 sigma
    
    async def collect_metrics(self) -> Dict[str, float]:
        """
        Збирає поточні метрики з Prometheus/Grafana.
        
        Returns:
            Dict з ключовими метриками
        """
        # TODO: Інтеграція з реальним Prometheus API
        # Placeholder для демонстрації
        metrics = {
            "ndcg_at_10": 0.82,
            "avg_latency_ms": 450,
            "error_rate": 0.005,
            "cost_per_1k_requests": 0.42,
            "user_satisfaction": 4.3,
            "etl_lag_seconds": 45,
            "index_throughput": 1200,
            "gpu_utilization": 0.65,
        }
        
        # Зберігаємо в історію
        for key, value in metrics.items():
            if key not in self.metrics_history:
                self.metrics_history[key] = []
            self.metrics_history[key].append(value)
            # Зберігаємо лише останні 100 значень
            self.metrics_history[key] = self.metrics_history[key][-100:]
        
        return metrics
    
    def detect_anomalies(self, metric_name: str, current_value: float) -> bool:
        """
        Виявляє аномалії через статистичний аналіз (z-score).
        
        Args:
            metric_name: Назва метрики
            current_value: Поточне значення
        
        Returns:
            True якщо виявлено аномалію
        """
        if metric_name not in self.metrics_history or len(self.metrics_history[metric_name]) < 10:
            return False
        
        history = self.metrics_history[metric_name]
        mean = np.mean(history)
        std = np.std(history)
        
        if std == 0:
            return False
        
        z_score = abs((current_value - mean) / std)
        
        if z_score > self.anomaly_threshold:
            logger.warning(f"Anomaly detected in {metric_name}: {current_value} (z-score: {z_score:.2f})")
            return True
        
        return False
    
    def check_quality_gates(self, metrics: Dict[str, float]) -> List[str]:
        """
        Перевіряє чи метрики відповідають quality gates.
        
        Returns:
            Список назв метрик, що не проходять gates
        """
        failed = []
        
        for metric, threshold in self.QUALITY_GATES.items():
            if metric not in metrics:
                continue
            
            current_value = metrics[metric]
            
            # Для латентності та помилок - менше краще
            if metric in ["avg_latency_ms", "error_rate", "cost_per_1k_requests"]:
                if current_value > threshold:
                    failed.append(metric)
                    logger.warning(f"Quality gate failed: {metric} = {current_value} > {threshold}")
            else:
                # Для точності - більше краще
                if current_value < threshold:
                    failed.append(metric)
                    logger.warning(f"Quality gate failed: {metric} = {current_value} < {threshold}")
        
        return failed


class AutoOptimizer:
    """
    Головний сервіс автономного самовдосконалення.
    
    Cycle: Monitor → Analyze → Fix → Optimize → Validate → Repeat
    """
    
    def __init__(self):
        self.analyzer = MetricsAnalyzer()
        self.optimization_history: List[Dict[str, Any]] = []
        self.is_running = False
    
    async def start_optimization_loop(self, interval_minutes: int = 15):
        """
        Запускає безкінечний цикл оптимізації.
        
        Args:
            interval_minutes: Інтервал між перевірками
        """
        self.is_running = True
        logger.info(f"AutoOptimizer started with {interval_minutes}min interval")
        
        while self.is_running:
            try:
                await self.run_optimization_cycle()
            except Exception as e:
                logger.error(f"Optimization cycle failed: {e}")
            
            # Чекаємо до наступного циклу
            await asyncio.sleep(interval_minutes * 60)
    
    async def run_optimization_cycle(self):
        """
        Виконує один цикл самовдосконалення.
        
        Steps:
        1. Collect metrics
        2. Detect problems
        3. Auto-fix errors
        4. Trigger optimizations
        5. Log actions
        """
        logger.info("=== Starting optimization cycle ===")
        
        # 1. Збираємо метрики
        metrics = await self.analyzer.collect_metrics()
        logger.info(f"Collected metrics: {metrics}")
        
        # 2. Перевіряємо quality gates
        failed_gates = self.analyzer.check_quality_gates(metrics)
        
        # 3. Виявляємо аномалії
        anomalies = []
        for metric_name, value in metrics.items():
            if self.analyzer.detect_anomalies(metric_name, value):
                anomalies.append(metric_name)
        
        # 4. Самозцілення
        if failed_gates or anomalies:
            await self.self_heal(metrics, failed_gates, anomalies)
        
        # 5. Проактивна оптимізація
        await self.proactive_optimize(metrics)
        
        logger.info("=== Optimization cycle complete ===")
    
    async def self_heal(self, metrics: Dict[str, float], failed_gates: List[str], anomalies: List[str]):
        """
        Автоматичне виправлення виявлених проблем.
        
        Args:
            metrics: Поточні метрики
            failed_gates: Метрики, що не пройшли gates
            anomalies: Виявлені аномалії
        """
        logger.info(f"Self-healing triggered: gates={failed_gates}, anomalies={anomalies}")
        
        actions = []
        
        # Проблема: Висока латентність
        if "avg_latency_ms" in failed_gates:
            latency = metrics["avg_latency_ms"]
            if latency > 800:
                # Критично - збільшуємо ресурси
                actions.append({
                    "type": "scale_pods",
                    "target": "backend",
                    "replicas": 3,
                    "reason": f"High latency: {latency}ms"
                })
                logger.warning(f"Scaling backend pods due to high latency: {latency}ms")
            elif latency > 500:
                # Помірно - оптимізуємо модель
                actions.append({
                    "type": "optimize_model",
                    "target": "reranker",
                    "method": "quantization",
                    "reason": f"Moderate latency: {latency}ms"
                })
        
        # Проблема: Низька точність пошуку
        if "ndcg_at_10" in failed_gates:
            ndcg = metrics["ndcg_at_10"]
            actions.append({
                "type": "retrain_model",
                "target": "reranker",
                "dataset": "augmented_latest",
                "reason": f"Low NDCG: {ndcg}"
            })
            logger.warning(f"Triggering reranker retraining due to low NDCG: {ndcg}")
            
            # Додатково генеруємо нові приклади
            actions.append({
                "type": "generate_dataset",
                "method": "augmentation",
                "count": 5000,
                "reason": "Boost training data quality"
            })
        
        # Проблема: Високі витрати
        if "cost_per_1k_requests" in failed_gates:
            cost = metrics["cost_per_1k_requests"]
            if cost > 0.75:
                # Дуже дорого - зменшуємо розмір моделі
                actions.append({
                    "type": "optimize_model",
                    "target": "summarizer",
                    "method": "distillation",
                    "reason": f"High cost: ${cost}"
                })
        
        # Проблема: ETL лаг
        if metrics.get("etl_lag_seconds", 0) > 60:
            actions.append({
                "type": "optimize_etl",
                "action": "increase_workers",
                "count": 2,
                "reason": f"ETL lag: {metrics['etl_lag_seconds']}s"
            })
        
        # Виконуємо дії
        for action in actions:
            await self.execute_action(action)
            self.optimization_history.append({
                "timestamp": datetime.now().isoformat(),
                "action": action,
                "metrics": metrics.copy()
            })
    
    async def proactive_optimize(self, metrics: Dict[str, float]):
        """
        Проактивна оптимізація навіть без проблем.
        
        Шукає можливості для покращення:
        - Fine-tuning на нових даних
        - A/B тести нових моделей
        - Адаптація під usage patterns
        """
        # Якщо є нові дані (>10k нових документів), перетреновуємо embeddings
        # TODO: Перевірка реальної кількості нових документів
        
        # Періодичний fine-tuning (раз на тиждень)
        last_training = self._get_last_training_time()
        if (datetime.now() - last_training).days >= 7:
            logger.info("Scheduled fine-tuning triggered (weekly)")
            await self.execute_action({
                "type": "scheduled_training",
                "target": "all_models",
                "reason": "Weekly maintenance"
            })
        
        # Якщо GPU недовикористовується, запускаємо експерименти
        if metrics.get("gpu_utilization", 1.0) < 0.5:
            logger.info("Low GPU utilization - triggering experiments")
            await self.execute_action({
                "type": "ab_test",
                "variants": ["baseline", "fine_tuned_v2"],
                "metric": "ndcg_at_10",
                "reason": "Experimental optimization"
            })
    
    async def execute_action(self, action: Dict[str, Any]):
        """
        Виконує автоматизовану дію.
        
        Args:
            action: Опис дії (type, target, parameters)
        """
        action_type = action["type"]
        
        logger.info(f"Executing action: {action}")
        
        if action_type == "scale_pods":
            # Викликаємо kubectl scale або ArgoCD API
            # kubectl scale deployment/backend --replicas={action['replicas']}
            logger.info(f"Scaling {action['target']} to {action['replicas']} replicas")
            # TODO: Реальна інтеграція
        
        elif action_type == "retrain_model":
            # Тригер для H2O LLM Studio або MLflow
            logger.info(f"Starting retraining for {action['target']}")
            # TODO: HTTP request до H2O API
        
        elif action_type == "generate_dataset":
            # Викликаємо DataAugmentor
            from app.services.ml import get_augmentor
            augmentor = get_augmentor()
            logger.info(f"Generating {action['count']} synthetic examples")
            # TODO: Виклик augmentor.augment_dataset
        
        elif action_type == "optimize_model":
            # Запускаємо quantization/distillation
            logger.info(f"Optimizing {action['target']} with {action['method']}")
            # TODO: Model optimization pipeline
        
        elif action_type == "ab_test":
            # Створюємо A/B тест через feature flags
            logger.info(f"Starting A/B test: {action['variants']}")
            # TODO: Оновлення feature_flags в БД
        
        else:
            logger.warning(f"Unknown action type: {action_type}")
    
    def _get_last_training_time(self) -> datetime:
        """Отримує час останнього тренування з MLflow."""
        # TODO: Query MLflow API
        # Placeholder - повертаємо 8 днів тому для тригера
        return datetime.now() - timedelta(days=8)
    
    def get_optimization_report(self) -> Dict[str, Any]:
        """
        Генерує звіт про автоматичні оптимізації.
        
        Returns:
            Статистика оптимізацій за останні 24 год
        """
        recent = [
            opt for opt in self.optimization_history
            if datetime.fromisoformat(opt["timestamp"]) > datetime.now() - timedelta(hours=24)
        ]
        
        return {
            "total_optimizations_24h": len(recent),
            "actions_by_type": self._group_by_type(recent),
            "last_cycle": recent[-1] if recent else None,
            "quality_gates_status": "passing",  # TODO: Real check
            "next_cycle_in_minutes": 15
        }
    
    def _group_by_type(self, optimizations: List[Dict]) -> Dict[str, int]:
        """Групує оптимізації за типом."""
        counts = {}
        for opt in optimizations:
            action_type = opt["action"]["type"]
            counts[action_type] = counts.get(action_type, 0) + 1
        return counts


# Singleton
_auto_optimizer: Optional[AutoOptimizer] = None


def get_auto_optimizer() -> AutoOptimizer:
    """Get AutoOptimizer singleton."""
    global _auto_optimizer
    if _auto_optimizer is None:
        _auto_optimizer = AutoOptimizer()
    return _auto_optimizer
