"""
Ingestion Circuit Breaker & Resource Guards
Protects the system from toxic/anomalous uploads that could consume resources.
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import psutil
import asyncio
import logging

logger = logging.getLogger(__name__)


class AnomalyType(str, Enum):
    """Types of detected anomalies"""
    FILE_SIZE_ANOMALY = "file_size_anomaly"
    PARSING_TIMEOUT = "parsing_timeout"
    MEMORY_SPIKE = "memory_spike"
    CPU_SPIKE = "cpu_spike"
    MALFORMED_DATA = "malformed_data"
    EXCESSIVE_CHUNKS = "excessive_chunks"


@dataclass
class ResourceLimits:
    """Resource limits for ingestion jobs"""
    max_cpu_minutes: float = 10.0
    max_memory_gb: float = 4.0
    max_chunks: int = 1_000_000
    max_processing_time_minutes: int = 30
    max_retries: int = 3


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5
    timeout_seconds: int = 60
    half_open_after_seconds: int = 300


class CircuitBreakerState(str, Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Blocking requests
    HALF_OPEN = "half_open"  # Testing recovery


class IngestionCircuitBreaker:
    """
    Circuit breaker for ingestion pipeline.

    Prevents cascading failures from toxic files by:
    - Monitoring resource usage
    - Detecting anomalies
    - Auto-aborting problematic jobs
    - Temporarily blocking ingestion if needed
    """

    def __init__(
        self,
        limits: ResourceLimits = ResourceLimits(),
        config: CircuitBreakerConfig = CircuitBreakerConfig()
    ):
        self.limits = limits
        self.config = config
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state_changed_at = datetime.utcnow()

    async def check_before_ingestion(self, file_size_bytes: int) -> tuple[bool, Optional[str]]:
        """
        Check if ingestion should proceed.

        Returns:
            (allowed, reason) - True if allowed, False with reason if blocked
        """
        # Check circuit breaker state
        if self.state == CircuitBreakerState.OPEN:
            if self._should_transition_to_half_open():
                self.state = CircuitBreakerState.HALF_OPEN
                self.state_changed_at = datetime.utcnow()
                logger.info("Circuit breaker transitioned to HALF_OPEN")
            else:
                return False, "Circuit breaker is OPEN - ingestion temporarily disabled"

        # Check system resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()

        if cpu_percent > 90:
            return False, f"System CPU too high: {cpu_percent}%"

        if memory.percent > 90:
            return False, f"System memory too high: {memory.percent}%"

        # Check file size (basic anomaly detection)
        max_size_bytes = self.limits.max_memory_gb * 1024 * 1024 * 1024
        if file_size_bytes > max_size_bytes:
            return False, f"File size {file_size_bytes / 1e9:.2f}GB exceeds limit {self.limits.max_memory_gb}GB"

        return True, None

    async def monitor_job(
        self,
        job_id: str,
        process_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Monitor a running ingestion job.

        Returns resource usage statistics and anomaly detection results.
        """
        start_time = datetime.utcnow()
        max_memory_mb = 0
        total_cpu_seconds = 0

        try:
            if process_id:
                process = psutil.Process(process_id)

                # Monitor for up to max processing time
                timeout = self.limits.max_processing_time_minutes * 60
                elapsed = 0

                while elapsed < timeout:
                    try:
                        # Get current resource usage
                        cpu_percent = process.cpu_percent(interval=1)
                        memory_info = process.memory_info()
                        memory_mb = memory_info.rss / 1024 / 1024

                        # Track maximums
                        max_memory_mb = max(max_memory_mb, memory_mb)
                        total_cpu_seconds += cpu_percent / 100

                        # Check limits
                        if memory_mb / 1024 > self.limits.max_memory_gb:
                            logger.warning(
                                f"Job {job_id} exceeded memory limit: "
                                f"{memory_mb / 1024:.2f}GB > {self.limits.max_memory_gb}GB"
                            )
                            await self._abort_job(job_id, AnomalyType.MEMORY_SPIKE)
                            return self._create_abort_result(AnomalyType.MEMORY_SPIKE)

                        if total_cpu_seconds / 60 > self.limits.max_cpu_minutes:
                            logger.warning(
                                f"Job {job_id} exceeded CPU limit: "
                                f"{total_cpu_seconds / 60:.2f}min > {self.limits.max_cpu_minutes}min"
                            )
                            await self._abort_job(job_id, AnomalyType.CPU_SPIKE)
                            return self._create_abort_result(AnomalyType.CPU_SPIKE)

                        # Check if process still exists
                        if not process.is_running():
                            break

                        await asyncio.sleep(1)
                        elapsed += 1

                    except psutil.NoSuchProcess:
                        break

                # Check for timeout
                if elapsed >= timeout:
                    logger.warning(f"Job {job_id} timed out after {elapsed}s")
                    await self._abort_job(job_id, AnomalyType.PARSING_TIMEOUT)
                    return self._create_abort_result(AnomalyType.PARSING_TIMEOUT)

        except Exception as e:
            logger.error(f"Error monitoring job {job_id}: {e}")
            self._record_failure()

        duration = (datetime.utcnow() - start_time).total_seconds()

        return {
            "job_id": job_id,
            "duration_seconds": duration,
            "max_memory_mb": max_memory_mb,
            "total_cpu_minutes": total_cpu_seconds / 60,
            "anomaly_detected": False
        }

    async def validate_file_content(
        self,
        file_path: str,
        file_type: str
    ) -> tuple[bool, Optional[AnomalyType], Optional[str]]:
        """
        Validate file content for anomalies before processing.

        Returns:
            (is_valid, anomaly_type, error_message)
        """
        try:
            # Basic file integrity checks
            import os

            if not os.path.exists(file_path):
                return False, AnomalyType.MALFORMED_DATA, "File not found"

            file_size = os.path.getsize(file_path)

            if file_size == 0:
                return False, AnomalyType.MALFORMED_DATA, "Empty file"

            # Type-specific validation
            if file_type in ["xlsx", "xls", "csv"]:
                # Try to open with pandas to check integrity
                import pandas as pd

                try:
                    # Read only first few rows to check format
                    if file_type == "csv":
                        df = pd.read_csv(file_path, nrows=10)
                    else:
                        df = pd.read_excel(file_path, nrows=10)

                    if len(df.columns) == 0:
                        return False, AnomalyType.MALFORMED_DATA, "No columns found"

                except Exception as e:
                    return False, AnomalyType.MALFORMED_DATA, f"Cannot parse file: {e}"

            elif file_type == "pdf":
                # Basic PDF validation
                try:
                    with open(file_path, 'rb') as f:
                        header = f.read(5)
                        if header != b'%PDF-':
                            return False, AnomalyType.MALFORMED_DATA, "Invalid PDF header"
                except Exception as e:
                    return False, AnomalyType.MALFORMED_DATA, f"Cannot read PDF: {e}"

            return True, None, None

        except Exception as e:
            logger.error(f"File validation error: {e}")
            return False, AnomalyType.MALFORMED_DATA, str(e)

    async def _abort_job(self, job_id: str, anomaly_type: AnomalyType) -> None:
        """Abort a job due to anomaly detection"""
        logger.error(f"ABORTING job {job_id} due to {anomaly_type.value}")
        self._record_failure()

        # TODO: Integrate with job manager to actually kill the job
        # await job_manager.abort(job_id, reason=anomaly_type.value)

    def _record_failure(self) -> None:
        """Record a failure and update circuit breaker state"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.failure_count >= self.config.failure_threshold:
            if self.state != CircuitBreakerState.OPEN:
                self.state = CircuitBreakerState.OPEN
                self.state_changed_at = datetime.utcnow()
                logger.error(
                    f"Circuit breaker OPENED after {self.failure_count} failures. "
                    f"Ingestion disabled for {self.config.half_open_after_seconds}s"
                )

    def _should_transition_to_half_open(self) -> bool:
        """Check if enough time has passed to try recovery"""
        if self.state != CircuitBreakerState.OPEN:
            return False

        time_in_open = (datetime.utcnow() - self.state_changed_at).total_seconds()
        return time_in_open >= self.config.half_open_after_seconds

    def _create_abort_result(self, anomaly_type: AnomalyType) -> Dict[str, Any]:
        """Create result for aborted job"""
        return {
            "aborted": True,
            "anomaly_type": anomaly_type.value,
            "circuit_breaker_state": self.state.value
        }

    def reset(self) -> None:
        """Reset circuit breaker to closed state"""
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.state_changed_at = datetime.utcnow()
        logger.info("Circuit breaker RESET to CLOSED")

    def get_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status"""
        return {
            "state": self.state.value,
            "failure_count": self.failure_count,
            "last_failure": self.last_failure_time.isoformat() if self.last_failure_time else None,
            "state_changed_at": self.state_changed_at.isoformat(),
            "limits": {
                "max_cpu_minutes": self.limits.max_cpu_minutes,
                "max_memory_gb": self.limits.max_memory_gb,
                "max_chunks": self.limits.max_chunks,
                "max_processing_time_minutes": self.limits.max_processing_time_minutes
            }
        }


# Global circuit breaker instance
circuit_breaker = IngestionCircuitBreaker()


def get_circuit_breaker() -> IngestionCircuitBreaker:
    """Get the global circuit breaker instance"""
    return circuit_breaker
