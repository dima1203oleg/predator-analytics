from functools import lru_cache

from .incident_manager import IncidentManager
from .pipeline_monitor import PipelineMonitor


@lru_cache
def get_pipeline_monitor() -> PipelineMonitor:
    return PipelineMonitor()

@lru_cache
def get_incident_manager() -> IncidentManager:
    return IncidentManager()

__all__ = [
    "IncidentManager",
    "PipelineMonitor",
    "get_incident_manager",
    "get_pipeline_monitor"
]
