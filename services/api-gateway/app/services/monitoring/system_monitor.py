"""
System Monitor Service (v27.0)
------------------------------
Collects system metrics (CPU, RAM, Disk) and feeds them to the Anomaly Detector.
"""
import asyncio
import psutil
import logging
from typing import Dict

from app.services.intelligence.anomaly_service import anomaly_detector
from libs.core.structured_logger import get_logger

logger = get_logger("service.monitor")

class SystemMonitorService:
    def __init__(self):
        self.is_running = False
        self.interval_seconds = 30 # Check every 30 seconds
        # Seed CPU measurement
        psutil.cpu_percent(interval=None)

    async def start_monitoring(self):
        """Start background monitoring loop"""
        if self.is_running:
            return

        self.is_running = True
        logger.info("Starting System Monitor...")
        asyncio.create_task(self._monitor_loop())

    async def _monitor_loop(self):
        while self.is_running:
            try:
                # Use to_thread to avoid blocking event loop during metric collection
                metrics = await asyncio.to_thread(self._collect_metrics)

                # Analyze for anomalies
                anomalies = await anomaly_detector.analyze_system_health(metrics)

                if anomalies:
                     logger.info(f"Detected {len(anomalies)} anomalies in system metrics.")

                await asyncio.sleep(self.interval_seconds)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(60)

    def _collect_metrics(self) -> Dict[str, float]:
        """Collect current system metrics"""
        return {
            "system_cpu_percent": psutil.cpu_percent(interval=None),
            "system_memory_percent": psutil.virtual_memory().percent,
            "system_disk_percent": psutil.disk_usage('/').percent
        }

system_monitor = SystemMonitorService()
