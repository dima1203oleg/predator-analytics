from functools import lru_cache
from .pipeline_monitor import PipelineMonitor
from .incident_manager import IncidentManager

@lru_cache()
def get_pipeline_monitor() -> PipelineMonitor:
    return PipelineMonitor()

@lru_cache()
def get_incident_manager() -> IncidentManager:
    return IncidentManager()

__all__ = [
    "PipelineMonitor", "get_pipeline_monitor",
    "IncidentManager", "get_incident_manager"
]
