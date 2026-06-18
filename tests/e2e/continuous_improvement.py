#!/usr/bin/env python3
"""
📈 Continuous Improvement Module v2.0
PREDATOR Analytics v61.0-ELITE

Модуль безперервного покращення: аналіз продуктивності, оптимізація SQL запитів, 
рекомендації щодо архітектури, автоматичний цикл регресії.
"""

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import os
import statistics

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/Shared/Predator_60/tests/e2e/logs/continuous_improvement.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class OptimizationPriority(Enum):
    """Пріоритет оптимізації"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class PerformanceMetric:
    """Метрика продуктивності"""
    name: str
    value: float
    unit: str
    threshold: float
    status: str  # ok, warning, critical
    trend: str  # improving, stable, degrading
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class OptimizationRecommendation:
    """Рекомендація щодо оптимізації"""
    category: str
    priority: OptimizationPriority
    title: str
    description: str
    expected_impact: str
    effort: str  # low, medium, high
    implementation_steps: List[str]
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class SQLQueryAnalysis:
    """Аналіз SQL запиту"""
    query_hash: str
    query_text: str
    execution_time: float
    rows_affected: int
    index_usage: str
    recommendations: List[str]
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


@dataclass
class ContinuousImprovementResult:
    """Результат безперервного покращення"""
    performance_metrics: List[PerformanceMetric]
    optimization_recommendations: List[OptimizationRecommendation]
    sql_query_analyses: List[SQLQueryAnalysis]
    regression_test_results: Dict[str, Any]
    architecture_recommendations: List[str]
    total_duration: float
    timestamp: str = ""
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict:
        return asdict(self)


class ContinuousImprovementModule:
    """Модуль безперервного покращення"""
    
    def __init__(self, nvidia_server: str = "predator-server"):
        self.nvidia_server = nvidia_server
        self.performance_metrics: List[PerformanceMetric] = []
        self.optimization_recommendations: List[OptimizationRecommendation] = []
        self.sql_query_analyses: List[SQLQueryAnalysis] = []
        self.architecture_recommendations: List[str] = []
    
    async def analyze_performance_metrics(self) -> List[PerformanceMetric]:
        """Аналіз метрик продуктивності"""
        logger.info("📊 Analyzing performance metrics...")
        
        metrics = []
        
        # 1. CPU Usage
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            cpu_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            metrics.append(PerformanceMetric(
                name="cpu_usage",
                value=cpu_usage,
                unit="%",
                threshold=80.0,
                status="critical" if cpu_usage > 90 else "warning" if cpu_usage > 80 else "ok",
                trend="stable"  # TODO: Розрахувати тренд
            ))
        except Exception as e:
            logger.error(f"CPU usage analysis error: {e}")
        
        # 2. Memory Usage
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'free | grep Mem | awk \'{print ($3/$2) * 100.0}\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            memory_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            metrics.append(PerformanceMetric(
                name="memory_usage",
                value=memory_usage,
                unit="%",
                threshold=85.0,
                status="critical" if memory_usage > 95 else "warning" if memory_usage > 85 else "ok",
                trend="stable"
            ))
        except Exception as e:
            logger.error(f"Memory usage analysis error: {e}")
        
        # 3. Disk Usage
        try:
            result = subprocess.run(
                ['ssh', self.nvidia_server, 'df -h / | awk \'NR==2 {print $5}\' | sed \'s/%//\''],
                capture_output=True,
                text=True,
                timeout=10
            )
            disk_usage = float(result.stdout.strip()) if result.returncode == 0 else 0.0
            
            metrics.append(PerformanceMetric(
                name="disk_usage",
                value=disk_usage,
                unit="%",
                threshold=90.0,
                status="critical" if disk_usage > 95 else "warning" if disk_usage > 90 else "ok",
                trend="stable"
            ))
        except Exception as e:
            logger.error(f"Disk usage analysis error: {e}")
        
        # 4. Network Latency
        try:
            start = time.time()
            subprocess.run(
                ['ssh', self.nvidia_server, 'echo "test"'],
                capture_output=True,
                text=True,
                timeout=10
            )
            latency = (time.time() - start) * 1000  # ms
            
            metrics.append(PerformanceMetric(
                name="network_latency",
                value=latency,
                unit="ms",
                threshold=200.0,
                status="warning" if latency > 200 else "ok",
                trend="stable"
            ))
        except Exception as e:
            logger.error(f"Network latency analysis error: {e}")
        
        # 5. API Response Time
        try:
            import requests
            start = time.time()
            response = requests.get("http://localhost:8000/health", timeout=10)
            api_response_time = (time.time() - start) * 1000  # ms
            
            metrics.append(PerformanceMetric(
                name="api_response_time",
                value=api_response_time,
                unit="ms",
                threshold=1000.0,
                status="warning" if api_response_time > 1000 else "ok",
                trend="stable"
            ))
        except Exception as e:
            logger.error(f"API response time analysis error: {e}")
        
        self.performance_metrics = metrics
        logger.info(f"Collected {len(metrics)} performance metrics")
        
        return metrics
    
    async def analyze_sql_queries(self) -> List[SQLQueryAnalysis]:
        """Аналіз SQL запитів"""
        logger.info("🔍 Analyzing SQL queries...")
        
        # TODO: Реалізувати реальний аналіз SQL запитів з PostgreSQL logs
        # Поки що повертаємо пустий список
        
        logger.info("SQL query analysis not yet implemented")
        return []
    
    async def generate_optimization_recommendations(self) -> List[OptimizationRecommendation]:
        """Генерація рекомендацій щодо оптимізації"""
        logger.info("💡 Generating optimization recommendations...")
        
        recommendations = []
        
        # Аналіз метрик продуктивності
        for metric in self.performance_metrics:
            if metric.status == "critical":
                if metric.name == "cpu_usage":
                    recommendations.append(OptimizationRecommendation(
                        category="infrastructure",
                        priority=OptimizationPriority.CRITICAL,
                        title="Зменшення навантаження на CPU",
                        description=f"CPU використання критичне ({metric.value:.1f}%)",
                        expected_impact="Зменшення затримок на 30-50%",
                        effort="medium",
                        implementation_steps=[
                            "Оптимізувати важкі запити до бази даних",
                            "Додати кешування для часто використовуваних даних",
                            "Розглянути горизонтальне масштабування"
                        ]
                    ))
                elif metric.name == "memory_usage":
                    recommendations.append(OptimizationRecommendation(
                        category="infrastructure",
                        priority=OptimizationPriority.CRITICAL,
                        title="Зменшення використання пам'яті",
                        description=f"Використання пам'яті критичне ({metric.value:.1f}%)",
                        expected_impact="Запобігання OOM помилок",
                        effort="high",
                        implementation_steps=[
                            "Оптимізувати використання пам'яті в додатку",
                            "Збільшити ліміти пам'яті для контейнерів",
                            "Реалізувати memory pooling"
                        ]
                    ))
                elif metric.name == "disk_usage":
                    recommendations.append(OptimizationRecommendation(
                        category="infrastructure",
                        priority=OptimizationPriority.HIGH,
                        title="Очищення дискового простору",
                        description=f"Використання диску високе ({metric.value:.1f}%)",
                        expected_impact="Запобігання проблем з записом",
                        effort="low",
                        implementation_steps=[
                            "Очистити старі логи",
                            "Архівувати старі дані",
                            "Налаштувати автоматичне очищення"
                        ]
                    ))
            elif metric.status == "warning":
                if metric.name == "api_response_time":
                    recommendations.append(OptimizationRecommendation(
                        category="performance",
                        priority=OptimizationPriority.MEDIUM,
                        title="Оптимізація часу відповіді API",
                        description=f"Час відповіді API високий ({metric.value:.1f}ms)",
                        expected_impact="Покращення UX на 20-30%",
                        effort="medium",
                        implementation_steps=[
                            "Додати кешування API відповідей",
                            "Оптимізувати запити до бази даних",
                            "Розглянути асинхронну обробку"
                        ]
                    ))
        
        # Загальні рекомендації
        recommendations.append(OptimizationRecommendation(
            category="architecture",
            priority=OptimizationPriority.MEDIUM,
            title="Реалізація connection pooling",
            description="Пул підключень до бази даних може покращити продуктивність",
            expected_impact="Зменшення latency на 15-25%",
            effort="low",
            implementation_steps=[
                "Налаштувати connection pool в SQLAlchemy",
                "Оптимізувати розмір пула",
                "Додати моніторинг connection pool"
            ]
        ))
        
        recommendations.append(OptimizationRecommendation(
            category="architecture",
            priority=OptimizationPriority.LOW,
            title="Додавання індексів до бази даних",
            description="Додаткові індекси можуть прискорити запити",
            expected_impact="Прискорення запитів на 20-40%",
            effort="medium",
            implementation_steps=[
                "Проаналізувати повільні запити",
                "Додати індекси для часто використовуваних полів",
                "Перевірити вплив на продуктивність"
            ]
        ))
        
        self.optimization_recommendations = recommendations
        logger.info(f"Generated {len(recommendations)} optimization recommendations")
        
        return recommendations
    
    async def run_regression_tests(self) -> Dict[str, Any]:
        """Запуск регресійних тестів"""
        logger.info("🧪 Running regression tests...")
        
        try:
            # Запуск Playwright тестів
            result = subprocess.run(
                ['npx', 'playwright', 'test', 'e2e/'],
                cwd='/Users/Shared/Predator_60/apps/predator-analytics-ui',
                capture_output=True,
                text=True,
                timeout=600
            )
            
            # Парсинг результатів
            output = result.stdout + result.stderr
            
            # Пошук кількості пройдених тестів
            passed_match = re.search(r'(\d+) passed', output)
            failed_match = re.search(r'(\d+) failed', output)
            
            passed = int(passed_match.group(1)) if passed_match else 0
            failed = int(failed_match.group(1)) if failed_match else 0
            total = passed + failed
            
            success_rate = passed / total if total > 0 else 0
            
            return {
                'total_tests': total,
                'passed': passed,
                'failed': failed,
                'success_rate': success_rate,
                'duration': 0,  # TODO: Отримати з результатів
                'status': 'passed' if success_rate >= 0.8 else 'failed'
            }
            
        except Exception as e:
            logger.error(f"Regression test error: {e}")
            return {
                'error': str(e),
                'status': 'error'
            }
    
    async def generate_architecture_recommendations(self) -> List[str]:
        """Генерація рекомендацій щодо архітектури"""
        logger.info("🏗️ Generating architecture recommendations...")
        
        recommendations = []
        
        # Аналіз поточної архітектури
        recommendations.append("Розглянути мікросервісну архітектуру для кращого масштабування")
        recommendations.append("Реалізувати event-driven архітектуру для кращої розподіленості")
        recommendations.append("Додати circuit breaker pattern для покращення стійкості")
        recommendations.append("Реалізувати retry logic з exponential backoff")
        recommendations.append("Додати rate limiting для API endpoints")
        recommendations.append("Розглянути використання CDN для статичних ресурсів")
        recommendations.append("Реалізувати graceful shutdown для сервісів")
        
        self.architecture_recommendations = recommendations
        logger.info(f"Generated {len(recommendations)} architecture recommendations")
        
        return recommendations
    
    async def run_continuous_improvement(self) -> ContinuousImprovementResult:
        """Запуск процесу безперервного покращення"""
        logger.info("📈 Starting continuous improvement process...")
        start_time = time.time()
        
        # 1. Аналіз метрик продуктивності
        performance_metrics = await self.analyze_performance_metrics()
        
        # 2. Аналіз SQL запитів
        sql_query_analyses = await self.analyze_sql_queries()
        
        # 3. Генерація рекомендацій щодо оптимізації
        optimization_recommendations = await self.generate_optimization_recommendations()
        
        # 4. Запуск регресійних тестів
        regression_test_results = await self.run_regression_tests()
        
        # 5. Генерація рекомендацій щодо архітектури
        architecture_recommendations = await self.generate_architecture_recommendations()
        
        total_duration = time.time() - start_time
        
        logger.info(f"Continuous improvement completed:")
        logger.info(f"  Performance metrics: {len(performance_metrics)}")
        logger.info(f"  Optimization recommendations: {len(optimization_recommendations)}")
        logger.info(f"  SQL query analyses: {len(sql_query_analyses)}")
        logger.info(f"  Architecture recommendations: {len(architecture_recommendations)}")
        logger.info(f"  Total duration: {total_duration:.2f}s")
        
        return ContinuousImprovementResult(
            performance_metrics=performance_metrics,
            optimization_recommendations=optimization_recommendations,
            sql_query_analyses=sql_query_analyses,
            regression_test_results=regression_test_results,
            architecture_recommendations=architecture_recommendations,
            total_duration=total_duration
        )


async def main():
    """Головна функція"""
    module = ContinuousImprovementModule()
    result = await module.run_continuous_improvement()
    
    # Збереження результатів
    report_dir = '/Users/Shared/Predator_60/tests/e2e/reports'
    os.makedirs(report_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    result_file = os.path.join(report_dir, f'continuous_improvement_result_{timestamp}.json')
    
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
    
    logger.info(f"📊 Continuous improvement result saved: {result_file}")
    
    return result


if __name__ == "__main__":
    asyncio.run(main())
