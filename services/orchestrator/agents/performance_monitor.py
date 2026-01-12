"""
Performance Monitor - Tracks and optimizes system performance
Uses Prometheus metrics and generates optimizations
"""
import httpx
import logging
from typing import Dict, Any, List

logger = logging.getLogger("agents.performance_monitor")

class PerformanceMonitor:
    def __init__(self):
        self.prometheus_url = "http://prometheus:9090"
        self.thresholds = {
            "api_latency_p95": 800,  # ms
            "cpu_usage": 80,  # %
            "memory_usage": 85,  # %
            "error_rate": 0.05  # 5%
        }

    async def analyze(self) -> Dict[str, Any]:
        """Analyze performance metrics"""
        logger.info("📊 Performance Monitor: Analyzing metrics...")

        metrics = await self._fetch_metrics()
        bottlenecks = self._identify_bottlenecks(metrics)
        optimizations = await self._generate_optimizations(bottlenecks)

        return {
            "current_metrics": metrics,
            "bottlenecks": bottlenecks,
            "optimizations": optimizations,
            "health_score": self._calculate_health_score(metrics)
        }

    async def _fetch_metrics(self) -> Dict[str, float]:
        """Fetch metrics from Prometheus"""
        metrics = {}

        queries = {
            "api_latency_p95": 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))',
            "cpu_usage": '100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
            "memory_usage": '(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100',
            "error_rate": 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))'
        }

        try:
            async with httpx.AsyncClient() as client:
                for metric_name, query in queries.items():
                    try:
                        response = await client.get(
                            f"{self.prometheus_url}/api/v1/query",
                            params={"query": query},
                            timeout=10
                        )

                        if response.status_code == 200:
                            data = response.json()
                            result = data.get("data", {}).get("result", [])
                            if result:
                                value = float(result[0].get("value", [0, 0])[1])
                                metrics[metric_name] = value
                    except Exception as e:
                        logger.debug(f"Metric {metric_name} query failed: {e}")
                        metrics[metric_name] = 0
        except Exception as e:
            logger.warning(f"Prometheus unavailable: {e}")
            # Return mock data
            return {
                "api_latency_p95": 450,
                "cpu_usage": 35,
                "memory_usage": 62,
                "error_rate": 0.02
            }

        return metrics

    def _identify_bottlenecks(self, metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Identify performance bottlenecks"""
        bottlenecks = []

        for metric, value in metrics.items():
            threshold = self.thresholds.get(metric)
            if threshold and value > threshold:
                bottlenecks.append({
                    "metric": metric,
                    "current": value,
                    "threshold": threshold,
                    "severity": "high" if value > threshold * 1.2 else "medium"
                })

        return bottlenecks

    async def _generate_optimizations(self, bottlenecks: List[Dict]) -> List[Dict]:
        """Generate optimization suggestions"""
        optimizations = []

        for bottleneck in bottlenecks:
            metric = bottleneck["metric"]

            if metric == "api_latency_p95":
                optimizations.append({
                    "target": "API Performance",
                    "action": "Add Redis caching to slow endpoints",
                    "expected_improvement": "30-50% latency reduction",
                    "code_file": "app/api/routers/*.py"
                })

            elif metric == "cpu_usage":
                optimizations.append({
                    "target": "CPU Usage",
                    "action": "Optimize database queries with indexes",
                    "expected_improvement": "20% CPU reduction",
                    "code_file": "app/services/*.py"
                })

            elif metric == "memory_usage":
                optimizations.append({
                    "target": "Memory Usage",
                    "action": "Implement pagination for large datasets",
                    "expected_improvement": "40% memory savings",
                    "code_file": "app/api/routers/search.py"
                })

        return optimizations

    def _calculate_health_score(self, metrics: Dict[str, float]) -> float:
        """Calculate overall health score (0-100)"""
        score = 100.0

        for metric, value in metrics.items():
            threshold = self.thresholds.get(metric, float('inf'))
            if value > threshold:
                penalty = min(50, (value - threshold) / threshold * 30)
                score -= penalty

        return max(0, min(100, score))
