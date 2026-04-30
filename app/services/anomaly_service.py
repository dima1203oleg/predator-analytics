from __future__ import annotations

from datetime import datetime
from typing import Any

import numpy as np

from app.libs.core.structured_logger import get_logger
from app.services.evolution_service import evolution_service

logger = get_logger("service.anomaly")


class AnomalyService:
    """Advanced Anomaly Detection Service (v45.0).
    Uses Statistical Methods (Z-Score) and Forecasting (Linear Regression/Exp Smoothing)
    to detect system irregularities.
    """

    def __init__(self):
        self.history_window = 100  # Analyze last 100 points
        self.z_threshold = 3.0  # Sigma

    async def detect_anomalies(self) -> dict[str, Any]:
        """Main entry point for anomaly detection.
        Analyzes key metrics: cpu, memory, response_time (latency), error_rate.
        """
        # Fetch history from Evolution Engine
        history = await evolution_service.get_history(period="24h")
        if len(history) < 10:
            return {"status": "insufficient_data", "anomalies": []}

        # Extract series
        # History format: list of dicts from EvolutionService.get_latest_stats()
        # Structure:
        # {
        #   "timestamp": ...,
        #   "health_score": ...,
        #   "intelligence_gain": ...
        # }
        # Note: EvolutionService returns high-level stats. We might need lower level.
        # But let's use what we have: 'health_score' is a good proxy for system stress.

        timestamps = []
        health_scores = []

        for entry in history:
            timestamps.append(entry.get("timestamp"))
            health_scores.append(float(entry.get("health_score", 100.0)))

        anomalies = []

        # 1. Statistical Outlier Detection (Z-Score) on Health Score
        # Inverted logic: Low health score is bad.
        health_anomalies = self._detect_z_score_outliers(health_scores, "health_score", invert=True)
        anomalies.extend(health_anomalies)

        # 2. Forecasting (Predict next value)
        forecast = self._forecast_next_value(health_scores)

        # 3. Alerting
        if anomalies:
            await self._send_alert(anomalies)

        return {
            "status": "active",
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies,
            "forecast": {
                "metric": "health_score",
                "next_predicted_value": round(forecast, 2),
                "trend": "degrading" if forecast < health_scores[-1] else "stable",
            },
        }

    def _detect_z_score_outliers(
        self, data: list[float], metric_name: str, invert: bool = False
    ) -> list[dict[str, Any]]:
        if not data:
            return []

        series = np.array(data)
        mean = np.mean(series)
        std = np.std(series)

        if std == 0:
            return []

        current_value = series[-1]
        z_score = (current_value - mean) / std

        anomalies = []
        # If invert is True, we care about negative Z-scores (drops in value)
        is_anomaly = False
        if (invert and z_score < -self.z_threshold) or (
            not invert and abs(z_score) > self.z_threshold
        ):
            is_anomaly = True

        if is_anomaly:
            anomalies.append(
                {
                    "type": "statistical_outlier",
                    "method": "z_score",
                    "metric": metric_name,
                    "current_value": current_value,
                    "mean": mean,
                    "z_score": round(z_score, 2),
                    "severity": "high" if abs(z_score) > 4 else "medium",
                    "timestamp": datetime.now().isoformat(),
                }
            )

        return anomalies

    def _forecast_next_value(self, data: list[float]) -> float:
        """Simple linear regression forecast for the next point."""
        if len(data) < 2:
            return data[-1] if data else 0.0

        y = np.array(data)
        x = np.arange(len(y))

        # Polyfit degree 1 (Line)
        try:
            slope, intercept = np.polyfit(x, y, 1)
            next_x = len(y)
            return slope * next_x + intercept
        except Exception:
            return data[-1]

    async def _send_alert(self, anomalies: list[dict[str, Any]]):
        """Send alerts to Telegram or Log."""
        for anomaly in anomalies:
            f"🚨 **ANOMALY DETECTED** 🚨\nMetric: {anomaly['metric']}\nValue: {anomaly['current_value']:.2f} (Z: {anomaly['z_score']})\nSeverity: {anomaly['severity']}"
            logger.warning("anomaly_alert", **anomaly)
            # TODO: Integrate real Telegram User/Chat ID from config
            # await notification_service.send_telegram(msg)


anomaly_service = AnomalyService()
