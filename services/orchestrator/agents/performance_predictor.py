"""
Performance Predictor - AI-Powered Performance Forecasting
Predicts system performance and proactively optimizes
"""
import json
import math
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import deque
import logging

logger = logging.getLogger("agents.performance_predictor")


@dataclass
class MetricPoint:
    """A single metric measurement"""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)


@dataclass
class Prediction:
    """A performance prediction"""
    metric: str
    current_value: float
    predicted_value: float
    prediction_time: datetime
    confidence: float
    trend: str  # increasing, decreasing, stable
    alert_level: str  # normal, warning, critical
    recommendations: List[str] = field(default_factory=list)


class TimeSeriesBuffer:
    """
    Efficient circular buffer for time series data
    """
    def __init__(self, max_size: int = 1000):
        self.data: deque = deque(maxlen=max_size)

    def add(self, point: MetricPoint):
        self.data.append(point)

    def get_recent(self, minutes: int = 60) -> List[MetricPoint]:
        cutoff = datetime.now() - timedelta(minutes=minutes)
        return [p for p in self.data if p.timestamp > cutoff]

    def get_values(self, minutes: int = 60) -> List[float]:
        return [p.value for p in self.get_recent(minutes)]

    def get_average(self, minutes: int = 60) -> float:
        values = self.get_values(minutes)
        return sum(values) / len(values) if values else 0.0

    def get_trend(self, minutes: int = 60) -> Tuple[float, str]:
        """Calculate trend (slope and direction)"""
        points = self.get_recent(minutes)
        if len(points) < 2:
            return 0.0, "stable"

        # Simple linear regression
        n = len(points)
        x = list(range(n))
        y = [p.value for p in points]

        x_mean = sum(x) / n
        y_mean = sum(y) / n

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return 0.0, "stable"

        slope = numerator / denominator

        if abs(slope) < 0.01:
            direction = "stable"
        elif slope > 0:
            direction = "increasing"
        else:
            direction = "decreasing"

        return slope, direction


