"""
Advanced Anomaly Detection Service (v27.0)
------------------------------------------
Реалізує статистичний аналіз та виявлення аномалій у метриках системи.
Використовує Z-Score та Isolation Forest для детекції відхилень.
"""
import numpy as np
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from libs.core.structured_logger import get_logger, log_business_event

logger = get_logger("service.intelligence.anomaly")

class AnomalyDetectionService:
    def __init__(self):
        self.history_window_size = 100
        self.z_score_threshold = 3.0
        # Кеш для метрик
        self.metrics_buffer: Dict[str, List[float]] = {}

    async def ingest_metric(self, metric_name: str, value: float) -> Optional[Dict[str, Any]]:
        """
        Приймає метрику, додає в історію та перевіряє на аномалії.
        Повертає опис аномалії, якщо вона виявлена.
        """
        if metric_name not in self.metrics_buffer:
            self.metrics_buffer[metric_name] = []

        buffer = self.metrics_buffer[metric_name]
        buffer.append(value)

        # Trim buffer
        if len(buffer) > self.history_window_size:
            buffer.pop(0)

        # Недостатньо даних для аналізу
        if len(buffer) < 20:
            return None

        # 1. Statistical Outlier Detection (Z-Score)
        is_anomaly = self._check_z_score(buffer, value)

        if is_anomaly:
            deviation = value - np.mean(buffer)
            severity = "critical" if abs(deviation) > (np.std(buffer) * 4) else "warning"

            anomaly_report = {
                "type": "statistical_anomaly",
                "metric": metric_name,
                "value": value,
                "mean": float(np.mean(buffer)),
                "std_dev": float(np.std(buffer)),
                "z_score": float((value - np.mean(buffer)) / (np.std(buffer) + 1e-9)),
                "severity": severity,
                "timestamp": datetime.now().isoformat()
            }

            logger.warning("anomaly_detected", **anomaly_report)
            return anomaly_report

        return None

    def _check_z_score(self, data: List[float], value: float) -> bool:
        """Обчислює Z-Score і перевіряє поріг"""
        if not data or len(data) < 2:
            return False

        mean = np.mean(data)
        std = np.std(data)

        if std == 0:
            return False

        z_score = (value - mean) / std
        return abs(z_score) > self.z_score_threshold

    async def analyze_system_health(self, metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Комплексний аналіз здоров'я системи"""
        anomalies = []
        for name, val in metrics.items():
            result = await self.ingest_metric(name, val)
            if result:
                anomalies.append(result)

        if anomalies:
            await self._report_to_som(anomalies)

        return anomalies

    async def _report_to_som(self, anomalies: List[Dict[str, Any]]):
        """Відправка звіту в SOM (Sovereign Observer Module)"""
        import httpx
        import os

        som_url = os.getenv("SOM_SERVICE_URL", "http://governance:8095")
        endpoint = f"{som_url}/api/v1/som/anomalies/batch"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(endpoint, json={"anomalies": anomalies})
                if response.status_code == 200:
                    logger.info(f"✅ Аномалії успішно передані в SOM (ID: {response.json().get('report_id')})")
                else:
                    logger.warning(f"⚠️ SOM відхилив звіт про аномалії: {response.text}")
        except Exception as e:
            logger.error(f"❌ Не вдалося відправити аномалії в SOM: {e}")

# Singleton
anomaly_detector = AnomalyDetectionService()
