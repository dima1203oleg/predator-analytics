from __future__ import annotations


"""ETL Constitutional Monitor - AZR Engine v28-S
Real-time monitoring and validation of the ETL Pipeline.
"""
import asyncio
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

from app.libs.core.etl_arbiter import ETLSovereignArbiter
from app.libs.core.etl_state_machine_v28s import ETLState, ETLStateMachineV28S


logger = logging.getLogger(__name__)

class ETLConstitutionalMonitor:
    """Реалізація моніторингу ETL з конституційними перевірками."""

    def __init__(self):
        # self.open_telemetry = OpenTelemetryClient() # Integrated via otel.py
        self.arbiter = ETLSovereignArbiter()
        self.state_machine = ETLStateMachineV28S()

    async def monitor_job(self, job_id: str, job_data: dict[str, Any]):
        """Validate a single ETL job's compliance in real-time."""
        # 1. Collect real metrics (provided in job_data)
        metrics = self._extract_metrics(job_data)

        # 2. Check constitutional compliance via Arbiter
        compliance = await self.arbiter.monitor_etl_job(job_id, job_data)

        # 3. Detect anomalies locally
        anomalies = self.detect_anomalies(job_data, metrics)

        if anomalies:
            logger.warning(f"Anomalies detected in job {job_id}: {anomalies}")
            # Potentially trigger arbiter action here if not already caught
            if compliance["constitutional_compliance"]:
                # If arbiter didn't catch it but monitor did, escalate
                await self.arbiter.handle_violations(job_id, ["ANOMALY:" + a for a in anomalies])

        return {
            "job_id": job_id,
            "compliance": compliance,
            "anomalies": anomalies,
            "real_progress": metrics["progress_percent"],
            "timestamp": datetime.utcnow().isoformat()
        }

    def _extract_metrics(self, job: dict) -> dict:
        """Extract real-time metrics for monitoring."""
        progress = job.get("progress", {})
        return {
            "job_id": job.get("job_id"),
            "state": job.get("state"),
            "progress_percent": progress.get("percent", 0),
            "records_processed": progress.get("records_processed", 0),
            "records_indexed": progress.get("records_indexed", 0),
            "timestamps": job.get("timestamps", {})
        }

    def detect_anomalies(self, job: dict, metrics: dict) -> list[str]:
        """Виявлення аномалій в реальному часі."""
        anomalies = []
        state = job.get("state")

        # 1. Зависання прогресу (Simulated check)
        # In a real loop, we would compare with last_seen_metrics

        # 2. Неможливий стан
        if state == ETLState.INDEXED and metrics["records_indexed"] == 0:
            if not job.get("meta", {}).get("allow_empty_index"):
                anomalies.append("zero_indexing_with_data")

        # 3. Прогрес > 100%
        if metrics["progress_percent"] > 100:
            anomalies.append("progress_overflow")

        # 4. Відсутність прогресу при активному стані
        # (Would need historical context)

        return anomalies

    async def start_continuous_monitoring(self, get_active_jobs_fn):
        """Безперервний моніторинг ETL Pipeline (Background task)."""
        logger.info("Starting continuous ETL constitutional monitoring...")
        while True:
            try:
                active_jobs = await get_active_jobs_fn()
                for job in active_jobs:
                    await self.monitor_job(job["job_id"], job)
            except Exception as e:
                logger.exception(f"Error in continuous monitoring loop: {e}")
            await asyncio.sleep(5) # 5s interval for mock, 1s for production