class PerformancePredictor:
    """
    AI-powered performance forecasting and optimization

    Features:
    - Real-time metric collection
    - Trend analysis
    - Anomaly detection
    - Predictive alerts
    - Proactive recommendations
    """

    def __init__(self, redis_client=None, llm_client=None):
        self.redis = redis_client
        self.llm = llm_client

        # Metric buffers
        self.metrics: Dict[str, TimeSeriesBuffer] = {}

        # Thresholds (can be learned over time)
        self.thresholds: Dict[str, Dict[str, float]] = {
            "api_latency_ms": {"warning": 500, "critical": 1000},
            "error_rate": {"warning": 0.05, "critical": 0.10},
            "memory_usage_pct": {"warning": 70, "critical": 90},
            "cpu_usage_pct": {"warning": 70, "critical": 90},
            "queue_size": {"warning": 100, "critical": 500},
            "llm_latency_ms": {"warning": 3000, "critical": 10000},
        }

        # Learned baselines
        self.baselines: Dict[str, float] = {}

        # Prediction horizon (minutes)
        self.prediction_horizon = 15

    async def record_metric(self, name: str, value: float, tags: Dict = None):
        """Record a metric value"""
        if name not in self.metrics:
            self.metrics[name] = TimeSeriesBuffer()

        point = MetricPoint(name=name, value=value, tags=tags or {})
        self.metrics[name].add(point)

        # Update baseline
        await self._update_baseline(name)

        # Store in Redis for persistence
        if self.redis:
            try:
                await self.redis.lpush(f"metrics:{name}", json.dumps({
                    "value": value,
                    "timestamp": datetime.now().isoformat(),
                    "tags": tags or {}
                }))
                await self.redis.ltrim(f"metrics:{name}", 0, 999)
            except Exception as e:
                logger.debug(f"Redis metric store failed: {e}")

    async def predict(self, metric_name: str) -> Optional[Prediction]:
        """
        Predict future value of a metric
        """
        if metric_name not in self.metrics:
            return None

        buffer = self.metrics[metric_name]
        current_value = buffer.get_average(5)  # Last 5 min average
        slope, trend = buffer.get_trend(30)  # 30 min trend

        # Simple linear prediction
        minutes_ahead = self.prediction_horizon
        predicted_value = current_value + (slope * minutes_ahead)

        # Calculate confidence based on data stability
        values = buffer.get_values(30)
        if len(values) >= 3:
            std_dev = self._std_dev(values)
            mean = sum(values) / len(values)
            cv = std_dev / mean if mean != 0 else float('inf')
            confidence = max(0.1, min(0.95, 1.0 - cv))
        else:
            confidence = 0.5

        # Determine alert level
        alert_level = "normal"
        thresholds = self.thresholds.get(metric_name, {})
        if predicted_value >= thresholds.get("critical", float('inf')):
            alert_level = "critical"
        elif predicted_value >= thresholds.get("warning", float('inf')):
            alert_level = "warning"

        # Generate recommendations
        recommendations = await self._generate_recommendations(
            metric_name, current_value, predicted_value, trend, alert_level
        )

        return Prediction(
            metric=metric_name,
            current_value=current_value,
            predicted_value=predicted_value,
            prediction_time=datetime.now() + timedelta(minutes=minutes_ahead),
            confidence=confidence,
            trend=trend,
            alert_level=alert_level,
            recommendations=recommendations
        )

    async def detect_anomaly(self, metric_name: str) -> Tuple[bool, float]:
        """
        Detect if current value is anomalous
        Returns (is_anomaly, anomaly_score)
        """
        if metric_name not in self.metrics:
            return False, 0.0

        buffer = self.metrics[metric_name]
        values = buffer.get_values(60)

        if len(values) < 10:
            return False, 0.0

        current = values[-1] if values else 0
        mean = sum(values) / len(values)
        std_dev = self._std_dev(values)

        if std_dev == 0:
            return False, 0.0

        # Z-score based anomaly detection
        z_score = abs(current - mean) / std_dev

        is_anomaly = z_score > 3.0  # 3 sigma rule
        anomaly_score = min(z_score / 5.0, 1.0)  # Normalize to 0-1

        if is_anomaly:
            logger.warning(f"🔴 Anomaly detected: {metric_name} = {current:.2f} (z-score: {z_score:.2f})")

        return is_anomaly, anomaly_score

    async def get_all_predictions(self) -> List[Prediction]:
        """Get predictions for all tracked metrics"""
        predictions = []

        for metric_name in self.metrics.keys():
            pred = await self.predict(metric_name)
            if pred:
                predictions.append(pred)

        return predictions

    async def get_health_forecast(self) -> Dict:
        """Get overall system health forecast"""
        predictions = await self.get_all_predictions()

        # Count by alert level
        critical_count = sum(1 for p in predictions if p.alert_level == "critical")
        warning_count = sum(1 for p in predictions if p.alert_level == "warning")

        # Overall health
        if critical_count > 0:
            overall_health = "critical"
        elif warning_count > 2:
            overall_health = "degraded"
        elif warning_count > 0:
            overall_health = "fair"
        else:
            overall_health = "healthy"

        # Collect recommendations
        all_recommendations = []
        for pred in predictions:
            if pred.alert_level != "normal":
                all_recommendations.extend(pred.recommendations)

        return {
            "health": overall_health,
            "critical_metrics": critical_count,
            "warning_metrics": warning_count,
            "predictions": [
                {
                    "metric": p.metric,
                    "current": p.current_value,
                    "predicted": p.predicted_value,
                    "trend": p.trend,
                    "alert": p.alert_level
                }
                for p in predictions
            ],
            "top_recommendations": all_recommendations[:5],
            "forecast_time": datetime.now().isoformat()
        }

    async def _update_baseline(self, metric_name: str):
        """Update learned baseline for metric"""
        if metric_name not in self.metrics:
            return

        buffer = self.metrics[metric_name]
        values = buffer.get_values(60)

        if len(values) >= 10:
            # Use median for robustness
            sorted_values = sorted(values)
            n = len(sorted_values)
            if n % 2 == 0:
                median = (sorted_values[n//2 - 1] + sorted_values[n//2]) / 2
            else:
                median = sorted_values[n//2]

            # Exponential moving average with existing baseline
            alpha = 0.1
            if metric_name in self.baselines:
                self.baselines[metric_name] = alpha * median + (1 - alpha) * self.baselines[metric_name]
            else:
                self.baselines[metric_name] = median

    async def _generate_recommendations(
        self,
        metric: str,
        current: float,
        predicted: float,
        trend: str,
        alert_level: str
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        if alert_level == "normal":
            return recommendations

        # Rule-based recommendations
        if metric == "api_latency_ms":
            if trend == "increasing":
                recommendations.append("Consider enabling response caching")
                recommendations.append("Check database query performance")
            if predicted > 1000:
                recommendations.append("CRITICAL: Add more backend instances")

        elif metric == "error_rate":
            if predicted > current:
                recommendations.append("Review recent code deployments")
                recommendations.append("Check external service dependencies")

        elif metric == "memory_usage_pct":
            if predicted > 80:
                recommendations.append("Trigger garbage collection")
                recommendations.append("Clear application caches")
            if predicted > 90:
                recommendations.append("CRITICAL: Scale up memory or add instances")

        elif metric == "cpu_usage_pct":
            if predicted > 80:
                recommendations.append("Identify CPU-intensive operations")
                recommendations.append("Consider horizontal scaling")

        elif metric == "llm_latency_ms":
            if trend == "increasing":
                recommendations.append("Switch to faster LLM provider")
                recommendations.append("Enable LLM response caching")

        elif metric == "queue_size":
            if trend == "increasing":
                recommendations.append("Increase consumer workers")
                recommendations.append("Check for processing bottlenecks")

        # If LLM available, get AI recommendations
        if self.llm and alert_level == "critical":
            try:
                ai_rec = await self._get_ai_recommendation(metric, current, predicted, trend)
                if ai_rec:
                    recommendations.insert(0, f"AI: {ai_rec}")
            except:
                pass

        return recommendations

    async def _get_ai_recommendation(self, metric: str, current: float, predicted: float, trend: str) -> Optional[str]:
        """Get AI-powered recommendation"""
        prompt = f"""System metric alert:
Metric: {metric}
Current: {current:.2f}
Predicted (15min): {predicted:.2f}
Trend: {trend}

Provide ONE specific, actionable recommendation to prevent this issue.
Keep response under 50 words."""

        try:
            response = await self.llm.generate(
                prompt=prompt,
                system="You are a DevOps expert. Give precise recommendations.",
                temperature=0.3,
                max_tokens=100
            )
            return response.strip()[:200]
        except:
            return None

    def _std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation"""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)

    async def predict_impact(self, code_change: str) -> Dict:
        """
        Predict the performance impact of a proposed code change.
        """
        impact_analysis = {
            "risk_level": "low",
            "estimated_latency_change": "+0ms",
            "estimated_memory_change": "+0MB",
            "concerns": []
        }

        # heuristic analysis
        if "sleep(" in code_change or "await asyncio.sleep" in code_change:
            impact_analysis["risk_level"] = "medium"
            impact_analysis["estimated_latency_change"] = "+100ms"
            impact_analysis["concerns"].append("Introduces artificial delay")

        if "while True" in code_change and "sleep" not in code_change:
            impact_analysis["risk_level"] = "high"
            impact_analysis["concerns"].append("Potential infinite loop without sleep")

        if len(code_change) > 5000:
             impact_analysis["risk_level"] = "medium"
             impact_analysis["concerns"].append("Large code block change")

        # If LLM available, get deeper analysis
        if self.llm:
            try:
                msg = await self.llm.generate(
                   prompt=f"Analyze performance impact of this python code:\n\n{code_change[:1000]}\n\nOutput JSON with keys: risk (low/med/high), reasoning.",
                   system="You are a performance engineer.",
                   max_tokens=150
                )
                if msg:
                     # very rough parsing
                     if "high" in msg.lower(): impact_analysis["risk_level"] = "high"
                     elif "medium" in msg.lower(): impact_analysis["risk_level"] = "medium"
            except:
                pass

        return impact_analysis
class AutoScaler:
    """
    Automatic scaling recommendations based on predictions
    """

    def __init__(self, predictor: PerformancePredictor):
        self.predictor = predictor
        self.scaling_history: List[Dict] = []

    async def get_scaling_recommendation(self) -> Dict:
        """Get scaling recommendation based on predictions"""
        forecast = await self.predictor.get_health_forecast()

        recommendation = {
            "action": "none",
            "reason": "",
            "target_resources": {},
            "urgency": "low",
            "timestamp": datetime.now().isoformat()
        }

        # Check predictions for scaling triggers
        for pred in forecast.get("predictions", []):
            metric = pred["metric"]
            alert = pred["alert"]
            trend = pred["trend"]

            if metric in ["cpu_usage_pct", "memory_usage_pct"] and alert == "critical":
                recommendation["action"] = "scale_up"
                recommendation["reason"] = f"{metric} predicted to reach critical levels"
                recommendation["urgency"] = "high"
                recommendation["target_resources"]["instances"] = "+1"

            elif metric == "queue_size" and alert == "warning" and trend == "increasing":
                recommendation["action"] = "scale_workers"
                recommendation["reason"] = "Queue size growing, need more workers"
                recommendation["urgency"] = "medium"
                recommendation["target_resources"]["workers"] = "+2"

            elif metric == "api_latency_ms" and alert == "critical":
                recommendation["action"] = "scale_up"
                recommendation["reason"] = "API latency too high"
                recommendation["urgency"] = "high"
                recommendation["target_resources"]["instances"] = "+1"

        # Check for scale down opportunity
        if forecast.get("health") == "healthy":
            # All metrics normal, check if we can scale down
            cpu_pred = next((p for p in forecast["predictions"] if p["metric"] == "cpu_usage_pct"), None)
            if cpu_pred and cpu_pred["predicted"] < 30:
                recommendation["action"] = "scale_down_candidate"
                recommendation["reason"] = "Low resource utilization"
                recommendation["urgency"] = "low"

        return recommendation
